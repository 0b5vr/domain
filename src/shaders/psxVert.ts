import { assign, build, def, defIn, defOutNamed, defUniformNamed, div, divAssign, glPosition, main, mul, normalize, sw, vec4 } from '../shader-builder/shaderBuilder';
import { glslLofi } from './modules/glslLofi';

export const psxVert = build( () => {
  const position = defIn( 'vec3', 0 );
  const normal = defIn( 'vec3', 1 );
  const uv = defIn( 'vec2', 2 );

  const vPositionWithoutModel = defOutNamed( 'vec4', 'vPositionWithoutModel' );
  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vViewPosition = defOutNamed( 'vec4', 'vViewPosition' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vNormalWithoutModel = defOutNamed( 'vec3', 'vNormalWithoutModel' );
  const vNormal = defOutNamed( 'vec3', 'vNormal' );
  const vUv = defOutNamed( 'vec2', 'vUv' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  main( () => {
    assign( vPositionWithoutModel, vec4( position, 1.0 ) );
    assign( vNormalWithoutModel, normalize( normal ) );

    assign( vPosition, mul( modelMatrix, vPositionWithoutModel ) );
    assign( vViewPosition, mul( viewMatrix, vPosition ) );
    assign( vProjPosition, mul( projectionMatrix, vViewPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    divAssign( sw( outPos, 'x' ), aspect );
    divAssign( outPos, sw( outPos, 'w' ) );
    assign( outPos, glslLofi( outPos, 1.0 / 256.0 ) );
    assign( glPosition, outPos );

    assign(
      vNormal,
      normalize( mul( normalMatrix, normal ) ),
    );

    assign( vUv, uv );
  } );
} );
