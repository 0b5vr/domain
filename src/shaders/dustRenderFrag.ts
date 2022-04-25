import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformArrayNamed, div, glPointCoord, insert, length, main, max, mul, mulAssign, num, retFn, smoothstep, sub, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcL } from './modules/calcL';
import { calcLightFalloff } from './modules/calcLightFalloff';
import { defDoSomethingUsingSamplerArray } from './modules/defDoSomethingUsingSamplerArray';
import { doShadowMapping } from './modules/doShadowMapping';
import { forEachLights } from './modules/forEachLights';

export const dustRenderFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vOpacity = defInNamed( 'float', 'vOpacity' );

  const fragColor = defOut( 'vec4' );

  const samplerShadow = defUniformArrayNamed( 'sampler2D', 'samplerShadow', 8 );

  const doSomethingUsingSamplerShadow = defDoSomethingUsingSamplerArray( samplerShadow, 8 );
  const fetchShadowMap = defFn( 'vec4', [ 'int', 'vec2' ], ( iLight, uv ) => {
    retFn( doSomethingUsingSamplerShadow(
      iLight,
      ( sampler ) => texture( sampler, uv )
    ) );
  } );

  main( () => {
    const position = sw( vPosition, 'xyz' );
    const shape = smoothstep( 0.5, 0.0, length( sub( glPointCoord, 0.5 ) ) );

    const accum = def( 'vec3', vec3( 0.0 ) );

    forEachLights( ( { iLight, lightPos, lightColor, lightNearFar, lightPV, lightParams } ) => {
      const [ _L, lenL ] = calcL( lightPos, position );
      assign( lenL, max( 1.0, lenL ) );

      const irradiance = def( 'vec3', mul(
        lightColor,
        calcLightFalloff( lenL ),
      ) );

      // fetch shadowmap + spot lighting
      const lightProj = def( 'vec4', mul( lightPV, vec4( position, 1.0 ) ) );
      const lightP = def( 'vec3', div( sw( lightProj, 'xyz' ), sw( lightProj, 'w' ) ) );

      mulAssign(
        irradiance,
        doShadowMapping(
          fetchShadowMap( iLight, add( 0.5, mul( 0.5, sw( lightP, 'xy' ) ) ) ),
          lenL,
          num( 1.0 ),
          lightP,
          lightNearFar,
          lightParams,
        ),
      );

      // ok
      addAssign( accum, irradiance );
    } );

    assign( fragColor, vec4( vec3( mul(
      0.03,
      vOpacity,
      shape,
      accum,
    ) ), 1.0 ) );

  } );
} );
