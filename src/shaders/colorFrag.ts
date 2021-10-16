import { assign, build, defOutNamed, defUniform, insert, main } from '../shader-builder/shaderBuilder';

export const colorFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );
  const color = defUniform( 'vec4', 'color' );

  main( () => {
    assign( fragColor, color );
  } );
} );
