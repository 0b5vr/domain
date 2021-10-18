import { GLSLExpression, GLSLToken, Swizzle2ComponentsVec3, SwizzleComponentVec3, assign, def, lt, swizzle, tern } from '../../shader-builder/shaderBuilder';

export function sortVec3Components( x: GLSLExpression<'vec3'> ): GLSLToken<'vec3'> {
  const v = def( 'vec3', x );

  const sw = ( a: SwizzleComponentVec3, b: SwizzleComponentVec3 ): void => assign(
    swizzle( v, ( a + b ) as Swizzle2ComponentsVec3 ),
    tern(
      lt( swizzle( v, a ), swizzle( v, b ) ),
      swizzle( v, ( a + b ) as Swizzle2ComponentsVec3 ),
      swizzle( v, ( b + a ) as Swizzle2ComponentsVec3 )
    ),
  );

  sw( 'x', 'y' );
  sw( 'x', 'z' );
  sw( 'y', 'z' );

  return v;
}
