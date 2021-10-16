import { GLSLExpression, GLSLToken, def, defFn, div, mul, normalize, retFn, sub, swizzle, vec4 } from '../../shader-builder/shaderBuilder';

export function setupRoRd( {
  inversePVM,
  p,
}: {
  inversePVM: GLSLExpression<'mat4'>,
  p: GLSLExpression<'vec2'>,
} ): {
    ro: GLSLToken<'vec3'>,
    rd: GLSLToken<'vec3'>,
  } {
  const divideByW = defFn( 'vec3', [ 'vec4' ], ( v ) => {
    retFn( div( swizzle( v, 'xyz' ), swizzle( v, 'w' ) ) );
  } );

  const ro = def( 'vec3', divideByW( mul( inversePVM, vec4( p, 0.0, 1.0 ) ) ) );
  const farPos = def( 'vec3', divideByW( mul( inversePVM, vec4( p, 1.0, 1.0 ) ) ) );
  const rd = def( 'vec3', normalize( sub( farPos, ro ) ) );

  return { ro, rd };
}
