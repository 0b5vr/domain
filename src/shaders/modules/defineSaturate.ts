import { shaderBuilder } from '../../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const { glPosition, genToken, insert, insertTop, num, def, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, pow, tern, length, normalize, dot, min, max, mix, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, swizzle, retFn, ifThen, defFn, main, build } = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export function defineSaturate(): ( val: string ) => string {
  const token = genToken();
  insertTop( `\n#define ${ token }(i) clamp(i,0.,1.)\n` );
  return ( val ) => `(${ token }(${ val }))`;
}
