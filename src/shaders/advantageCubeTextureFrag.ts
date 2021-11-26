import { assign, build, defInNamed, defOut, insert, main, mul, pow, smoothstep, step, sw, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { cyclicNoise } from './modules/cyclicNoise';
import { glslGradient } from './modules/glslGradient';

export const advantageCubeTextureFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  main( () => {
    const fbm = sw( mul(
      smoothstep(
        -1.0,
        1.0,
        cyclicNoise( vec3( mul( 4.0, vUv ), 66.0 ), { warp: 1.0, pump: 1.6 } )
      ),
      step( 1.0 / 32.0, sw( vUv, 'x' ) ),
    ), 'x' );
    const col = mul( 0.5, pow( glslGradient( fbm, [
      vec3( 0.05, 0.5, 0.15 ),
      vec3( 0.15, 0.95, 0.35 ),
      vec3( 1.0, 1.0, 1.0 ),
    ] ), vec3( 2.2 ) ) );
    assign( fragColor, vec4( col, 1.0 ) );
  } );
} );
