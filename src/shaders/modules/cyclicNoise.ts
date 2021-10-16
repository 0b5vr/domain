import { GLSLExpression, GLSLFloatExpression, addAssign, cache, cos, cross, def, defFn, div, mul, mulAssign, num, retFn, sin, swizzle, unrollLoop, vec3, vec4 } from '../../shader-builder/shaderBuilder';
import { orthBas } from './orthBas';

export function cyclicNoise( {
  p,
  rot = vec3( -1.0 ),
  pump = 2.0,
  freq = 2.0,
}: {
  p: GLSLExpression<'vec3'>,
  rot?: GLSLExpression<'vec3'>,
  pump?: GLSLFloatExpression,
  freq?: GLSLFloatExpression,
} ): GLSLExpression<'vec3'> {
  const f = cache(
    'cyclicNoise',
    () => defFn( 'vec3', [ 'vec3', 'vec3', 'float' ], ( p, rot, pump ) => {
      const b = def( 'mat3', orthBas( rot ) );
      const accum = def( 'vec4', vec4( 0.0 ) );
      unrollLoop( 6, () => {
        mulAssign( p, mul( b, freq ) );
        addAssign( p, sin( swizzle( p, 'zxy' ) ) );
        addAssign( accum, vec4( cross( cos( p ), sin( swizzle( p, 'yzx' ) ) ), 1.0 ) );
        mulAssign( accum, pump );
      } );
      retFn( div( swizzle( accum, 'xyz' ), swizzle( accum, 'w' ) ) );
    } )
  );

  return f( p, rot, num( pump ) );
}
