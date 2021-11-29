import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredShadeFrag';
import { abs, assign, build, def, defInNamed, defOut, div, insert, lt, main, min, mix, normalize, step, sub, sw, tern, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { sdbox2 } from './modules/sdbox2';

export const obsvrCubeFrag = build( () => {
  insert( 'precision highp float;' );

  const vInstanceId = defInNamed( 'vec3', 'vInstanceId' );
  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    const roughness = 0.3;

    const uvt = def( 'vec2', abs( sw( vInstanceId, 'xy' ) ) );
    assign( uvt, tern( lt( sw( uvt, 'y' ), sw( uvt, 'x' ) ), uvt, sw( uvt, 'yx' ) ) );

    const d = min(
      sdbox2( uvt, vec2( 0.05 ) ),
      sdbox2( sub( uvt, vec2( 0.25, 0.0 ) ), vec2( 0.05, 0.2 ) ),
    );

    assign( fragColor, vec4( mix(
      vec3( 0.04 ),
      vec3( 0.6 ),
      step( d, 0.0 ),
    ), 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( vNormal ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( roughness, 1.0, 0.0, 0.0 ) );
    return;
  } );
} );
