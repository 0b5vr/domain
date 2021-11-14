import { GLSLExpression, GLSLFloatExpression, abs, add, div, dot, mul, pow, sw, texture, vec3 } from '../../shader-builder/shaderBuilder';

export function triplanarMapping(
  p: GLSLExpression<'vec3'>,
  N: GLSLExpression<'vec3'>,
  smoothFactor: GLSLFloatExpression,
  sampler: GLSLExpression<'sampler2D'>,
): GLSLExpression<'vec4'> {
  const textureYZ = texture( sampler, sw( p, 'yz' ) );
  const textureZX = texture( sampler, sw( p, 'zx' ) );
  const textureXY = texture( sampler, sw( p, 'xy' ) );

  const nPowered = pow( abs( N ), vec3( smoothFactor ) );

  return div( add(
    mul( textureYZ, sw( nPowered, 'x' ) ),
    mul( textureZX, sw( nPowered, 'y' ) ),
    mul( textureXY, sw( nPowered, 'z' ) ),
  ), dot( nPowered, vec3( 1.0 ) ) );
}
