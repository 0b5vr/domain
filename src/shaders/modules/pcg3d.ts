import { GLSLExpression, add, addAssign, assign, cache, defFn, mul, retFn, rshift, sw, xorAssign } from '../../shader-builder/shaderBuilder';

type Uint = GLSLExpression<'uint'>;

const symbol = Symbol();

export function pcg3d(
  v: GLSLExpression<'uvec3'>,
): GLSLExpression<'uvec3'> {
  const f = cache( symbol, () => defFn( 'uvec3', [ 'uvec3' ], ( v ) => {
    assign( v, add( mul( v, '1664525u' as Uint ), '1013904223u' as Uint ) );

    addAssign( sw( v, 'x' ), mul( sw( v, 'y' ), sw( v, 'z' ) ) );
    addAssign( sw( v, 'y' ), mul( sw( v, 'z' ), sw( v, 'x' ) ) );
    addAssign( sw( v, 'z' ), mul( sw( v, 'x' ), sw( v, 'y' ) ) );

    xorAssign( v, rshift( v, '16u' as Uint ) );

    addAssign( sw( v, 'x' ), mul( sw( v, 'y' ), sw( v, 'z' ) ) );
    addAssign( sw( v, 'y' ), mul( sw( v, 'z' ), sw( v, 'x' ) ) );
    addAssign( sw( v, 'z' ), mul( sw( v, 'x' ), sw( v, 'y' ) ) );

    retFn( v );
  } ) );

  return f( v );
}
