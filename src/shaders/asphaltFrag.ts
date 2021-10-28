import { MTL_PBR_EMISSIVE } from './deferredShadeFrag';
import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, dot, glFragCoord, glFragDepth, gt, ifThen, insert, length, main, max, mix, mul, mulAssign, neg, normalize, retFn, smoothstep, sq, step, sub, subAssign, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcL } from './modules/calcL';
import { calcNormal } from './modules/calcNormal';
import { cyclicNoise } from './modules/cyclicNoise';
import { doAnalyticLighting } from './modules/doAnalyticLighting';
import { forEachLights } from './modules/forEachLights';
import { glslDefRandom } from './modules/glslDefRandom';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';
import { voronoi3d } from './modules/voronoi3d';
import { voronoi3dBorder } from './modules/voronoi3dBorder';

export const asphaltFrag = ( tag: 'forward' | 'deferred' | 'depth' ): string => build( () => {
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
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const { init } = glslDefRandom();

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    addAssign( p, mul( 0.04, cyclicNoise( p ) ) );

    const d = def( 'float', sdbox( p, vec3( 0.45 ) ) );
    subAssign( d, 0.02 );

    const line = def( 'float', 0.0 );

    if ( tag !== 'depth' ) {
      const voronoiSamplePos = mul( 50.0, add( p, 1.0 ) );
      const voronoi = voronoi3d( voronoiSamplePos );
      const border = sw( voronoi3dBorder( voronoiSamplePos, voronoi ), 'w' );
      subAssign( d, div( border, 100.0 ) );
      assign( line, smoothstep( 0.2, 0.1, border ) );
    }

    retFn( vec4( d, line, 0, 0 ) );
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

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );

    }

    const N = def( 'vec3', calcNormal( { rp, map } ) );
    const roughness = 0.4;
    const metallic = 0.3;

    const baseColor = mix(
      vec3( 0.1 ),
      vec3( 0.8 ),
      line
    );
    mulAssign( line, step( abs( sw( rp, 'x' ) ), 0.1 ) );

    if ( tag === 'deferred' ) {
      assign( fragColor, vec4( baseColor, 1.0 ) );
      assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
      assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_EMISSIVE ) );
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

        addAssign( col, mul(
          irradiance,
          doAnalyticLighting( L, V, N, baseColor, roughness, metallic ),
        ) );
      } );

      assign( fragColor, vec4( col, 1.0 ) );

    }
  } );
} );
