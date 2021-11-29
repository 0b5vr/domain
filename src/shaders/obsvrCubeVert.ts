import { abs, add, addAssign, assign, build, def, defIn, defOutNamed, defUniformNamed, div, divAssign, glPosition, length, lt, main, mix, mod, mul, sin, sw, ternChain, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { orthBas } from './modules/orthBas';
import { pcg3df } from './modules/pcg3df';

export const obsvrCubeVert = build( () => {
  const position = defIn( 'vec3', 0 );
  const normal = defIn( 'vec3', 1 );
  const instanceId = defIn( 'vec3', 3 );

  const vInstanceId = defOutNamed( 'vec3', 'vInstanceId' );
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

    // -- compute size -----------------------------------------------------------------------------
    const pos = def( 'vec3', mul(
      0.9,
      vec3( sw( instanceId, 'xy' ), 0.5 - 1.0 / 32.0 )
    ) );
    const face = sw( instanceId, 'z' );
    const v = mul( ternChain(
      vec3( 0, 0, 1 ),
      [ lt( face, 2.0 ), vec3( 1, 0, 0 ) ],
      [ lt( face, 4.0 ), vec3( 0, 1, 0 ) ],
    ), mix( -1.0, 1.0, mod( face, 2.0 ) ) );
    const b = def( 'mat3', orthBas( v ) );
    assign( pos, mul( b, pos ) );

    const phase = add(
      mul( 2.0, time ),
      mul( -30.0, length( pos ) ),
      mul( 0.2, sw( pcg3df( mul( 1E3, add( 1.0, pos ) ) ), 'x' ) ),
    );
    const size = def( 'vec3', mul( 0.9 / 32.0, add(
      1.0,
      mul( abs( v ), mix( 0.5, 1.0, sin( phase ) ), 2.0 ),
    ) ) );
    const shape = def( 'vec3', mul( position, size ) );

    addAssign( sw( pos, 'xyz' ), shape );

    // -- compute normals --------------------------------------------------------------------------
    assign( vNormal, normal );
    assign( vNormal, mul( normalMatrix, vNormal ) );

    // -- send the vertex position -----------------------------------------------------------------
    assign( vPosition, mul( modelMatrix, vec4( pos, 1.0 ) ) );
    assign( vProjPosition, mul( projectionMatrix, viewMatrix, vPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );
  } );
} );
