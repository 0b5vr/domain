import { GLSLExpression, shaderBuilder } from '../../shader-builder/shaderBuilder';
import { defineLinearstep } from './defineLinearstep';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const { glPosition, insert, num, def, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, pow, sqrt, exp, sin, cos, tan, tern, length, normalize, dot, min, max, mix, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, swizzle, discard, retFn, ifThen, defFn, main, build } = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export function calcDepth(
  cameraNearFar: GLSLExpression<'vec2'>,
  distance: GLSLExpression<'float'>,
): GLSLExpression<'vec4'> {
  const linearstep = defineLinearstep();
  const depth = def( 'float', linearstep(
    swizzle( cameraNearFar, 'x' ),
    swizzle( cameraNearFar, 'y' ),
    distance,
  ) as GLSLExpression<'float'> );
  return vec4( depth, mul( depth, depth ), depth, 1.0 );
}
