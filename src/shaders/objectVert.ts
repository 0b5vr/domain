import { shaderBuilder } from '../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const { glPosition, insert, num, def, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, pow, length, normalize, mix, clamp, texture, float, vec2, vec3, vec4, swizzle, retFn, defFn, main, build } = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export const objectVert = build( () => {
  const position = defIn( 'vec3', 0 );
  const normal = defIn( 'vec3', 1 );
  const uv = defIn( 'vec2', 2 );

  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vNormal = defOutNamed( 'vec3', 'vNormal' );
  const vUv = defOutNamed( 'vec2', 'vUv' );

  const resolution = defUniform( 'vec2', 'resolution' );
  const projectionMatrix = defUniform( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniform( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniform( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniform( 'mat4', 'normalMatrix' );

  main( () => {
    assign(
      vNormal,
      normalize( swizzle( mul( normalMatrix, vec4( normal, 1.0 ) ), 'xyz' ) ),
    );

    assign( vUv, uv );

    assign( vPosition, mul( modelMatrix, vec4( position, 1.0 ) ) );
    const outPos = def( 'vec4', mul( projectionMatrix, viewMatrix, vPosition ) );

    const aspect = div( swizzle( resolution, 'x' ), swizzle( resolution, 'y' ) );
    divAssign( swizzle( outPos, 'x' ), aspect );
    assign( glPosition, outPos );
  } );
} );
