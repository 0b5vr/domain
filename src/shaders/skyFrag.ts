import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, exp, floor, forBreak, forLoop, fract, glFragCoord, glFragDepth, GLSLExpression, gt, ifThen, insert, length, lt, main, mix, mul, mulAssign, neg, retFn, sq, sub, subAssign, sw, texture, unrollLoop, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcL } from './modules/calcL';
import { forEachLights } from './modules/forEachLights';
import { glslDefRandom } from './modules/glslDefRandom';
import { glslSaturate } from './modules/glslSaturate';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';
import { simplex4d } from './modules/simplex4d';

const MARCH_ITER = 50;
const SHADOW_ITER = 5;
const INV_SHADOW_ITER = 1.0 / SHADOW_ITER;
const MARCH_STEP_LENGTH = 0.1;
const SHADOW_STEP_LENGTH = 0.04;

export const skyFrag = build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );

  const fragColor = defOut( 'vec4' );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const modelMatrixT3 = defUniformNamed( 'mat3', 'modelMatrixT3' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const stepLenRandom = ( len: number ): GLSLExpression<'float'> => (
    mul( len, mix( 0.8, 1.0, random() ) )
  );

  const getDensity = defFn( 'float', [ 'vec3' ], ( p ) => {
    // const d = def( 'float', sub( length( p ), 0.1 ) );
    const d = def( 'float', mul( -1.0, sdbox( p, vec3( 0.3 ) ) ) );

    addAssign( d, mul( 1.5, simplex4d( vec4( add( mul( 1.0, p ), mul( time, 0.1 ) ), 0.0 ) ) ) );
    addAssign( d, mul( 0.5, simplex4d( vec4( add( mul( 3.0, p ), mul( time, 0.1 ) ), 0.0 ) ) ) );
    addAssign( d, mul( 0.2, simplex4d( vec4( add( mul( 6.0, p ), mul( time, 0.1 ) ), 0.0 ) ) ) );

    retFn( glslSaturate( d ) );
  } );

  const { init, random } = glslDefRandom();

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
      sw( resolution, 'y' ),
    ) );

    init( texture( samplerRandom, p ) );

    const { ro, rd } = setupRoRd( { inversePVM, p } );

    const rl = def( 'float', length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ) );
    subAssign( rl, mul( MARCH_STEP_LENGTH, random() ) );
    const rp = def( 'vec3', add( ro, mul( rd, rl ) ) );

    const accum = def( 'vec4', vec4( 0.0, 0.0, 0.0, 1.0 ) );
    const accumRGB = sw( accum, 'rgb' );
    const accumA = sw( accum, 'a' );

    forLoop( MARCH_ITER, () => {
      ifThen( lt( accumA, 0.1 ), () => forBreak() );

      const density = getDensity( rp );

      ifThen( gt( density, 1E-2 ), () => {
        forEachLights( ( { lightPos, lightColor } ) => {
          const [ L, lenL ] = calcL(
            mul( modelMatrixT3, lightPos ),
            rp,
          );

          const lrl = def( 'float', stepLenRandom( SHADOW_STEP_LENGTH ) );
          const lrp = def( 'vec3', add( rp, mul( L, lrl ) ) );
          const shadow = def( 'float', 0.0 );

          forLoop( SHADOW_ITER, () => {
            const lsample = getDensity( lrp );
            addAssign( shadow, lsample );

            addAssign( lrl, stepLenRandom( SHADOW_STEP_LENGTH ) );
            assign( lrp, add( rp, mul( L, lrl ) ) );
          } );

          const shadowDecay = exp( mul( -1.0, shadow, INV_SHADOW_ITER ) );
          addAssign( accumRGB, mul(
            shadowDecay,
            div( 1.0, sq( lenL ) ),
            lightColor,
            density,
            vec3( 1.0 ),
            accumA,
          ) );
        } );

        mulAssign( accumA, sub( 1.0, density ) );
      } );

      addAssign( rl, mix( 0.8, 1.0, stepLenRandom( MARCH_STEP_LENGTH ) ) );
      assign( rp, add( ro, mul( rd, rl ) ) );

    } );

    assign( fragColor, vec4( mix(
      accumRGB,
      mix( vec3( 0.02, 0.2, 0.7 ), vec3( 0.04, 0.3, 0.8 ), sw( rd, 'y' ) ),
      accumA,
    ), 1.0 ) );

  } );
} );
