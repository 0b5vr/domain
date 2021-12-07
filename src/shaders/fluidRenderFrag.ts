import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, eq, forBreak, forLoop, glFragCoord, gt, ifThen, insert, length, lt, main, mix, mul, mulAssign, retFn, smoothstep, sq, sub, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcL } from './modules/calcL';
import { defFluidSampleLinear3D } from './modules/defFluidSampleLinear3D';
import { forEachLights } from './modules/forEachLights';
import { glslDefRandom } from './modules/glslDefRandom';
import { glslSaturate } from './modules/glslSaturate';
import { maxOfVec3 } from './modules/maxOfVec3';
import { setupRoRd } from './modules/setupRoRd';

export const fluidRenderFrag = (
  fGridResoSqrt: number,
  fGridReso: number,
): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );

  const fragColor = defOut( 'vec4' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const modelMatrixT3 = defUniformNamed( 'mat3', 'modelMatrixT3' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );
  const samplerDensity = defUniformNamed( 'sampler2D', 'samplerDensity' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const { init, random } = glslDefRandom();

  const sampleLinear3D = defFluidSampleLinear3D( fGridResoSqrt, fGridReso );

  const getDensity = defFn( 'float', [ 'vec3' ], ( p ) => {
    const edgedecay = smoothstep( 0.5, 0.45, add( 0.5 / fGridReso, maxOfVec3( abs( p ) ) ) );
    ifThen( eq( edgedecay, 0.0 ), () => retFn( 0.0 ) );

    retFn( mul(
      edgedecay,
      glslSaturate( mul( 0.1, sq( sw( sampleLinear3D( samplerDensity, p ), 'x' ) ) ) ),
    ) );
  } );

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
      sw( resolution, 'y' ),
    ) );
    init( texture( samplerRandom, p ) );

    const { ro, rd } = setupRoRd( { inversePVM, p } );

    const rl0 = def( 'float', sub(
      length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ),
      mul( 0.05, random() ),
    ) );
    const rp = def( 'vec3', add( ro, mul( rd, rl0 ) ) );

    const accum = def( 'vec4', vec4( 0.0, 0.0, 0.0, 1.0 ) );
    const accumRGB = sw( accum, 'rgb' );
    const accumA = sw( accum, 'a' );

    forLoop( 50, () => {
      ifThen( lt( accumA, 0.1 ), () => forBreak() );

      const density = getDensity( rp );

      ifThen( gt( density, 1E-3 ), () => {
        forEachLights( ( { lightPos, lightColor } ) => {
          const [ L, lenL ] = calcL(
            mul( modelMatrixT3, lightPos ),
            rp,
          );

          const shadow = getDensity( add( rp, mul( L, 0.03 ) ) );

          const col = mix( vec3( 1.1, 0.1, 0.25 ), vec3( 0.1, 0.8, 4.0 ), density );
          addAssign( accumRGB, mul(
            glslSaturate( mix( 1.0, -2.0, shadow ) ),
            div( 1.0, sq( lenL ) ),
            lightColor,
            density,
            col,
            accumA,
          ) );
        } );

        mulAssign( accumA, sub( 1.0, density ) );
      } );

      addAssign( rp, mul( rd, mix( 0.02, 0.03, random() ) ) );

    } );

    assign( fragColor, vec4( accumRGB, 1.0 ) );
  } );
} );
