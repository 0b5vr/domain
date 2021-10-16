import { GLSLExpression, GLSLToken, Swizzle3ComponentsVec2, shaderBuilder } from '../../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
} = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

// Ref: https://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
export function calcNormal( {
  rp,
  map,
  delta,
}: {
  rp: GLSLExpression<'vec3'>,
  map: ( p: GLSLExpression<'vec3'> ) => GLSLExpression<'vec4'>,
  delta?: GLSLExpression<'float'>,
} ): GLSLToken<'vec3'> {
  const k = vec2( 1.0, -1.0 );
  const dk = def( 'vec2', mul( vec2( 1.0, -1.0 ), delta ?? 1E-4 ) );
  const sample = ( sw: Swizzle3ComponentsVec2 ): GLSLExpression<'vec3'> => mul(
    swizzle( k, sw ),
    swizzle( map( add( rp, swizzle( dk, sw ) ) ), 'x' )
  );
  return def( 'vec3', normalize( add(
    sample( 'xyy' ),
    sample( 'yyx' ),
    sample( 'yxy' ),
    sample( 'xxx' ),
  ) ) );
}
