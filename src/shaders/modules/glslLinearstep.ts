import { glslSaturate } from './glslSaturate';
import { shaderBuilder } from '../../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
} = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export function glslLinearstep( a: string, b: string, x: string ): string {
  const linearstep = cache( 'linearstep', () => {
    const token = genToken();
    insertTop( `\n#define ${ token }(a,b,x) ${ glslSaturate( '(((x)-(a))/((b)-(a)))' ) }\n` );
    return ( a: string, b: string, x: string ) => `(${ token }(${ a },${ b },${ x }))`;
  } );

  return linearstep( a, b, x );
}
