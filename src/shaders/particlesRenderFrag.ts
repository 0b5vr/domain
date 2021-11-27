import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredShadeFrag';
import { add, assign, build, defInNamed, defOut, div, insert, main, mix, mul, normalize, sin, sw, vec3, vec4 } from '../shader-builder/shaderBuilder';

export const particlesRenderFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vLife = defInNamed( 'float', 'vLife' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    const col = mix(
      vec3( 0.7 ),
      vec3( 0.8 ),
      sin( add( mul( -4.0, vLife ), vec3( 0, 2, 4 ) ) ),
    );

    assign( fragColor, vec4( col, 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( vNormal ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.8, 1.0, 0.0, 0.0 ) );
    return;
  } );
} );
