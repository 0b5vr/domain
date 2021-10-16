import { GLSLExpression, GLSLFloatExpression, GLSLToken, shaderBuilder } from '../../shader-builder/shaderBuilder';
import { glslSaturate } from './glslSaturate';
import { uniformHemisphere } from './uniformHemisphere';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
} = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

// https://www.shadertoy.com/view/lllBDM
export function calcSS( {
  rp,
  rd,
  ld,
  n,
  map,
  eta,
  iter = 50,
  lenInit = 0.01,
  lenStep = 0.01,
  intensity = 1.0,
  power = 3.0,
}: {
  rp: GLSLExpression<'vec3'>,
  rd: GLSLExpression<'vec3'>,
  ld: GLSLExpression<'vec3'>,
  n: GLSLExpression<'vec3'>,
  map: ( p: GLSLExpression<'vec3'> ) => GLSLExpression<'vec4'>,
  eta?: GLSLFloatExpression,
  iter?: number,
  lenInit?: GLSLFloatExpression,
  lenStep?: GLSLFloatExpression,
  intensity?: GLSLFloatExpression,
  power?: GLSLFloatExpression,
} ): GLSLToken<'float'> {
  const sd = def( 'vec3', refract( rd, n, eta ?? 1.0 / 1.5 ) );
  const len = def( 'float', num( lenInit ) );
  const accum = def( 'float', 0.0 );

  forLoop( iter, () => {
    addAssign( len, lenStep );
    const samplePoint = def( 'vec3', add( rp, mul( uniformHemisphere( sd ), len ) ) );
    addAssign( samplePoint, mul( uniformHemisphere( ld ), len ) );
    const d = swizzle( map( samplePoint ), 'x' );
    addAssign( accum, div( max( 0.0, neg( d ) ), len ) );
  } );

  const v = glslSaturate( sub( 1.0, mul( intensity, div( accum, iter ) ) ) ) as GLSLExpression<'float'>;
  return def( 'float', pow( v, power ) );
}
