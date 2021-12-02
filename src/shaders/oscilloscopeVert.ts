import { add, assign, build, def, defIn, defOutNamed, defUniformNamed, div, divAssign, glPointSize, glPosition, main, mix, mul, pow, sin, sw, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { glslDefRandom } from './modules/glslDefRandom';
import { uniformSphere } from './modules/uniformSphere';

export const oscilloscopeVert = build( () => {
  const instanceId = defIn( 'float', 0 );

  const vInstanceId = defOutNamed( 'float', 'vInstanceId' );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );

  const { init, random } = glslDefRandom();

  main( () => {
    init( vec4( instanceId, time, instanceId, time ) );

    // -- assign varying variables -----------------------------------------------------------------
    assign( vInstanceId, instanceId );

    // -- compute size -----------------------------------------------------------------------------
    const off = mul( 0.5, mix(
      sin( add(
        mul( 5.0, vec3( 3.01, 4.01, 5.03 ), vec3( add( mul( 40.0, time ), instanceId ) ) ),
      ) ),
      mul(
        uniformSphere(),
        pow( random(), 4.0 ),
      ),
      0.3,
    ) );

    const pos = def( 'vec4', vec4( off, 1.0 ) );

    // -- send the vertex position -----------------------------------------------------------------
    assign( glPosition, mul( projectionMatrix, viewMatrix, modelMatrix, pos ) );

    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    divAssign( sw( glPosition, 'x' ), aspect );

    assign( glPointSize, mul(
      sw( resolution, 'y' ),
      div( 0.04, sw( glPosition, 'w' ) ),
    ) );
  } );
} );
