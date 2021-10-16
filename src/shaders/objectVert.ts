import { assign, build, def, defIn, defOutNamed, defUniform, div, divAssign, glPosition, main, mul, normalize, swizzle, vec4 } from '../shader-builder/shaderBuilder';

export const objectVert = ( { locationPosition, locationNormal, locationUv }: {
  locationPosition?: number,
  locationNormal?: number,
  locationUv?: number,
} = {} ): string => build( () => {
  const position = defIn( 'vec3', locationPosition ?? 0 );
  const normal = locationNormal != null ? defIn( 'vec3', locationNormal ) : null;
  const uv = locationUv != null ? defIn( 'vec2', locationUv ) : null;

  const vPositionWithoutModel = defOutNamed( 'vec4', 'vPositionWithoutModel' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vNormal = normal != null ? defOutNamed( 'vec3', 'vNormal' ) : null;
  const vUv = uv != null ? defOutNamed( 'vec2', 'vUv' ) : null;

  const resolution = defUniform( 'vec2', 'resolution' );
  const projectionMatrix = defUniform( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniform( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniform( 'mat4', 'modelMatrix' );
  const normalMatrix = normal != null ? defUniform( 'mat3', 'normalMatrix' ) : null;

  main( () => {
    assign( vPositionWithoutModel, vec4( position, 1.0 ) );

    assign( vPosition, mul( modelMatrix, vPositionWithoutModel ) );
    const outPos = def( 'vec4', mul( projectionMatrix, viewMatrix, vPosition ) );

    const aspect = div( swizzle( resolution, 'x' ), swizzle( resolution, 'y' ) );
    divAssign( swizzle( outPos, 'x' ), aspect );
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
