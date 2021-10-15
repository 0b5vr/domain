import { shaderBuilder } from '../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const { glPosition, insert, num, def, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, pow, length, normalize, mix, clamp, texture, float, vec2, vec3, vec4, swizzle, retFn, defFn, main, build } = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

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
