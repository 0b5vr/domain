import { GLSLExpression, def, mul, swizzle, vec4 } from '../../shader-builder/shaderBuilder';
import { glslLinearstep } from './glslLinearstep';

export function calcDepth(
  cameraNearFar: GLSLExpression<'vec2'>,
  distance: GLSLExpression<'float'>,
): GLSLExpression<'vec4'> {
  const depth = def( 'float', glslLinearstep(
    swizzle( cameraNearFar, 'x' ),
    swizzle( cameraNearFar, 'y' ),
    distance,
  ) as GLSLExpression<'float'> );
  return vec4( depth, mul( depth, depth ), depth, 1.0 );
}
