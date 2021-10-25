import { GLSLExpression, GLSLToken, Swizzle3ComponentsVec2, add, def, mul, normalize, sw, vec2 } from '../../shader-builder/shaderBuilder';

// Ref: https://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
export function calcNormal( {
  rp,
  map,
  delta,
}: {
  rp: GLSLExpression<'vec3'>,
  map: ( p: GLSLExpression<'vec3'> ) => GLSLExpression<'vec4'>,
  delta?: GLSLExpression<'float'>,
} ): GLSLToken<'vec3'> {
  const k = vec2( 1.0, -1.0 );
  const dk = def( 'vec2', mul( k, delta ?? 1E-4 ) );
  const sample = ( s: Swizzle3ComponentsVec2 ): GLSLExpression<'vec3'> => mul(
    sw( k, s ),
    sw( map( add( rp, sw( dk, s ) ) ), 'x' )
  );
  return def( 'vec3', normalize( add(
    sample( 'xyy' ),
    sample( 'yyx' ),
    sample( 'yxy' ),
    sample( 'xxx' ),
  ) ) );
}
