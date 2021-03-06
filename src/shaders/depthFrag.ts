import { assign, build, defInNamed, defOut, defUniformNamed, insert, length, main, sub, sw } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';

export const depthFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );

  const fragColor = defOut( 'vec4' );

  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );

  main( () => {
    const posXYZ = sw( vPosition, 'xyz' );

    const len = length( sub( cameraPos, posXYZ ) );
    assign( fragColor, calcDepth( cameraNearFar, len ) );
    return;
  } );
} );
