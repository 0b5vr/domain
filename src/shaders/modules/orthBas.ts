import { GLSLExpression, shaderBuilder } from '../../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
} = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export function orthBas( z: GLSLExpression<'vec3'> ): GLSLExpression<'mat3'> {
  const f = cache(
    'orthBas',
    () => defFn( 'mat3', [ 'vec3' ], ( z ) => {
      assign( z, normalize( z ) );
      const up = tern( gt( abs( swizzle( z, 'y' ) ), 0.999 ), vec3( 0, 0, 1 ), vec3( 0, 1, 0 ) );
      const x = def( 'vec3', cross( up, z ) );
      retFn( mat3( x, cross( z, x ), z ) );
    } )
  );

  return f( z );
}
