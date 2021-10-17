import { GLSLExpression, GLSLFloatExpression, cache, defFn, max, mix, num, pow, retFn, sub } from '../../shader-builder/shaderBuilder';

const symbol = Symbol();

export function fresnelSchlick(
  dotVH: GLSLFloatExpression,
  f0: GLSLExpression<'vec3'>,
  f90: GLSLExpression<'vec3'>,
): GLSLExpression<'vec3'> {
  const f = cache( symbol, () => defFn( 'vec3', [ 'float', 'vec3', 'vec3' ], ( dotVH, f0, f90 ) => {
    const fresnel = pow( max( 0.0, sub( 1.0, dotVH ) ), 5.0 );
    retFn( mix( f0, f90, fresnel ) );
  } ) );

  return f( num( dotVH ), f0, f90 );
}
