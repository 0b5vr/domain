import { calcNormal } from './modules/calcNormal';
import { calcSS } from './modules/calcSS';
import { cyclicNoise } from './modules/cyclicNoise';
import { glslDefRandom } from './modules/glslDefRandom';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';
import { shaderBuilder } from '../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
} = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export const sssBoxFrag = build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const modelMatrixT = defUniform( 'mat4', 'modelMatrixT' );
  const normalMatrix = defUniform( 'mat3', 'normalMatrix' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const time = defUniform( 'float', 'time' );
  const resolution = defUniform( 'vec2', 'resolution' );
  const cameraNearFar = defUniform( 'vec2', 'cameraNearFar' );
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
      marchMultiplier: 0.6,
    } );

    const col = def( 'vec3', vec3( 0.0 ) );

    ifThen( lt( swizzle( isect, 'x' ), 1E-2 ), () => {
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
    } );

    assign( fragColor, vec4( col, 1.0 ) );
  } );
} );
