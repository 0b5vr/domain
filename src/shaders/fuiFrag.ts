import { abs, add, assign, build, def, defInNamed, defOutNamed, defUniformNamed, discard, ifThen, insert, lt, main, max, mul, mulAssign, sin, step, sub, sw, texture, vec4 } from '../shader-builder/shaderBuilder';
import { glslDefRandom } from './modules/glslDefRandom';

const aspect = 16.0 / 9.0;

export const fuiFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const time = defUniformNamed( 'float', 'time' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );
  const samplerChar = defUniformNamed( 'sampler2D', 'samplerChar' );

  const { random, init } = glslDefRandom();

  main( () => {
    init( texture( samplerRandom, vUv ) );

    const p = def( 'vec2', sub( mul( vUv, 2.0 ), 1.0 ) );
    mulAssign( sw( p, 'x' ), aspect );

    const haha = def( 'float', 0.0 );

    // slasherbox
    assign( haha, max( haha, mul(
      step( abs( add( sw( p, 'x' ), 0.3 ) ), 1.4 ),
      step( abs( add( sw( p, 'y' ), 0.93 ) ), 0.003 ),
      step( -0.5, sin( mul( 100.0, add( sw( p, 'x' ), mul( 0.1, time ) ) ) ) ),
    ) ) );

    // chars
    const tex = texture( samplerChar, vUv );
    assign( haha, max( haha, sw( tex, 'x' ) ) );

    ifThen( lt( haha, random() ), () => discard() );

    assign( fragColor, vec4( 1.0 ) );
  } );
} );