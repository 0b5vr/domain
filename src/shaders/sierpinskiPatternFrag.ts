import { assign, build, bxor, defInNamed, defOut, div, float, fract, insert, int, main, mix, mul, sw, vec3, vec4 } from '../shader-builder/shaderBuilder';

export const sierpinskiPatternFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  main( () => {
    const xor = bxor( int( mul( 64.0, sw( vUv, 'x' ) ) ), int( mul( 64.0, sw( vUv, 'y' ) ) ) );
    const sierp = fract( div( float( xor ), vec4( 39.0, 27.0, 1.0, 1.0 ) ) );

    assign( fragColor, vec4(
      mix(
        mix(
          vec3( 0.08, 0.07, 0.06 ),
          vec3( 0.6, 0.0, 0.0 ),
          sw( sierp, 'x' ),
        ),
        mix(
          vec3( 0.0, 0.0, 0.4 ),
          vec3( 0.7, 0.5, 0.0 ),
          sw( sierp, 'x' ),
        ),
        sw( sierp, 'y' ),
      ),
      1.0,
    ) );
  } );
} );
