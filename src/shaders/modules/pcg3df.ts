import { GLSLExpression, cache, defFn, div, float, retFn, uvec3, vec3 } from '../../shader-builder/shaderBuilder';
import { pcg3d } from './pcg3d';

const symbol = Symbol();

export function pcg3df( v: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> {
  const f = cache( symbol, () => defFn( 'vec3', [ 'vec3' ], ( v ) => {
    const h = vec3( pcg3d( uvec3( v ) ) );
    retFn( div( h, float( '0xffffffffu' as GLSLExpression<'uint'> ) ) );
  } ) );

  return f( v );
}
