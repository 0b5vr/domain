import { shaderBuilder } from '../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const { glPosition, insert, num, def, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, pow, length, normalize, mix, clamp, texture, float, vec2, vec3, vec4, swizzle, retFn, defFn, main, build } = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export const colorFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );
  const color = defUniform( 'vec4', 'color' );

  main( () => {
    assign( fragColor, color );
  } );
} );
