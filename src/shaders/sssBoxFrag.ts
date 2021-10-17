import { add, addAssign, assign, build, def, defFn, defInNamed, defOutNamed, defUniform, discard, div, glFragCoord, glFragDepth, gt, ifThen, insert, length, main, mul, retFn, sub, subAssign, swizzle, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
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
  const pvm = defUniform( 'mat4', 'pvm' );
  const modelMatrix = defUniform( 'mat4', 'modelMatrix' );
  const modelMatrixT = defUniform( 'mat4', 'modelMatrixT' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const time = defUniform( 'float', 'time' );
  const resolution = defUniform( 'vec2', 'resolution' );
  const cameraNearFar = defUniform( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniform( 'vec3', 'cameraPos' );
  const inversePVM = defUniform( 'mat4', 'inversePVM' );
  const samplerRandom = defUniform( 'sampler2D', 'samplerRandom' );

  const { init } = glslDefRandom();

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    // const d = def( 'float', sub( length( p ), 0.1 ) );
    const noise = cyclicNoise( {
      p: add( mul( p, 5.0 ), time ),
      freq: 1.3,
    } );
    addAssign( p, mul( 0.1, noise ) );
    const d = def( 'float', sdbox( p, vec3( 0.36 ) ) );
    subAssign( d, 0.04 );
    retFn( vec4( d, 0, 0, 0 ) );
  } );

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, swizzle( glFragCoord, 'xy' ) ), resolution ),
      swizzle( resolution, 'y' ),
    ) );
    init( texture( samplerRandom, p ) );

    const { ro, rd } = setupRoRd( { inversePVM, p } );

    const { isect, rp } = raymarch( {
      iter: 80,
      ro,
      rd,
      map,
      initRl: length( sub( swizzle( vPositionWithoutModel, 'xyz' ), ro ) ),
      marchMultiplier: 0.6,
    } );

    const col = def( 'vec3', vec3( 0.0 ) );

    ifThen( gt( swizzle( isect, 'x' ), 1E-2 ), () => discard() );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( swizzle( projPos, 'z' ), swizzle( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'forward' ) {
      const ld = def( 'vec3', swizzle( mul( modelMatrixT, vec4( 0, 1, 0, 0 ) ), 'xyz' ) );
      const n = calcNormal( { rp, map } );
      const ss = calcSS( {
        rp,
        rd,
        ld,
        n,
        map,
        intensity: 2.0,
      } );
      assign( col, vec3( ss ) );

      assign( fragColor, vec4( col, 1.0 ) );
    } else if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, swizzle( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
    }
  } );
} );
