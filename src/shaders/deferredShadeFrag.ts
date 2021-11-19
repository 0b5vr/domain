import { GLSLExpression, GLSLFloatExpression, add, addAssign, assign, build, clamp, def, defFn, defInNamed, defOut, defUniformArrayNamed, defUniformNamed, div, dot, eq, glFragDepth, ifChain, insert, main, max, mul, mulAssign, normalize, retFn, sq, sub, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcL } from './modules/calcL';
import { defDoSomethingUsingSamplerArray } from './modules/defDoSomethingUsingSamplerArray';
import { doAnalyticLighting } from './modules/doAnalyticLighting';
import { doShadowMapping } from './modules/doShadowMapping';
import { forEachLights } from './modules/forEachLights';

export const MTL_NONE = 0;
export const MTL_UNLIT = 1;

/**
 * vec4( roughness, metallic, emissive, reserved )
 */
export const MTL_PBR_EMISSIVE = 2;

export const MTL_PBR_EMISSIVE3_ROUGHNESS = 3;

const EPSILON = 1E-3;

export const deferredShadeFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' ); // color.rgba
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' ); // position.xyz, depth
  const sampler2 = defUniformNamed( 'sampler2D', 'sampler2' ); // normal.xyz
  const sampler3 = defUniformNamed( 'sampler2D', 'sampler3' ); // materialParams.xyz, materialId
  const samplerShadow = defUniformArrayNamed( 'sampler2D', 'samplerShadow', 8 );
  // const samplerIBLLUT = defUniformNamed( 'sampler2D', 'samplerIBLLUT' );
  // const samplerEnv = defUniformNamed( 'sampler2D', 'samplerEnv' );
  const samplerAo = defUniformNamed( 'sampler2D', 'samplerAo' );

  const doSomethingUsingSamplerShadow = defDoSomethingUsingSamplerArray( samplerShadow, 8 );
  const fetchShadowMap = defFn( 'vec4', [ 'int', 'vec2' ], ( iLight, uv ) => {
    retFn( doSomethingUsingSamplerShadow(
      iLight,
      ( sampler ) => texture( sampler, uv )
    ) );
  } );

  main( () => {
    const tex0 = texture( sampler0, vUv );
    const tex1 = texture( sampler1, vUv );
    const tex2 = texture( sampler2, vUv );
    const tex3 = texture( sampler3, vUv );

    const color = sw( tex0, 'xyz' );
    const position = sw( tex1, 'xyz' );
    const normal = sw( tex2, 'xyz' );
    const depth = sw( tex1, 'w' );
    const mtlId = sw( tex2, 'w' );

    const rawV = sub( cameraPos, position );
    // const lenV = def( 'float', length( rawV ) );
    const V = def( 'vec3', normalize( rawV ) );

    const dotNV = clamp( dot( normal, V ), EPSILON, 1.0 );

    const outColor = def( 'vec3', vec3( 0.0 ) );

    const ao = def( 'float', sw( texture( samplerAo, vUv ), 'x' ) );

    const shadePBR = (
      roughness: GLSLFloatExpression,
      metallic: GLSLFloatExpression,
    ): GLSLExpression<'vec3'> => {
      // begin lighting
      const shaded = def( 'vec3', vec3( 0.0 ) );

      forEachLights( ( { iLight, lightPos, lightColor, lightNearFar, lightParams, lightPV } ) => {
        const [ L, lenL ] = calcL( lightPos, position );

        const dotNL = max( dot( normal, L ), 1E-3 );

        // shading
        const lightShaded = def( 'vec3', mul(
          lightColor,
          div( 1.0, sq( lenL ) ),
          dotNL,
          doAnalyticLighting( V, L, normal, color, roughness, metallic ),
          ao,
        ) );

        // fetch shadowmap + spot lighting
        const lightProj = def( 'vec4', mul( lightPV, vec4( position, 1.0 ) ) );
        const lightP = def( 'vec3', div( sw( lightProj, 'xyz' ), sw( lightProj, 'w' ) ) );

        mulAssign(
          lightShaded,
          doShadowMapping(
            fetchShadowMap( iLight, add( 0.5, mul( 0.5, sw( lightP, 'xy' ) ) ) ),
            lenL,
            dotNL,
            lightP,
            lightNearFar,
            sw( lightParams, 'x' ),
          ),
        );

        addAssign( shaded, lightShaded );
      } );

      // // cheat the texture seam using noise!
      // vec3 nEnvDiffuse = importanceSampleGGX( vec2( prng( seed ), prng( seed ) * 0.05 ), 2.0, isect.normal );

      // // diffuse ibl
      // vec2 uvEnvDiffuse = vec2(
      //   0.5 + atan( nEnvDiffuse.x, nEnvDiffuse.z ) / TAU,
      //   0.5 + atan( nEnvDiffuse.y, length( nEnvDiffuse.zx ) ) / PI
      // );
      // vec3 texEnvDiffuse = sampleEnvNearest( uvEnvDiffuse, 4.0 ).rgb;
      // shaded += ao * texEnvDiffuse * albedo;

      // // reflective ibl
      // vec3 reflEnvReflective = reflect( -V, isect.normal );
      // vec2 uvEnvReflective = vec2(
      //   0.5 + atan( reflEnvReflective.x, reflEnvReflective.z ) / TAU,
      //   0.5 + atan( reflEnvReflective.y, length( reflEnvReflective.zx ) ) / PI
      // );
      // vec2 brdfEnvReflective = texture( samplerIBLLUT, vec2( NdotV, roughness ) ).xy;
      // vec3 texEnvReflective = sampleEnvLinear( uvEnvReflective, 3.0 * roughness ).rgb;
      // shaded += ao * texEnvReflective * ( brdfEnvReflective.x * f0 + brdfEnvReflective.y );

      return shaded;
    };

    ifChain(
      [ eq( mtlId, MTL_NONE ), () => {
        // do nothing
      } ],
      [ eq( mtlId, MTL_UNLIT ), () => {
        assign( outColor, color );
      } ],
      [ eq( mtlId, MTL_PBR_EMISSIVE ), () => {
        assign( outColor, shadePBR( sw( tex3, 'x' ), sw( tex3, 'y' ) ) );
        addAssign( outColor, mul( sw( tex3, 'z' ), dotNV, color ) );
      } ],
      [ eq( mtlId, MTL_PBR_EMISSIVE3_ROUGHNESS ), () => {
        assign( outColor, shadePBR( sw( tex3, 'w' ), 0.0 ) );
        addAssign( outColor, sw( tex3, 'xyz' ) );
      } ],
    );

    // fog
    // mulAssign( outColor, exp( mul( -0.4, max( sub( lenV, 3.0 ), 0.0 ) ) ) );

    assign( fragColor, vec4( clamp( outColor, 0.0, 1E3 ), 1.0 ) );

    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );
  } );
} );
