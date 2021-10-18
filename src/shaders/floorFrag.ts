import { assign, build, def, defOutNamed, defUniformNamed, div, glFragCoord, insert, main, mulAssign, sub, sw, texture } from '../shader-builder/shaderBuilder';

export const floorFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const samplerMirror = defUniformNamed( 'sampler2D', 'samplerMirror' );

  main( () => {
    const uv = def( 'vec2', div( sw( glFragCoord, 'xy' ), resolution ) );
    assign( sw( uv, 'x' ), sub( 1.0, sw( uv, 'x' ) ) );

    const tex = def( 'vec4', texture( samplerMirror, uv ) );
    mulAssign( sw( tex, 'xyz' ), 0.3 );

    assign( fragColor, tex );
  } );
} );
