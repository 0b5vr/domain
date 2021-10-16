import { GLSLExpression, GLSLToken, shaderBuilder } from '../../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
} = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export function setupRoRd( {
  inversePVM,
  p,
}: {
  inversePVM: GLSLExpression<'mat4'>,
  p: GLSLExpression<'vec2'>,
} ): {
    ro: GLSLToken<'vec3'>,
    rd: GLSLToken<'vec3'>,
  } {
  const divideByW = defFn( 'vec3', [ 'vec4' ], ( v ) => {
    retFn( div( swizzle( v, 'xyz' ), swizzle( v, 'w' ) ) );
  } );

  const ro = def( 'vec3', divideByW( mul( inversePVM, vec4( p, 0.0, 1.0 ) ) ) );
  const farPos = def( 'vec3', divideByW( mul( inversePVM, vec4( p, 1.0, 1.0 ) ) ) );
  const rd = def( 'vec3', normalize( sub( farPos, ro ) ) );

  return { ro, rd };
}
