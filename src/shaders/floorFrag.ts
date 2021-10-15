import { shaderBuilder } from '../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const { glPosition, glFragCoord, insert, num, def, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, pow, length, normalize, mix, clamp, texture, float, vec2, vec3, vec4, swizzle, retFn, defFn, main, build } = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export const floorFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const resolution = defUniform( 'vec2', 'resolution' );
  const samplerMirror = defUniform( 'sampler2D', 'samplerMirror' );

  main( () => {
    const uv = def( 'vec2', div( swizzle( glFragCoord, 'xy' ), resolution ) );
    assign( swizzle( uv, 'x' ), sub( 1.0, swizzle( uv, 'x' ) ) );

    const tex = def( 'vec4', texture( samplerMirror, uv ) );
    mulAssign( swizzle( tex, 'xyz' ), 0.3 );

    assign( fragColor, tex );
  } );
} );
