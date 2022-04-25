import { GLSLExpression, add, div, sq } from '../../shader-builder/shaderBuilder';

export function calcLightFalloff(
  lenL: GLSLExpression<'float'>,
): GLSLExpression<'float'> {
  return div( 1.0, add( 0.2, sq( lenL ) ) ); // 0.2 is a parameter
}
