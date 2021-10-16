import { shaderBuilder } from '../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const {
  glPosition, glFragCoord, cache, genToken, insert, insertTop, num, def, defGlobal, defConst, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, neg, pow, sqrt, exp, floor, fract, mod, abs, sign, sin, cos, tan, asin, acos, atan, tern, length, normalize, dot, cross, reflect, refract, mix, min, max, clamp, step, texture, eq, neq, lt, lte, gt, gte, float, vec2, vec3, vec4, mat2, mat3, mat4, swizzle, discard, retFn, ifThen, unrollLoop, forLoop, forBreak, defFn, main, build,
} = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

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
