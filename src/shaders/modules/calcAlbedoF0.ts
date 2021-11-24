import { DIELECTRIC_SPECULAR, ONE_SUB_DIELECTRIC_SPECULAR } from '../../utils/constants';
import { GLSLExpression, GLSLFloatExpression, mix, mul, vec3 } from '../../shader-builder/shaderBuilder';

export function calcAlbedoF0(
  baseColor: GLSLExpression<'vec3'>,
  metallic: GLSLFloatExpression,
): {
    albedo: GLSLExpression<'vec3'>,
    f0: GLSLExpression<'vec3'>,
  } {
  return {
    albedo: mix( mul( baseColor, ONE_SUB_DIELECTRIC_SPECULAR ), vec3( 0.0 ), metallic ),
    f0: mix( DIELECTRIC_SPECULAR, baseColor, metallic ),
  };
}
