import { GLSLExpression, cache, def, defFn, dot, lt, neg, retFn, tern } from '../../shader-builder/shaderBuilder';
import { uniformSphere } from './uniformSphere';

export function uniformHemisphere( n: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> {
  const f = cache(
    'uniformHemisphere',
    () => defFn( 'vec3', [ 'vec3' ], ( n ) => {
      const d = def( 'vec3', uniformSphere() );
      retFn( tern( lt( dot( d, n ), 0.0 ), neg( d ), d ) );
    } )
  );

  return f( n );
}
