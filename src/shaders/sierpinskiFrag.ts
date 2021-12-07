import { MTL_PBR_SHEEN } from './deferredShadeFrag';
import { PI } from '../utils/constants';
import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, glFragCoord, glFragDepth, glslFalse, glslTrue, gt, ifThen, insert, length, main, max, mul, normalize, retFn, sin, sq, sub, subAssign, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { cyclicNoise } from './modules/cyclicNoise';
import { defSimplexFBM3d } from './modules/simplexFBM3d';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';
import { triplanarMapping } from './modules/triplanarMapping';

export const sierpinskiFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );
  const samplerPattern = defUniformNamed( 'sampler2D', 'samplerPattern' );

  const shouldUseNoise = def( 'bool', glslFalse );

  const fbm3 = defSimplexFBM3d();

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    addAssign( p, mul(
      0.02,
      cyclicNoise( add( mul( p, 2.0 ), mul( 0.1, time ) ), { freq: 1.6 } ),
    ) );

    const d = def( 'float', sub( sdbox( p, vec3( 0.45 ) ), 0.04 ) );

    ifThen( shouldUseNoise, () => {
      subAssign( d, triplanarMapping(
        p,
        normalize( max( sub( abs( p ), 0.45 ), 0.0 ) ),
        1.0,
        ( uv ) => {
          const pp = def( 'vec2', sq( sin( mul( PI, 64.0, uv ) ) ) );
          return mul( 0.001, sw( pp, 'x' ), sw( pp, 'y' ) );
        },
      ) );
      subAssign( d, mul( 0.004, fbm3(
        mul( 10.0, p )
      ) ) );
    } );

    retFn( vec4( d, p ) );
  } );

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
      sw( resolution, 'y' ),
    ) );

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

    assign( shouldUseNoise, glslTrue );
    assign( isect, map( rp ) );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      retFn();

    }

    const N = def( 'vec3', calcNormal( { rp, map } ) );
    const pSurface = sw( isect, 'yzw' );

    const col = sw( triplanarMapping(
      pSurface,
      N,
      1.0,
      ( uv ) => texture( samplerPattern, add( uv, 0.5 ) ),
    ), 'xyz' );

    assign( fragColor, vec4( col, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_SHEEN ) );
    assign( fragMisc, vec4( vec3( 0.1 ), 0.5 ) );

  } );
} );
