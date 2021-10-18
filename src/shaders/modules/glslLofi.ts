import { GLSLExpression, GLSLFloatExpression, div, floor, mul, num } from '../../shader-builder/shaderBuilder';

export function glslLofi( x: GLSLFloatExpression, y: GLSLFloatExpression ): GLSLExpression<'float'>;
export function glslLofi( x: GLSLExpression<'vec2'>, y: GLSLExpression<'vec2'> | GLSLFloatExpression ): GLSLExpression<'vec2'>;
export function glslLofi( x: GLSLExpression<'vec3'>, y: GLSLExpression<'vec3'> | GLSLFloatExpression ): GLSLExpression<'vec3'>;
export function glslLofi( x: GLSLExpression<'vec4'>, y: GLSLExpression<'vec4'> | GLSLFloatExpression ): GLSLExpression<'vec4'>;
export function glslLofi( x: string | number, y: string | number ): string {
  return mul( floor( div( num( x ), num( y ) ) ), num( y ) );
}
