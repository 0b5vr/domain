import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, eq, forBreak, forLoop, glFragCoord, gt, ifThen, insert, length, lt, main, mix, mul, mulAssign, retFn, smoothstep, sub, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcL } from './modules/calcL';
import { calcLightFalloff } from './modules/calcLightFalloff';
import { forEachLights } from './modules/forEachLights';
import { glslDefRandom } from './modules/glslDefRandom';
import { glslSaturate } from './modules/glslSaturate';
import { maxOfVec3 } from './modules/maxOfVec3';
import { setupRoRd } from './modules/setupRoRd';
import { simplex3d } from './modules/simplex3d';

export const skyFrag = build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );

  const fragColor = defOut( 'vec4' );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const modelMatrixT3 = defUniformNamed( 'mat3', 'modelMatrixT3' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const getDensity = defFn( 'float', [ 'vec3' ], ( p ) => {
    const edgedecay = smoothstep( 0.5, 0.45, maxOfVec3( abs( p ) ) );
    ifThen( eq( edgedecay, 0.0 ), () => retFn( 0.0 ) );

    const d = def( 'float', 0.0 );

    addAssign( d, mul( 0.3, simplex3d( vec3( add( mul( 1.0, p ), mul( time, 0.1 ) ) ) ) ) );
    addAssign( d, mul( 0.1, simplex3d( vec3( add( mul( 4.0, p ), mul( time, 0.1 ) ) ) ) ) );
    addAssign( d, mul( 0.04, simplex3d( vec3( add( mul( 9.0, p ), mul( time, 0.1 ) ) ) ) ) );

    retFn( mul( edgedecay, glslSaturate( d ) ) );
  } );

  const { init, random } = glslDefRandom();

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
      sw( resolution, 'y' ),
    ) );

    init( texture( samplerRandom, p ) );

    const { ro, rd } = setupRoRd( { inversePVM, p } );

    const rl0 = sub(
      length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ),
      mul( 0.05, random() ),
    );
    const rp = def( 'vec3', add( ro, mul( rd, rl0 ) ) );

    const accum = def( 'vec4', vec4( 0.0, 0.0, 0.0, 1.0 ) );
    const accumRGB = sw( accum, 'rgb' );
    const accumA = sw( accum, 'a' );

    forLoop( 50, () => {
      ifThen( lt( accumA, 0.01 ), () => forBreak() );

      const density = getDensity( rp );

      ifThen( gt( density, 1E-2 ), () => {
        forEachLights( ( { lightPos, lightColor } ) => {
          const [ L, lenL ] = calcL(
            mul( modelMatrixT3, lightPos ),
            rp,
          );

          const shadow = getDensity( add( rp, mul( L, 0.1 ) ) );

          addAssign( accumRGB, mul(
            glslSaturate( mix( 1.0, -5.0, shadow ) ),
            calcLightFalloff( lenL ),
            0.5,
            lightColor,
            density,
            vec3( 1.0 ),
            accumA,
          ) );
        } );

        mulAssign( accumA, sub( 1.0, density ) );
      } );

      addAssign( rp, mul( rd, mix( 0.02, 0.03, random() ) ) );

    } );

    assign( fragColor, vec4( mix(
      accumRGB,
      mix( vec3( 0.02, 0.2, 0.7 ), vec3( 0.04, 0.3, 0.8 ), sw( rd, 'y' ) ),
      accumA,
    ), 1.0 ) );

  } );
} );
