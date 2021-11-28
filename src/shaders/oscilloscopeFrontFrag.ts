import { TAU } from '../utils/constants';
import { add, addAssign, assign, build, cos, def, defInNamed, defOut, defUniformNamed, discard, div, divAssign, dot, ifThen, insert, length, lt, main, max, min, mix, mul, normalize, retFn, sq, sub, sw, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcAlbedoF0 } from './modules/calcAlbedoF0';
import { calcDepth } from './modules/calcDepth';
import { calcL } from './modules/calcL';
import { cyclicNoise } from './modules/cyclicNoise';
import { defIBL } from './modules/defIBL';
import { doAnalyticLighting } from './modules/doAnalyticLighting';
import { forEachLights } from './modules/forEachLights';
import { glslLinearstep } from './modules/glslLinearstep';

export const oscilloscopeFrontFrag = ( tag: 'forward' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  // const samplerShadow = defUniformArrayNamed( 'sampler2D', 'samplerShadow', 8 );

  // const doSomethingUsingSamplerShadow = defDoSomethingUsingSamplerArray( samplerShadow, 8 );
  // const fetchShadowMap = defFn( 'vec4', [ 'int', 'vec2' ], ( iLight, uv ) => {
  //   retFn( doSomethingUsingSamplerShadow(
  //     iLight,
  //     ( sampler ) => texture( sampler, uv )
  //   ) );
  // } );

  const { diffuseIBL, specularIBL } = defIBL();

  main( () => {
    const posXYZ = sw( vPosition, 'xyz' );

    const measureBigGrid = glslLinearstep( 0.98, 0.99, cos( mul( TAU, 10.0, vUv ) ) );
    const measureSmallGrid = glslLinearstep( 0.9, 0.95, cos( mul( TAU, 50.0, vUv ) ) );
    const measureSmallGridClip = glslLinearstep( 0.94, 0.97, cos( mul( TAU, 2.0, vUv ) ) );
    const measure = max(
      max( sw( measureBigGrid, 'x' ), sw( measureBigGrid, 'y' ) ),
      max(
        min( sw( measureSmallGrid, 'x' ), sw( measureSmallGridClip, 'y' ) ),
        min( sw( measureSmallGrid, 'y' ), sw( measureSmallGridClip, 'x' ) ),
      ),
    );

    if ( tag === 'depth' ) {
      ifThen( lt( measure, 0.5 ), () => discard() );

      const len = length( sub( cameraPos, posXYZ ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      retFn();

    }

    const V = normalize( sub( cameraPos, posXYZ ) );

    const col = def( 'vec3', vec3( 0.0 ) );

    const baseColor = vec3( 0.0 );
    const opacity = mix( 0.01, 1.0, measure );

    const { albedo, f0 } = calcAlbedoF0( baseColor, 0.0 );
    divAssign( f0, opacity );

    const roughness = mix(
      add(
        0.1,
        mul( 0.05, sw( cyclicNoise(
          mul( 4.0, sw( vPositionWithoutModel, 'xyz' ) )
        ), 'x' ) )
      ),
      0.5,
      measure,
    );

    forEachLights( ( {
      lightPos,
      lightColor,
    } ) => {
      const [ L, lenL ] = calcL( lightPos, posXYZ );

      const dotNL = def( 'float', max( dot( vNormal, L ), 0.0 ) );

      const lightCol = lightColor;
      const lightDecay = div( 1.0, sq( lenL ) );

      // fetch shadowmap + spot lighting
      // const lightProj = mul( lightPV, vPosition );
      // const lightP = div( sw( lightProj, 'xyz' ), sw( lightProj, 'w' ) );
      // const shadow = doShadowMapping(
      //   fetchShadowMap( iLight, add( 0.5, mul( 0.5, sw( lightP, 'xy' ) ) ) ),
      //   lenL,
      //   dotNL,
      //   lightP,
      //   lightNearFar,
      //   lightParams,
      // );

      // const irradiance = def( 'vec3', mul( lightCol, dotNL, lightDecay, shadow ) );
      const irradiance = def( 'vec3', mul( lightCol, dotNL, lightDecay ) );

      // lighting
      const lightShaded = def( 'vec3', mul(
        irradiance,
        doAnalyticLighting( L, V, vNormal, roughness, albedo, f0 ),
      ) );

      addAssign( col, lightShaded );
    } );

    // diffuse ibl
    addAssign( col, mul( diffuseIBL( albedo, vNormal ) ) );

    // reflective ibl
    addAssign( col, specularIBL( f0, vNormal, V, roughness ) );

    assign( fragColor, vec4( col, opacity ) );
  } );
} );
