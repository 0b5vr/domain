import { add, addAssign, assign, build, def, defFn, defInNamed, defOutNamed, defUniformArrayNamed, defUniformNamed, div, dot, glFragCoord, insert, length, main, max, mix, mul, mulAssign, normalize, pow, retFn, smoothstep, sq, sub, sw, texture, textureLod, unrollLoop, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcL } from './modules/calcL';
import { cyclicNoise } from './modules/cyclicNoise';
import { defDoSomethingUsingSamplerArray } from './modules/defDoSomethingUsingSamplerArray';
import { doAnalyticLighting } from './modules/doAnalyticLighting';
import { doShadowMapping } from './modules/doShadowMapping';
import { forEachLights } from './modules/forEachLights';
import { simplex4d } from './modules/simplex4d';

export const floorFrag = ( tag: 'forward' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const samplerMirror = defUniformNamed( 'sampler2D', 'samplerMirror' );
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

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, posXYZ ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      return;
    }

    const screenUv = def( 'vec2', div( sw( glFragCoord, 'xy' ), resolution ) );
    assign( sw( screenUv, 'y' ), sub( 1.0, sw( screenUv, 'y' ) ) );

    const noiseDisplacer = cyclicNoise( vec3( mul( vUv, vec2( 10.0, 10.0 ) ), 1.0 ), {
      pump: 1.4,
      freq: 2.0,
      warp: 0.1,
    } );
    const noiseA = def( 'float', (
      sw( cyclicNoise( vec3( mul( noiseDisplacer, 20.0 ) ), {
        pump: 2.0,
        freq: 2.0,
        warp: 0.5,
      } ), 'x' )
    ) );

    const simplex = simplex4d( vec4( mul( 50.0, vUv ), 1.0, 1.0 ) );
    const scratch = simplex4d( vec4( mul( 20.0, simplex ) ) );
    mulAssign( noiseA, smoothstep( -0.7, 0.0, scratch ) );
    assign( noiseA, smoothstep( -0.2, 1.0, noiseA ) );

    const noiseB = def( 'float', 0.0 );
    const noiseBFreq = def( 'float', 50.0 );
    unrollLoop( 4, () => {
      const n = simplex4d( vec4( mul( noiseBFreq, vUv ), 1.0, 1.0 ) );
      addAssign( noiseB, mul( n, 0.25 ) );
      mulAssign( noiseBFreq, 2.0 );
    } );

    const noise = mix( noiseA, noiseB, 0.5 );

    const baseColor = def( 'vec3', vec3( 0.02 ) );
    const roughness = mix( 0.1, 0.2, noise );
    const metallic = 0.1;

    const lod = mul( 8.0, noise ); // physically cringe rendering
    const tex = def( 'vec4', textureLod( samplerMirror, screenUv, lod ) );

    const V = normalize( sub( cameraPos, posXYZ ) );
    const dotVN = dot( V, vNormal );

    const FReflect = pow( max( 0.0, sub( 1.0, dotVN ) ), 5.0 );
    const col = def( 'vec3', mul( sw( tex, 'xyz' ), FReflect ) );

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
        sw( lightParams, 'x' ),
      );
      const irradiance = def( 'vec3', mul( lightCol, dotNL, lightDecay, shadow ) );

      // lighting
      const lightShaded = def( 'vec3', mul(
        irradiance,
        doAnalyticLighting( L, V, vNormal, baseColor, roughness, metallic ),
      ) );

      addAssign( col, lightShaded );
    } );

    assign( fragColor, vec4( col, 1.0 ) );
  } );
} );
