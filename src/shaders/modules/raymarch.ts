import { GLSLExpression, GLSLToken, shaderBuilder } from '../../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
} = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export function raymarch( {
  iter,
  ro,
  rd,
  map,
  initRl,
  eps,
  far,
  marchMultiplier,
}: {
  iter: number,
  ro: GLSLExpression<'vec3'>,
  rd: GLSLExpression<'vec3'>,
  map: ( p: GLSLExpression<'vec3'> ) => GLSLExpression<'vec4'>,
  initRl?: number,
  eps?: number,
  far?: number,
  marchMultiplier?: number,
} ): {
    isect: GLSLToken<'vec4'>,
    rl: GLSLToken<'float'>,
    rp: GLSLToken<'vec3'>,
  } {
  const isect = def( 'vec4' );
  const rl = def( 'float', initRl ?? 1E-2 );
  const rp = def( 'vec3', add( ro, mul( rd, rl ) ) );

  forLoop( iter, () => {
    assign( isect, map( rp ) );
    const dist = swizzle( isect, 'x' );
    addAssign( rl, mul( dist, marchMultiplier ?? 1.0 ) );
    assign( rp, add( ro, mul( rd, rl ) ) );

    ifThen( lt( abs( dist ), eps ?? 1E-3 ), () => forBreak() );
    if ( far != null ) {
      ifThen( gt( rl, far ), () => forBreak() );
    }
  } );

  return { isect, rl, rp };
}
