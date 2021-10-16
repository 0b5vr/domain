import { GLSLExpression, GLSLToken, shaderBuilder } from '../../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
} = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

// Ref: https://cs.uwaterloo.ca/~thachisu/tdf2015.pdf
export function glslDefRandom(): {
  random: () => GLSLExpression<'float'>,
  seed: GLSLToken<'vec4'>,
  init: ( seed: GLSLExpression<'vec4'> ) => void,
} {
  const seed = cache( 'seed', () => defGlobal( 'vec4' ) );

  const random = cache(
    'random',
    () => defFn( 'float', [], () => {
      const q = defConst( 'vec4', vec4( 1225, 1585, 2457, 2098 ) );
      const r = defConst( 'vec4', vec4( 1112, 367, 92, 265 ) );
      const a = defConst( 'vec4', vec4( 3423, 2646, 1707, 1999 ) );
      const m = defConst( 'vec4', vec4( 4194287, 4194277, 4194191, 4194167 ) );
      const beta = def( 'vec4', floor( div( seed, q ) ) );
      const p = def( 'vec4', sub( mul( a, sub( seed, mul( beta, q ) ) ), mul( beta, r ) ) );
      assign( beta, mul( add( neg( sign( p ) ), vec4( 1 ) ), vec4( 0.5 ), m ) );
      assign( seed, add( p, beta ) );
      retFn( fract( dot( div( seed, m ), vec4( 1, -1, 1, -1 ) ) ) );
    } )
  );

  const init = cache(
    'initRandom',
    () => ( _seed: GLSLExpression<'vec4'> ) => {
      assign( seed, _seed );
      unrollLoop( 3, () => insert( `${ random() };` ) );
    }
  );

  return { random, seed, init };
}
