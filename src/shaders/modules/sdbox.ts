import { GLSLExpression, shaderBuilder } from '../../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
} = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

// Ref: https://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
export function sdbox(
  p: GLSLExpression<'vec3'>,
  s: GLSLExpression<'vec3'>,
): GLSLExpression<'float'> {
  const f = cache(
    'sdbox',
    () => defFn( 'float', [ 'vec3', 'vec3' ], ( p, s ) => {
      const d = def( 'vec3', sub( abs( p ), s ) );
      const inside = min(
        max( swizzle( d, 'x' ), max( swizzle( d, 'y' ), swizzle( d, 'z' ) ) ),
        0.0,
      );
      const outside = length( max( d, 0.0 ) );
      retFn( add( inside, outside ) );
    } )
  );

  return f( p, s );
}
