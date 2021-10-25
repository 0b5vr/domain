import { GLSLExpression, abs, add, addAssign, assign, build, def, defConst, defFn, defInNamed, defOut, defUniformArrayNamed, defUniformNamed, div, eq, exp, forBreak, forLoop, glFragCoord, gt, ifThen, insert, length, lt, main, max, mix, mul, mulAssign, retFn, sq, sub, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcL } from './modules/calcL';
import { defFluidSampleLinear3D } from './modules/defFluidSampleLinear3D';
import { defForEachLights } from './modules/forEachLights';
import { glslDefRandom } from './modules/glslDefRandom';
import { glslSaturate } from './modules/glslSaturate';
import { setupRoRd } from './modules/setupRoRd';

const MARCH_ITER = 50;
const SHADOW_ITER = 10;
const INV_MARCH_ITER = 1.0 / MARCH_ITER;
const INV_SHADOW_ITER = 1.0 / SHADOW_ITER;
const MARCH_STEP_LENGTH = 0.2;
const SHADOW_STEP_LENGTH = 0.04;

export const fluidRenderFrag = (
  fGridResoSqrt: number,
  fGridReso: number,
): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );

  const fragColor = defOut( 'vec4' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const modelMatrixT3 = defUniformNamed( 'mat3', 'modelMatrixT3' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );
  const samplerDensity = defUniformNamed( 'sampler2D', 'samplerDensity' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const forEachLights = defForEachLights(
    defUniformNamed( 'int', 'lightCount' ),
    defUniformArrayNamed( 'vec3', 'lightPos', 8 ),
    defUniformArrayNamed( 'vec3', 'lightColor', 8 ),
    defUniformArrayNamed( 'vec2', 'lightNearFar', 8 ),
    defUniformArrayNamed( 'vec4', 'lightParams', 8 ),
    defUniformArrayNamed( 'mat4', 'lightPV', 8 ),
  );

  const { init, random } = glslDefRandom();

  const sampleLinear3D = defFluidSampleLinear3D( fGridResoSqrt, fGridReso );

  const stepLenRandom = ( len: number ): GLSLExpression<'float'> => (
    mul( len, mix( 0.5, 1.0, random() ) )
  );

  const getDensity = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const bound = defConst( 'vec3', vec3( 0.5 - 0.5 / fGridReso ) );
    ifThen( eq( max( abs( p ), bound ), bound ), () => {
      retFn( sampleLinear3D( samplerDensity, p ) );
    }, () => {
      retFn( vec4( 0.0 ) );
    } );
  } );

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
      sw( resolution, 'y' ),
    ) );
    init( texture( samplerRandom, p ) );

    const { ro, rd } = setupRoRd( { inversePVM, p } );

    const rl = def( 'float', length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ) );
    addAssign( rl, mul( MARCH_STEP_LENGTH, random() ) );
    const rp = def( 'vec3', add( ro, mul( rd, rl ) ) );

    const accum = def( 'vec4', vec4( 0.0, 0.0, 0.0, 1.0 ) );
    const accumRGB = sw( accum, 'rgb' );
    const accumA = sw( accum, 'a' );

    forLoop( MARCH_ITER, () => {
      ifThen( lt( accumA, 0.1 ), () => forBreak() );

      const density = glslSaturate( mul( 6.0, sw( getDensity( rp ), 'x' ), INV_MARCH_ITER ) );

      ifThen( gt( density, 1E-3 ), () => {
        forEachLights( ( { lightPos, lightColor } ) => {
          const [ L, lenL ] = calcL(
            mul( modelMatrixT3, lightPos ),
            rp,
          );

          const lrl = def( 'float', stepLenRandom( SHADOW_STEP_LENGTH ) );
          const lrp = def( 'vec3', add( rp, mul( L, lrl ) ) );
          const shadow = def( 'float', 0.0 );

          forLoop( SHADOW_ITER, () => {
            const lsample = sw( getDensity( lrp ), 'x' );
            addAssign( shadow, lsample );

            addAssign( lrl, stepLenRandom( SHADOW_STEP_LENGTH ) );
            assign( lrp, add( rp, mul( L, lrl ) ) );
          } );

          const shadowDecay = exp( mul( -1.0, shadow, INV_SHADOW_ITER ) );
          const col = mix( vec3( 1.1, 0.1, 0.25 ), vec3( 0.1, 0.8, 4.0 ), density );
          addAssign( accumRGB, mul(
            shadowDecay,
            div( 1.0, sq( lenL ) ),
            lightColor,
            density,
            col,
            accumA,
          ) );
        } );

        mulAssign( accumA, sub( 1.0, density ) );
      } );

      addAssign( rl, stepLenRandom( MARCH_STEP_LENGTH ) );
      assign( rp, add( ro, mul( rd, rl ) ) );

      ifThen( gt( rl, sw( cameraNearFar, 'y' ) ), () => forBreak() );
    } );

    assign( fragColor, vec4( accumRGB, 1.0 ) );
  } );
} );
