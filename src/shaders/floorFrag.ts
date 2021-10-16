import { assign, build, def, defOutNamed, defUniform, div, glFragCoord, insert, main, mulAssign, sub, swizzle, texture } from '../shader-builder/shaderBuilder';

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
