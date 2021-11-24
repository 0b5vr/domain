import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformArrayNamed, defUniformNamed, div, dot, insert, main, max, mul, normalize, retFn, sq, sub, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcAlbedoF0 } from './modules/calcAlbedoF0';
import { calcL } from './modules/calcL';
import { defDoSomethingUsingSamplerArray } from './modules/defDoSomethingUsingSamplerArray';
import { defIBL } from './modules/defIBL';
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

  const { diffuseIBL, specularIBL } = defIBL();

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

      const { albedo, f0 } = calcAlbedoF0( baseColor, metallic );

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
        doAnalyticLighting( L, V, vNormal, roughness, albedo, f0 ),
      ) );

      addAssign( col, lightShaded );

      // diffuse ibl
      addAssign( col, mul( diffuseIBL( albedo, vNormal ) ) );

      // // reflective ibl
      addAssign( col, mul( 10.0, specularIBL( f0, vNormal, V, roughness ) ) );
    } );

    assign( fragColor, vec4( col, opacity ) );
  } );
} );
