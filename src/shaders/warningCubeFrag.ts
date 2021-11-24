import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredShadeFrag';
import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, dot, glFragCoord, glFragDepth, gt, ifThen, insert, length, main, max, mix, mul, neg, normalize, retFn, sin, smoothstep, sq, sub, subAssign, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcAlbedoF0 } from './modules/calcAlbedoF0';
import { calcDepth } from './modules/calcDepth';
import { calcL } from './modules/calcL';
import { calcNormal } from './modules/calcNormal';
import { cyclicNoise } from './modules/cyclicNoise';
import { doAnalyticLighting } from './modules/doAnalyticLighting';
import { forEachLights } from './modules/forEachLights';
import { glslDefRandom } from './modules/glslDefRandom';
import { glslSaturate } from './modules/glslSaturate';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';
import { triplanarMapping } from './modules/triplanarMapping';

export const warningCubeFrag = ( tag: 'forward' | 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const modelMatrixT3 = defUniformNamed( 'mat3', 'modelMatrixT3' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );
  const samplerSurface = defUniformNamed( 'sampler2D', 'samplerSurface' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const { init } = glslDefRandom();

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    addAssign( p, mul( 0.01, cyclicNoise( p ) ) );

    const d = def( 'float', sdbox( p, vec3( 0.48 ) ) );
    subAssign( d, 0.02 );

    const line = def( 'float', 0.0 );
    const dirt = def( 'float', 0.0 );

    if ( tag !== 'depth' ) {
      const N = normalize( max( sub( abs( p ), 0.48 ), 0.0 ) );
      const mapSurface = triplanarMapping(
        add( 0.5, mul( p, 0.5 ) ),
        N,
        4.0,
        samplerSurface,
      );

      const phase = dot( p, vec3( 10.0 ) );
      const height = sw( mapSurface, 'x' );
      const fbm = mul( 0.2, sw( mapSurface, 'y' ) );
      assign( line, smoothstep( 0.1, 0.3, add( sin( phase ), fbm ) ) );
      assign( dirt, sw( mapSurface, 'z' ) );

      subAssign( d, mul( height, 0.002 ) );
    }

    retFn( vec4( d, line, dirt, 0 ) );
  } );

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
      sw( resolution, 'y' ),
    ) );
    init( texture( samplerRandom, p ) );

    const { ro, rd } = setupRoRd( { inversePVM, p } );

    const { isect, rp } = raymarch( {
      iter: 80,
      ro,
      rd,
      map,
      initRl: length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ),
      marchMultiplier: 0.6,
    } );

    ifThen( gt( sw( isect, 'x' ), 1E-2 ), () => discard() );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );
    const line = def( 'float', sw( isect, 'y' ) );
    const dirt = glslSaturate( def( 'float', sw( isect, 'z' ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );

    }

    const N = def( 'vec3', calcNormal( { rp, map } ) );
    const roughness = mix( 0.3, 0.8, dirt );
    const metallic = 0.0;

    const baseColor = mix(
      mix(
        vec3( 0.1 ),
        vec3( 0.8, 0.5, 0.1 ),
        line,
      ),
      vec3( 0.13, 0.1, 0.08 ),
      dirt,
    );

    if ( tag === 'deferred' ) {
      assign( fragColor, vec4( baseColor, 1.0 ) );
      assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
      assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
      assign( fragMisc, vec4( roughness, metallic, 0.0, 0.0 ) );

    } else if ( tag === 'forward' ) {
      const col = def( 'vec3', vec3( 0.0 ) );

      const V = def( 'vec3', neg( rd ) );

      forEachLights( ( { lightPos, lightColor } ) => {
        const [ L, lenL ] = calcL(
          mul( modelMatrixT3, lightPos ),
          rp,
        );

        const dotNL = def( 'float', max( dot( N, L ), 0.0 ) );

        const lightCol = lightColor;
        const lightDecay = div( 1.0, sq( lenL ) );
        const irradiance = def( 'vec3', mul( lightCol, dotNL, lightDecay ) );

        const { albedo, f0 } = calcAlbedoF0( baseColor, metallic );

        addAssign( col, mul(
          irradiance,
          doAnalyticLighting( L, V, N, roughness, albedo, f0 ),
        ) );
      } );

      assign( fragColor, vec4( col, 1.0 ) );

    }
  } );
} );
