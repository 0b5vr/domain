import { GLSLExpression, GLSLFloatExpression, add, assign, cache, def, defFn, floor, forLoop, ifThen, lt, num, retFn, sub, vec2, vec3 } from '../../shader-builder/shaderBuilder';
import { minkowski2d } from './minkowski2d';
import { pcg2df } from './pcg2df';

const symbol = Symbol();

/**
 * @param v vector
 * @param p minzowsky p
 * @returns vec3( cellOrigin, len )
 */
export function voronoi2d(
  v: GLSLExpression<'vec2'>,
  p: GLSLFloatExpression = 2.0,
): GLSLExpression<'vec3'> {
  const f = cache( symbol, () => defFn( 'vec3', [ 'vec2', 'float' ], ( v, p ) => {
    const cell = def( 'vec2', floor( v ) );

    const nearestCell = def( 'vec2' );
    const nearestLen = def( 'float', 1E9 );

    forLoop( 3, ( iy ) => {
      forLoop( 3, ( ix ) => {
        const currentCell = add( cell, -1.0, vec2( ix, iy ) );
        const cellOrigin = add(
          currentCell,
          pcg2df( currentCell ),
        );

        const len = def( 'float', minkowski2d( sub( cellOrigin, v ), p ) );

        ifThen( lt( len, nearestLen ), () => {
          assign( nearestCell, currentCell );
          assign( nearestLen, len );
        } );
      } );
    } );

    retFn( vec3( nearestCell, nearestLen ) );
  } ) );

  return f( v, num( p ) );
}
