import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredShadeFrag';
import { assign, build, defInNamed, defOut, div, insert, main, mul, sin, smoothstep, sw, vec4 } from '../shader-builder/shaderBuilder';

export const psxFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );
    const line = smoothstep( -0.2, 0.2, sin( mul( 20.0, vUv ) ) );

    assign( fragColor, vec4( line, 0.0, 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( vNormal, MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 1.0, 0.0, 0.5, 0.0 ) );
    return;
  } );
} );
