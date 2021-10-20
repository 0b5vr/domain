import { GLSLExpression, GLSLFloatExpression, GLSLToken, add, addAssign, arrayIndex, assign, build, clamp, def, defFn, defInNamed, defOut, defUniformArrayNamed, defUniformNamed, div, divAssign, dot, eq, exp, forBreak, forLoop, glFragDepth, gte, ifChain, ifThen, insert, int, length, main, max, mul, mulAssign, normalize, retFn, sq, sub, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { doAnalyticLighting } from './modules/doAnalyticLighting';
import { doShadowMapping } from './modules/doShadowMapping';

export const MTL_NONE = 0;
export const MTL_UNLIT = 1;

/**
 * vec4( roughness, metallic, emissive, reserved )
 */
export const MTL_PBR_EMISSIVE = 2;

export const MTL_PRESHADED_PUNCTUALS = 3;

const EPSILON = 1E-3;

export const deferredShadeFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const lightCount = defUniformNamed( 'int', 'lightCount' );
  const lightNearFar = defUniformArrayNamed( 'vec2', 'lightNearFar', 8 );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const lightPos = defUniformArrayNamed( 'vec3', 'lightPos', 8 );
  const lightColor = defUniformArrayNamed( 'vec3', 'lightColor', 8 );
  const lightParams = defUniformArrayNamed( 'vec4', 'lightParams', 8 );
  const lightPV = defUniformArrayNamed( 'mat4', 'lightPV', 8 );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' ); // color.rgba
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' ); // position.xyz, depth
  const sampler2 = defUniformNamed( 'sampler2D', 'sampler2' ); // normal.xyz
  const sampler3 = defUniformNamed( 'sampler2D', 'sampler3' ); // materialParams.xyz, materialId
  const samplerShadow = defUniformArrayNamed( 'sampler2D', 'samplerShadow', 8 );
  // const samplerIBLLUT = defUniformNamed( 'sampler2D', 'samplerIBLLUT' );
  // const samplerEnv = defUniformNamed( 'sampler2D', 'samplerEnv' );
  const samplerAo = defUniformNamed( 'sampler2D', 'samplerAo' );

  const fetchShadowMap = defFn( 'vec4', [ 'int', 'vec2' ], ( iLight, uv ) => {
    ifChain( ...[ ...new Array( 8 ) ].map(
      ( _, i ) => [
        eq( iLight, int( i ) ),
        () => retFn( texture( arrayIndex( samplerShadow, int( i ) ), uv ) ),
      ] as [ GLSLExpression<'bool'>, () => void ]
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
    const lenV = def( 'float', length( rawV ) );
    const V = def( 'vec3', normalize( rawV ) );

    const dotNV = clamp( dot( normal, V ), EPSILON, 1.0 );

    const outColor = def( 'vec3', vec3( 0.0 ) );

    const ao = def( 'float', sw( texture( samplerAo, vUv ), 'x' ) );

    const shadePBR = (
      roughness: GLSLFloatExpression,
      metallic: GLSLFloatExpression,
    ): GLSLToken<'vec3'> => {
      // begin lighting
      const shaded = def( 'vec3', vec3( 0.0 ) );

      // for each lights
      forLoop( 8, ( iLight ) => {
        ifThen( gte( iLight, lightCount ), () => { forBreak(); } );

        const L = def( 'vec3', sub( arrayIndex( lightPos, iLight ), position ) );
        const lenL = def( 'float', length( L ) );
        divAssign( L, max( EPSILON, lenL ) );
        const dotNL = dot( normal, L );

        // shading
        const lightShaded = def( 'vec3', mul(
          arrayIndex( lightColor, iLight ),
          div( 1.0, sq( lenL ) ),
          dotNL,
          doAnalyticLighting( V, L, normal, color, roughness, metallic ),
          ao,
        ) );

        // fetch shadowmap + spot lighting
        const lightProj = mul( arrayIndex( lightPV, iLight ), vec4( position, 1.0 ) );
        const lightP = div( sw( lightProj, 'xy' ), sw( lightProj, 'w' ) );

        mulAssign(
          lightShaded,
          doShadowMapping(
            lenL,
            dotNL,
            fetchShadowMap( iLight, add( 0.5, mul( 0.5, lightP ) ) ),
            lightP,
            arrayIndex( lightNearFar, iLight ),
            sw( arrayIndex( lightParams, iLight ), 'x' ),
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
      [ eq( mtlId, MTL_PRESHADED_PUNCTUALS ), () => {
        assign( outColor, mul( color, ao ) );
      } ],
    );

    // fog
    mulAssign( outColor, exp( mul( -0.4, max( sub( lenV, 3.0 ), 0.0 ) ) ) );

    assign( fragColor, vec4( outColor, 1.0 ) );

    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );
  } );
} );
