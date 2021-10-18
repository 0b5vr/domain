import { INV_PI } from '../utils/constants';
import { add, addAssign, assign, build, def, defFn, defInNamed, defOutNamed, defUniformNamed, discard, div, dot, glFragCoord, glFragDepth, gt, ifThen, insert, length, main, max, mix, mul, neg, normalize, retFn, sin, step, sub, subAssign, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { brdfGGX } from './modules/brdfGGX';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { calcSS } from './modules/calcSS';
import { cyclicNoise } from './modules/cyclicNoise';
import { glslDefRandom } from './modules/glslDefRandom';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';

export const sssBoxFrag = ( tag: 'forward' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const modelMatrixT3 = defUniformNamed( 'mat3', 'modelMatrixT3' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const { init } = glslDefRandom();

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    // const d = def( 'float', sub( length( p ), 0.1 ) );
    const noise = cyclicNoise( {
      p: add( mul( p, 5.0 ), time ),
      freq: 1.3,
    } );
    addAssign( p, mul( 0.1, noise ) );
    const d = def( 'float', sdbox( p, vec3( 0.33 ) ) );
    subAssign( d, 0.07 );
    retFn( vec4( d, step( 0.0, sin( dot( vec4( p, time ), vec4( 10.0 ) ) ) ), 0, 0 ) );
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

    const col = def( 'vec3', vec3( 0.0 ) );

    ifThen( gt( sw( isect, 'x' ), 1E-2 ), () => discard() );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'forward' ) {
      const L = def( 'vec3', mul( modelMatrixT3, normalize( vec3( 1, 1, 1 ) ) ) );
      const V = def( 'vec3', neg( rd ) );
      const N = def( 'vec3', calcNormal( { rp, map } ) );

      const baseColor = vec3( 0.9, 0.7, 0.4 );
      const subsurfaceColor = vec3( 0.7, 0.04, 0.04 );
      const lightGain = mul( 4.0, vec3( 0.8, 0.82, 0.9 ) );
      const dotNL = def( 'float', max( dot( L, N ), 0.0 ) );
      const irradiance = def( 'vec3', mul( lightGain, dotNL ) );

      const diffuse = mul( irradiance, baseColor, INV_PI );
      const ss = mul(
        lightGain,
        subsurfaceColor,
        calcSS( { rp, V, L, N, map, intensity: 2.0 } ),
        INV_PI
      );
      addAssign( col, mix(
        mul( diffuse ),
        ss,
        0.5
      ) );

      const specular = mul( irradiance, brdfGGX( L, V, N, baseColor, 0.1, 0.2 ) );
      addAssign( col, specular );

      assign( fragColor, vec4( col, 1.0 ) );
    } else if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
    }
  } );
} );
