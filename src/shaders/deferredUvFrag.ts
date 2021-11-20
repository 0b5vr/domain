import { assign, build, defInNamed, defOut, insert, main, sw, vec4 } from '../shader-builder/shaderBuilder';

export const deferredUvFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vUv = defInNamed( 'vec2', 'vUv' );
  const vDepth = defInNamed( 'float', 'vDepth' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  main( () => {
    assign( fragColor, vec4( vUv, 0.5, 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), vDepth ) );
    assign( fragNormal, vec4( vNormal, 1.0 ) );
    assign( fragMisc, vec4( 0.0 ) );
    return;
  } );
} );
