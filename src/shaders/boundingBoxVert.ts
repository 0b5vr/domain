import { shaderBuilder } from '../shader-builder/shaderBuilder';

/* eslint-disable max-len, @typescript-eslint/no-unused-vars */
const { glPosition, insert, num, def, defIn, defInNamed, defOut, defOutNamed, defUniform, assign, addAssign, subAssign, mulAssign, divAssign, add, sub, mul, div, pow, length, normalize, mix, clamp, texture, float, vec2, vec3, vec4, swizzle, retFn, defFn, main, build } = shaderBuilder;
/* eslint-enable max-len, @typescript-eslint/no-unused-vars */

export const boundingBoxVert = build( () => {
  const position = defIn( 'vec3', 0 );

  const vPositionWithoutModel = defOutNamed( 'vec4', 'vPositionWithoutModel' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );

  const resolution = defUniform( 'vec2', 'resolution' );
  const projectionMatrix = defUniform( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniform( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniform( 'mat4', 'modelMatrix' );

  main( () => {
    assign( vPositionWithoutModel, vec4( position, 1.0 ) );

    assign( vPosition, mul( modelMatrix, vPositionWithoutModel ) );
    const outPos = def( 'vec4', mul( projectionMatrix, viewMatrix, vPosition ) );

    const aspect = div( swizzle( resolution, 'x' ), swizzle( resolution, 'y' ) );
    divAssign( swizzle( outPos, 'x' ), aspect );
    assign( glPosition, outPos );

    // assign(
    //   swizzle( vPosition, 'w' ),
    //   div( swizzle( outPos, 'z' ), swizzle( outPos, 'w' ) )
    // );
  } );
} );
