import { assign, build, defInNamed, defOut, defUniformNamed, insert, main, sw, vec4 } from '../shader-builder/shaderBuilder';

export const deferredColorFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vDepth = defInNamed( 'float', 'vDepth' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const color = defUniformNamed( 'vec4', 'color' );
  const mtlKind = defUniformNamed( 'float', 'mtlKind' );
  const mtlParams = defUniformNamed( 'vec4', 'mtlParams' );

  main( () => {
    assign( fragColor, color );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), vDepth ) );
    assign( fragNormal, vec4( vNormal, mtlKind ) );
    assign( fragMisc, mtlParams );
    return;
  } );
} );
