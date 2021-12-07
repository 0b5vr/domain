import { PI } from '../utils/constants';
import { add, addAssign, assign, atan, build, clamp, def, defInNamed, defOut, divAssign, exp, forLoop, ifThen, insert, length, lt, main, min, mix, mul, mulAssign, neg, subAssign, sw, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { cyclicNoise } from './modules/cyclicNoise';
import { defSimplexFBM2d } from './modules/simplexFBM2d';
import { glslLinearstep } from './modules/glslLinearstep';
import { glslLofi } from './modules/glslLofi';
import { rotate2D } from './modules/rotate2D';
import { sdcapsule } from './modules/sdcapsule';
import { simplex2d } from './modules/simplex2d';

export const cubeRootTextureFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const fbm2 = defSimplexFBM2d();

  main( () => {
    const d = def( 'float', 1.0 );

    const dirt = def( 'float', (
      fbm2( mul( 40.0, vUv ) )
    ) );

    const p = def( 'vec2', mix( vec2( -1.0 ), vec2( 1.0 ), vUv ) );
    const proot = def( 'vec2', p );
    addAssign( proot, mul(
      0.2,
      sw( cyclicNoise( vec3( mul( 1.0, vUv ), 2.0 ) ), 'xy' ),
    ) );
    const v = def( 'vec2', vec2( 0.2, 0.0 ) );
    const pmodangle = def( 'float', PI / 3.0 );

    forLoop( 6, () => {
      const angle = def( 'float', neg( atan( sw( proot, 'y' ), sw( proot, 'x' ) ) ) );
      ifThen( lt( pmodangle, PI / 3.0 ), () => (
        assign( angle, clamp( angle, neg( pmodangle ), pmodangle  ) )
      ) );
      const rota = glslLofi( add( angle, mul( 0.5, pmodangle ) ), pmodangle );
      mulAssign( proot, rotate2D( rota ) );

      assign( d, min( d, sdcapsule( proot, v ) ) );
      subAssign( proot, v );
      divAssign( v, add( 1.0, simplex2d( add( 25.0, mul( 2.0, proot ) ) ) ) );
      divAssign( pmodangle, 1.8 );
    } );

    addAssign( d, add(
      0.005,
      mul( -0.2, exp( mul( -4.0, length( p ) ) ) ),
    ) );

    // const noise = sw( mul(
    //   smoothstep(
    //     -1.0,
    //     1.0,
    //     cyclicNoise( vec3( mul( 3.0, vUv ), 2.0 ), { warp: 2.0, pump: 1.6 } )
    //   ),
    //   step( 1.0 / 32.0, sw( vUv, 'x' ) ),
    // ), 'x' );

    const height = add(
      mul( 0.003, dirt ),
      mul( 0.04, glslLinearstep( 0.0, -0.1, d ) ),
    );

    assign( fragColor, vec4( height, d, dirt, 1.0 ) );
  } );
} );
