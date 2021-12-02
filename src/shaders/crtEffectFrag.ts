import { add, assign, build, defInNamed, defOut, defUniformNamed, insert, main, mix, sub, sw, texture, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { glslLofi } from './modules/glslLofi';

export const crtEffectFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' );

  // const { init, random } = glslDefRandom();

  main( () => {
    const tex0 = sw( texture( sampler0, vUv ), 'xyz' );

    const tex1uv = add( glslLofi(
      add( vUv, vec2( 1.0 / 320.0, 1.0 / 240.0 ) ),
      vec2( 1.0 / 160.0, 1.0 / 120.0 ),
    ), vec2( 0.0 / 320.0, 1.0 / 240.0 ) );
    const tex1 = texture( sampler1, tex1uv );

    assign( fragColor, vec4( mix(
      tex0,
      sub( vec3( 1.0 ), tex0 ),
      sw( tex1, 'x' ),
    ), 1.0 ) );
  } );
} );
