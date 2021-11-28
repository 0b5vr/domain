import { TAU } from '../utils/constants';
import { add, addAssign, assign, build, def, defIn, defOutNamed, defUniformNamed, div, divAssign, glPosition, main, mix, mul, mulAssign, sin, step, sw, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { rotate2D } from './modules/rotate2D';

export const notchyStuffVert = build( () => {
  const position = defIn( 'vec3', 0 );
  const normal = defIn( 'vec3', 1 );
  const instanceId = defIn( 'float', 3 );

  const vInstanceId = defOutNamed( 'float', 'vInstanceId' );
  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vNormal = defOutNamed( 'vec3', 'vNormal' );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  main( () => {
    // -- assign varying variables -----------------------------------------------------------------
    assign( vInstanceId, instanceId );

    const phase = def( 'float', mul( 2.0, TAU, instanceId ) );

    // -- compute size -----------------------------------------------------------------------------
    const off = def( 'vec3', vec3( 0, 0, mix( 0.25, 0.4, sin( add( time, phase ) ) ) ) );
    mulAssign( sw( off, 'yz' ), rotate2D( sin( mul( 2.0, phase ) ) ) );
    mulAssign( sw( off, 'zx' ), def( 'mat2', rotate2D( mul( 7.0, phase ) ) ) );

    addAssign( sw( off, 'y' ), mix( -0.02, 0.01, step( instanceId, 0.5 ) ) );

    // const off = mul( 0.3, sin( add(
    //   mul( TAU, vec3( 3.0, 4.0, 1.0 ), vec3( instanceId ) ),
    //   mul( time, vec3( 1.0, 0.5, 0.3 ) ),
    //   vec3( 2.0, 0.0, 4.0 ),
    // ) ) );
    const pos = def( 'vec4', vec4( off, 1.0 ) );

    const size = def( 'vec3', vec3( mix( 0.03, 0.04, sin( mul( 8.0, phase ) ) ) ) );

    addAssign( phase, mul( step( instanceId, 0.5 ), 2.0 ) );
    addAssign( size, mul( step( instanceId, 0.5 ), vec3( 0.1, -0.02, -0.02 ) ) );

    const shape = def( 'vec3', mul( position, size ) );
    mulAssign( sw( shape, 'zx' ), rotate2D( mul( 5.0, phase ) ) );
    mulAssign( sw( shape, 'yz' ), rotate2D( mul( 3.0, phase ) ) );
    mulAssign( sw( shape, 'xy' ), rotate2D( time ) );

    addAssign( sw( pos, 'xyz' ), shape );

    // -- compute normals --------------------------------------------------------------------------
    assign( vNormal, normal );
    mulAssign( sw( vNormal, 'zx' ), rotate2D( mul( 5.0, phase ) ) );
    mulAssign( sw( vNormal, 'yz' ), rotate2D( mul( 3.0, phase ) ) );
    mulAssign( sw( vNormal, 'xy' ), rotate2D( time ) );
    assign( vNormal, mul( normalMatrix, vNormal ) );

    // -- send the vertex position -----------------------------------------------------------------
    assign( vPosition, mul( modelMatrix, pos ) );
    assign( vProjPosition, mul( projectionMatrix, viewMatrix, vPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );
  } );
} );
