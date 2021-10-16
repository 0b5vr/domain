import { GLSLExpression, abs, add, cache, def, defFn, length, max, min, retFn, sub, swizzle } from '../../shader-builder/shaderBuilder';

// Ref: https://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
export function sdbox(
  p: GLSLExpression<'vec3'>,
  s: GLSLExpression<'vec3'>,
): GLSLExpression<'float'> {
  const f = cache(
    'sdbox',
    () => defFn( 'float', [ 'vec3', 'vec3' ], ( p, s ) => {
      const d = def( 'vec3', sub( abs( p ), s ) );
      const inside = min(
        max( swizzle( d, 'x' ), max( swizzle( d, 'y' ), swizzle( d, 'z' ) ) ),
        0.0,
      );
      const outside = length( max( d, 0.0 ) );
      retFn( add( inside, outside ) );
    } )
  );

  return f( p, s );
}
