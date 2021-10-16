import { GLSLExpression, abs, assign, cache, cross, def, defFn, gt, mat3, normalize, retFn, swizzle, tern, vec3 } from '../../shader-builder/shaderBuilder';

export function orthBas( z: GLSLExpression<'vec3'> ): GLSLExpression<'mat3'> {
  const f = cache(
    'orthBas',
    () => defFn( 'mat3', [ 'vec3' ], ( z ) => {
      assign( z, normalize( z ) );
      const up = tern( gt( abs( swizzle( z, 'y' ) ), 0.999 ), vec3( 0, 0, 1 ), vec3( 0, 1, 0 ) );
      const x = def( 'vec3', cross( up, z ) );
      retFn( mat3( x, cross( z, x ), z ) );
    } )
  );

  return f( z );
}
