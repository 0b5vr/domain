import { GLSLExpression, GLSLFloatExpression, add, addAssign, assign, build, clamp, def, defInNamed, defOut, defUniformNamed, div, insert, main, mix, mul, pow, sub, sw, texture, vec2, vec4 } from '../shader-builder/shaderBuilder';

export const bloomUpFrag = build( () => {
  insert( 'precision highp float;' );

  const WEIGHT_1 = 1.0 / 16.0;
  const WEIGHT_2 = 2.0 / 16.0;
  const WEIGHT_4 = 4.0 / 16.0;

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const level = defUniformNamed( 'float', 'level' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    const p = def( 'float', pow( 0.5, level ) ); // 1.0, 0.5, 0.25...

    const deltaTexel = def( 'vec2', div( 1.0, resolution ) );

    const uv0 = def( 'vec2', vec2( sub( 1.0, p ) ) );
    const uv1 = def( 'vec2', vec2( sub( 1.0, mul( 0.5, p ) ) ) );
    const uv = def( 'vec2', mix( uv0, uv1, vUv ) );
    assign( uv, clamp(
      uv,
      add( uv0, mul( 1.5, deltaTexel ) ),
      sub( uv1, mul( 1.5, deltaTexel ) ),
    ) );

    // http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
    const accum = def( 'vec4' );
    const sample = ( weight: GLSLFloatExpression, offset: GLSLExpression<'vec2'> ): void => {
      const tex = texture( sampler0, sub( uv, mul( deltaTexel, offset ) ) );
      addAssign( accum, mul( weight, tex ) );
    };
    sample( WEIGHT_1, vec2( -1.0, -1.0 ) );
    sample( WEIGHT_2, vec2(  0.0, -1.0 ) );
    sample( WEIGHT_1, vec2(  1.0, -1.0 ) );
    sample( WEIGHT_2, vec2( -1.0,  0.0 ) );
    sample( WEIGHT_4, vec2(  0.0,  0.0 ) );
    sample( WEIGHT_2, vec2(  1.0,  0.0 ) );
    sample( WEIGHT_1, vec2( -1.0,  1.0 ) );
    sample( WEIGHT_2, vec2(  0.0,  1.0 ) );
    sample( WEIGHT_1, vec2(  1.0,  1.0 ) );

    const col = sw( accum, 'rgb' );
    assign( fragColor, vec4( col, 1.0 ) );
  } );
} );
