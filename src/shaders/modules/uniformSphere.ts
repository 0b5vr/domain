import { GLSLExpression, shaderBuilder } from '../../shader-builder/shaderBuilder';
import { PI } from '../../utils/constants';
import { glslDefRandom } from './glslDefRandom';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
} = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export function uniformSphere(): GLSLExpression<'vec3'> {
  const { random } = glslDefRandom();

  const f = cache(
    'uniformSphere',
    () => defFn( 'vec3', [], () => {
      const phi = def( 'float', mul( random(), 2.0 * PI ) );
      const theta = def( 'float', acos( sub( mul( 2.0, random() ), 1.0 ) ) );
      const sinTheta = def( 'float', sin( theta ) );
      retFn( vec3( mul( sinTheta, cos( phi ) ), mul( sinTheta, sin( phi ) ), cos( theta ) ) );
    } )
  );

  return f();
}
