import { assign, build, defInNamed, defOutNamed, insert, main, vec4 } from '../shader-builder/shaderBuilder';

export const uvFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  main( () => {
    assign( fragColor, vec4( vUv, 0.0, 1.0 ) );
  } );
} );
