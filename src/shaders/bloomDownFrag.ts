import { GLSLExpression, GLSLFloatExpression, shaderBuilder } from '../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const { glPosition, insert, num, def, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, pow, tern, length, normalize, dot, min, max, mix, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, swizzle, retFn, ifThen, defFn, main, build } = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export const bloomDownFrag = build( () => {
  insert( 'precision highp float;' );

  const WEIGHT_1 = 1.0 / 16.0;
  const WEIGHT_2 = 2.0 / 16.0;
  const WEIGHT_4 = 4.0 / 16.0;
  const LUMA = vec3( 0.299, 0.587, 0.114 );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const level = defUniform( 'float', 'level' );
  const resolution = defUniform( 'vec2', 'resolution' );
  const sampler0 = defUniform( 'sampler2D', 'sampler0' );

  const fetchWithWeight = defFn( 'vec4', [ 'vec2' ], ( uv ) => {
    const tex = def( 'vec3', swizzle( texture( sampler0, uv ), 'xyz' ) );
    const luma = dot( LUMA, tex );
    retFn( vec4( tex, add( 1.0, mul( 0.5, luma ) ) ) );
  } );

  main( () => {
    const p = mul( 2.0, def( 'float', pow( 0.5, level ) ) ); // 2.0, 1.0, 0.5, 0.25...

    const deltaTexel = def( 'vec2', div( 1.0, resolution ) );

    const uv0 = def( 'vec2', mul( step( 0.5, level ), vec2( sub( 1.0, p ) ) ) );
    const uv1 = def( 'vec2', vec2( sub( 1.0, mul( step( 0.5, level ), 0.5, p ) ) ) );
    const uv = def( 'vec2', mix( uv0, uv1, vUv ) );
    assign( uv, clamp(
      uv,
      add( uv0, deltaTexel ),
      sub( uv1, deltaTexel ),
    ) );

    // http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
    const accum = def( 'vec4' );
    const sample = ( weight: GLSLFloatExpression, offset: GLSLExpression<'vec2'> ): void => {
      const tex = fetchWithWeight( sub( uv, mul( deltaTexel, offset ) ) );
      addAssign( accum, mul( weight, tex ) );
    };
    sample( WEIGHT_1, vec2( -1.0, -1.0 ) );
    sample( WEIGHT_2, vec2(  0.0, -1.0 ) );
    sample( WEIGHT_1, vec2(  1.0, -1.0 ) );
    sample( WEIGHT_4, vec2( -0.5, -0.5 ) );
    sample( WEIGHT_4, vec2(  0.5, -0.5 ) );
    sample( WEIGHT_2, vec2( -1.0,  0.0 ) );
    sample( WEIGHT_4, vec2(  0.0,  0.0 ) );
    sample( WEIGHT_2, vec2(  1.0,  0.0 ) );
    sample( WEIGHT_4, vec2( -0.5,  0.5 ) );
    sample( WEIGHT_4, vec2(  0.5,  0.5 ) );
    sample( WEIGHT_1, vec2( -1.0,  1.0 ) );
    sample( WEIGHT_2, vec2(  0.0,  1.0 ) );
    sample( WEIGHT_1, vec2(  1.0,  1.0 ) );

    const col = def( 'vec3', div( swizzle( accum, 'rgb' ), swizzle( accum, 'w' ) ) );

    ifThen( eq( level, 0.0 ), () => {
      const brightness = def( 'float', dot( LUMA, col ) );
      const normalized = tern( lt( brightness, 1E-4 ), vec3( brightness ), div( col, brightness ) );
      assign( col, mul( max( 0.0, sub( brightness, 0.6 ) ), normalized ) );
    } );

    assign( fragColor, vec4( col, 1.0 ) );
  } );
} );