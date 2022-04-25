import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredConstants';
import { TAU } from '../utils/constants';
import { add, assign, build, defInNamed, defOut, div, insert, main, mix, mul, normalize, sin, step, sw, vec3, vec4 } from '../shader-builder/shaderBuilder';

export const notchyStuffFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vInstanceId = defInNamed( 'float', 'vInstanceId' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    const mtl = step( vInstanceId, 0.5 );

    assign( fragColor, vec4(
      mix(
        vec3( 0.04 ),
        mix(
          vec3( 0.5 ),
          vec3( 0.8 ),
          sin( add( vec3( 0, 1, 2 ), mul( 2.0, TAU, vInstanceId ) ) )
        ),
        mtl
      ),
      1.0,
    ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( vNormal ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( mix( 0.2, 0.5, mtl ), mtl, 0.0, 0.0 ) );
    return;
  } );
} );
