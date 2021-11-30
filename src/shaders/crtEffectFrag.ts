import { add, assign, build, def, defInNamed, defOut, defUniformNamed, insert, main, mix, mul, sin, sub, sw, texture, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { glslLofi } from './modules/glslLofi';
import { simplex4d } from './modules/simplex4d';

export const crtEffectFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const time = defUniformNamed( 'float', 'time' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' );

  // const { init, random } = glslDefRandom();

  main( () => {
    const plasmauv = glslLofi( vUv, vec2( 0.04, 0.02 ) );
    const plasma = def( 'float', add( 0.5, mul( 0.5, sin(
      mul( 15.0, simplex4d( vec4( plasmauv, mul( 0.4, time ), 0.0 ) ) )
    ) ) ) );
    const plasmac = mul(
      add( 0.5, mul( 0.5, sin( add( mul( -3.0, plasma ), 5.0, vec3( 0, 2, 4 ) ) ) ) ),
      plasma,
      sw( texture( sampler0, vUv ), 'xyz' ),
    );

    const tex1uv = add( glslLofi(
      add( vUv, vec2( 1.0 / 320.0, 1.0 / 240.0 ) ),
      vec2( 1.0 / 160.0, 1.0 / 120.0 ),
    ), vec2( 0.0 / 320.0, 1.0 / 240.0 ) );
    const tex1 = texture( sampler1, tex1uv );

    assign( fragColor, vec4( mix(
      plasmac,
      sub( vec3( 1.0 ), plasmac ),
      sw( tex1, 'x' ),
    ), 1.0 ) );
  } );
} );
