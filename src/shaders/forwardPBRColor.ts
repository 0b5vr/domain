import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformArrayNamed, defUniformNamed, div, dot, insert, main, max, mul, normalize, retFn, sq, sub, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcL } from './modules/calcL';
import { defDoSomethingUsingSamplerArray } from './modules/defDoSomethingUsingSamplerArray';
import { doAnalyticLighting } from './modules/doAnalyticLighting';
import { doShadowMapping } from './modules/doShadowMapping';
import { forEachLights } from './modules/forEachLights';

export const forwardPBRColor = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );

  const fragColor = defOut( 'vec4' );

  const baseColor = defUniformNamed( 'vec3', 'baseColor' );
  const roughness = defUniformNamed( 'float', 'roughness' );
  const metallic = defUniformNamed( 'float', 'metallic' );
  const opacity = defUniformNamed( 'float', 'opacity' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const samplerShadow = defUniformArrayNamed( 'sampler2D', 'samplerShadow', 8 );

  const doSomethingUsingSamplerShadow = defDoSomethingUsingSamplerArray( samplerShadow, 8 );
  const fetchShadowMap = defFn( 'vec4', [ 'int', 'vec2' ], ( iLight, uv ) => {
    retFn( doSomethingUsingSamplerShadow(
      iLight,
      ( sampler ) => texture( sampler, uv )
    ) );
  } );

  main( () => {
    const posXYZ = sw( vPosition, 'xyz' );

    const V = normalize( sub( cameraPos, posXYZ ) );

    const col = def( 'vec3', vec3( 0.0 ) );

    forEachLights( ( {
      iLight,
      lightPos,
      lightColor,
      lightPV,
      lightNearFar,
      lightParams,
    } ) => {
      const [ L, lenL ] = calcL( lightPos, posXYZ );

      const dotNL = def( 'float', max( dot( vNormal, L ), 0.0 ) );

      const lightCol = lightColor;
      const lightDecay = div( 1.0, sq( lenL ) );

      // fetch shadowmap + spot lighting
      const lightProj = mul( lightPV, vPosition );
      const lightP = div( sw( lightProj, 'xyz' ), sw( lightProj, 'w' ) );
      const shadow = doShadowMapping(
        fetchShadowMap( iLight, add( 0.5, mul( 0.5, sw( lightP, 'xy' ) ) ) ),
        lenL,
        dotNL,
        lightP,
        lightNearFar,
        lightParams,
      );
      const irradiance = def( 'vec3', mul( lightCol, dotNL, lightDecay, shadow ) );

      // lighting
      const lightShaded = def( 'vec3', mul(
        irradiance,
        doAnalyticLighting( L, V, vNormal, baseColor, roughness, metallic ),
      ) );

      addAssign( col, lightShaded );
    } );

    assign( fragColor, vec4( col, opacity ) );
  } );
} );
