import { GLSLExpression, shaderBuilder } from '../../shader-builder/shaderBuilder';
import { uniformSphere } from './uniformSphere';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
} = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export function uniformHemisphere( n: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> {
  const f = cache(
    'uniformHemisphere',
    () => defFn( 'vec3', [ 'vec3' ], ( n ) => {
      const d = def( 'vec3', uniformSphere() );
      retFn( tern( lt( dot( d, n ), 0.0 ), neg( d ), d ) );
    } )
  );

  return f( n );
}
