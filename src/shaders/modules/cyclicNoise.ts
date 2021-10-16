import { GLSLExpression, GLSLFloatExpression, shaderBuilder } from '../../shader-builder/shaderBuilder';
import { orthBas } from './orthBas';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
} = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export function cyclicNoise( {
  p,
  rot = vec3( -1.0 ),
  pump = 2.0,
  freq = 2.0,
}: {
  p: GLSLExpression<'vec3'>,
  rot?: GLSLExpression<'vec3'>,
  pump?: GLSLFloatExpression,
  freq?: GLSLFloatExpression,
} ): GLSLExpression<'vec3'> {
  const f = cache(
    'cyclicNoise',
    () => defFn( 'vec3', [ 'vec3', 'vec3', 'float' ], ( p, rot, pump ) => {
      const b = def( 'mat3', orthBas( rot ) );
      const accum = def( 'vec4', vec4( 0.0 ) );
      unrollLoop( 6, () => {
        mulAssign( p, mul( b, freq ) );
        addAssign( p, sin( swizzle( p, 'zxy' ) ) );
        addAssign( accum, vec4( cross( cos( p ), sin( swizzle( p, 'yzx' ) ) ), 1.0 ) );
        mulAssign( accum, pump );
      } );
      retFn( div( swizzle( accum, 'xyz' ), swizzle( accum, 'w' ) ) );
    } )
  );

  return f( p, rot, num( pump ) );
}
