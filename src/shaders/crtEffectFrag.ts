import { addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, eq, floor, glFragCoord, ifThen, insert, main, mix, mod, mul, sub, sw, texture, vec2, vec4 } from '../shader-builder/shaderBuilder';

export const crtEffectFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const lace = defUniformNamed( 'float', 'lace' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const samplerPrev = defUniformNamed( 'sampler2D', 'samplerPrev' );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' );

  // const { init, random } = glslDefRandom();

  main( () => {
    ifThen( eq( lace, floor( mod( sw( glFragCoord, 'y' ), 2.0 ) ) ), () => {
      assign( fragColor, texture( samplerPrev, vUv ) );

    }, () => {
      const tex = def( 'vec4', texture( sampler0, vUv ) );

      const zoomuv = mix( vec2( 0.5 ), vec2( 1.0 ), mix( vec2( -0.95 ), vec2( 0.95 ), vUv ) );
      addAssign( tex, mul(
        vec4( 0.9, 0.7, 0.5, 1.0 ),
        sub( 0.5, texture( samplerPrev, zoomuv ) ),
      ) );

      assign( tex, mix(
        tex,
        vec4( 0.0 ),
        sw( texture( sampler1, vUv ), 'x' ),
      ) );

      assign( fragColor, vec4( sw( tex, 'xyz' ), 1.0 ) );

    } );
  } );
} );
