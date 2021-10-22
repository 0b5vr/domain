import { GLSLExpression, add, addAssign, arrayIndex, assign, build, def, defFn, defInNamed, defOutNamed, defUniformArrayNamed, defUniformNamed, div, divAssign, dot, eq, forBreak, forLoop, glFragCoord, gte, ifChain, ifThen, insert, int, length, main, max, mix, mul, mulAssign, normalize, retFn, sq, sub, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { cyclicNoise } from './modules/cyclicNoise';
import { doAnalyticLighting } from './modules/doAnalyticLighting';
import { doShadowMapping } from './modules/doShadowMapping';

export const floorFrag = ( tag: 'forward' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const lightCount = defUniformNamed( 'int', 'lightCount' );
  const lightNearFar = defUniformArrayNamed( 'vec2', 'lightNearFar', 8 );
  const lightPos = defUniformArrayNamed( 'vec3', 'lightPos', 8 );
  const lightColor = defUniformArrayNamed( 'vec3', 'lightColor', 8 );
  const lightParams = defUniformArrayNamed( 'vec4', 'lightParams', 8 );
  const lightPV = defUniformArrayNamed( 'mat4', 'lightPV', 8 );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const samplerMirror = defUniformNamed( 'sampler2D', 'samplerMirror' );
  const samplerShadow = defUniformArrayNamed( 'sampler2D', 'samplerShadow', 8 );

  const fetchShadowMap = defFn( 'vec4', [ 'int', 'vec2' ], ( iLight, uv ) => {
    ifChain( ...[ ...new Array( 8 ) ].map(
      ( _, i ) => [
        eq( iLight, int( i ) ),
        () => retFn( texture( arrayIndex( samplerShadow, int( i ) ), uv ) ),
      ] as [ GLSLExpression<'bool'>, () => void ]
    ) );
  } );

  main( () => {
    const screenUv = def( 'vec2', div( sw( glFragCoord, 'xy' ), resolution ) );
    assign( sw( screenUv, 'x' ), sub( 1.0, sw( screenUv, 'x' ) ) );

    const tex = def( 'vec4', texture( samplerMirror, screenUv ) );

    const baseColor = def( 'vec3', vec3( 0.1 ) );

    const col = def( 'vec3', mul( sw( tex, 'xyz' ), baseColor ) );

    const posXYZ = sw( vPosition, 'xyz' );
    const V = normalize( sub( cameraPos, posXYZ ) );

    const roughness = mix(
      0.3,
      0.6,
      sw( cyclicNoise( vec3( mul( vUv, 20.0 ), 1.0 ), {
        pump: 1.4,
        freq: 1.8,
        warp: 0.5,
      } ), 'x' ),
    );
    const metallic = 0.0;

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, posXYZ ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      return;
    }

    // for each lights
    forLoop( 8, ( iLight ) => {
      ifThen( gte( iLight, lightCount ), () => { forBreak(); } );

      const lp = arrayIndex( lightPos, iLight );
      const L = def( 'vec3', sub( lp, posXYZ ) );
      const lenL = def( 'float', length( L ) );
      divAssign( L, max( 1E-3, lenL ) );

      const dotNL = def( 'float', max( dot( vNormal, L ), 0.0 ) );

      const lightCol = arrayIndex( lightColor, iLight );
      const lightDecay = div( 1.0, sq( lenL ) );
      const irradiance = def( 'vec3', mul( lightCol, dotNL, lightDecay ) );

      const lightShaded = def( 'vec3', mul(
        irradiance,
        doAnalyticLighting( L, V, vNormal, baseColor, roughness, metallic ),
      ) );

      // fetch shadowmap + spot lighting
      const lightProj = mul( arrayIndex( lightPV, iLight ), vPosition );
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

      // const aa = sw( fetchShadowMap( iLight, add( 0.5, mul( 0.5, lightP ) ) ), 'x' );
      // const bb = glslLinearstep(
      //   sw( arrayIndex( lightNearFar, iLight ), 'x' ),
      //   sw( arrayIndex( lightNearFar, iLight ), 'y' ),
      //   lenL,
      // );
      // assign( col, turboColormap( mul( sub( bb, aa ), 10.0 ) ) );

      addAssign( col, lightShaded );
    } );

    assign( fragColor, vec4( col, 1.0 ) );
  } );
} );
