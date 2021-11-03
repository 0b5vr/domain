import { assign, build, def, defIn, defOutNamed, defUniformNamed, div, divAssign, glPosition, main, mul, normalize, sw, vec4 } from '../shader-builder/shaderBuilder';

export const objectVert = ( { locationPosition, locationNormal, locationUv }: {
  locationPosition?: number,
  locationNormal?: number,
  locationUv?: number,
} = {} ): string => build( () => {
  const position = defIn( 'vec3', locationPosition ?? 0 );
  const normal = locationNormal != null ? defIn( 'vec3', locationNormal ) : null;
  const uv = locationUv != null ? defIn( 'vec2', locationUv ) : null;

  const vPositionWithoutModel = defOutNamed( 'vec4', 'vPositionWithoutModel' );
  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vViewPosition = defOutNamed( 'vec4', 'vViewPosition' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vNormal = normal != null ? defOutNamed( 'vec3', 'vNormal' ) : null;
  const vUv = uv != null ? defOutNamed( 'vec2', 'vUv' ) : null;
  const vDepth = defOutNamed( 'float', 'vDepth' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = normal != null ? defUniformNamed( 'mat3', 'normalMatrix' ) : null;

  main( () => {
    assign( vPositionWithoutModel, vec4( position, 1.0 ) );

    assign( vPosition, mul( modelMatrix, vPositionWithoutModel ) );
    assign( vViewPosition, mul( viewMatrix, vPosition ) );
    assign( vProjPosition, mul( projectionMatrix, vViewPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    assign( vDepth, div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) ) );

    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );

    if ( normal != null ) {
      assign(
        vNormal!,
        normalize( mul( normalMatrix!, normal ) ),
      );
    }

    if ( uv != null ) {
      assign( vUv!, uv );
    }
  } );
} );
