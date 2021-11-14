import { PI } from '../utils/constants';
import { add, assign, build, def, defIn, defOutNamed, defUniformNamed, div, divAssign, glPosition, main, mix, mul, neg, sw, tan, vec3, vec4 } from '../shader-builder/shaderBuilder';

export const lightShaftVert = build( () => {
  const position = defIn( 'vec3', 0 );

  const vFrustumZ = defOutNamed( 'float', 'vFrustumZ' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );

  const lightFov = defUniformNamed( 'float', 'lightFov' );
  const lightNearFar = defUniformNamed( 'vec2', 'lightNearFar' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );

  main( () => {
    assign( vFrustumZ, add( 0.5, mul( 0.5, sw( position, 'y' ) ) ) );

    const tanFov = def( 'float', tan( mul( lightFov, PI / 360.0 ) ) );
    const posXYMulTanFov = def( 'vec2', mul( sw( position, 'xz' ), tanFov ) );
    const pos = mix(
      vec3( mul( posXYMulTanFov, sw( lightNearFar, 'x' ) ), neg( sw( lightNearFar, 'x' ) ) ),
      vec3( mul( posXYMulTanFov, sw( lightNearFar, 'y' ) ), neg( sw( lightNearFar, 'y' ) ) ),
      vFrustumZ,
    );

    assign( vPosition, mul( modelMatrix, vec4( pos, 1.0 ) ) );
    const outPos = def( 'vec4', mul( projectionMatrix, viewMatrix, vPosition ) );

    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );
  } );
} );