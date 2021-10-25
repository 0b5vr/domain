import { GLSLExpression, cache, cos, def, defFn, mat2, neg, retFn, sin } from '../../shader-builder/shaderBuilder';

const symbol = Symbol();

export function rotate2D(
  v: GLSLExpression<'float'>,
): GLSLExpression<'mat2'> {
  const f = cache( symbol, () => defFn( 'mat2', [ 'float' ], ( t ) => {
    const c = def( 'float', cos( t ) );
    const s = def( 'float', sin( t ) );
    retFn( mat2( c, neg( s ), s, c ) );
  } ) );

  return f( v );
}
