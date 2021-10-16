import { add, assign, build, defIn, defOutNamed, defUniform, glPosition, main, mix, mul, swizzle, vec4 } from '../shader-builder/shaderBuilder';

export const quadVert = build( () => {
  const position = defIn( 'vec2', 0 );

  const vUv = defOutNamed( 'vec2', 'vUv' );

  const range = defUniform( 'vec4', 'range' );

  main( () => {
    assign( vUv, add( 0.5, mul( 0.5, position ) ) );
    assign( glPosition, vec4(
      mix( swizzle( range, 'xy' ), swizzle( range, 'zw' ), vUv ),
      0.0,
      1.0,
    ) );
  } );
} );
