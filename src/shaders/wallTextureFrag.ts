import { abs, add, assign, build, def, defInNamed, defOut, dot, fract, insert, length, main, mix, mod, mul, smoothstep, sq, step, sub, sw, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { cyclicNoise } from './modules/cyclicNoise';
import { defSimplexFBM2d } from './modules/simplexFBM2d';
import { glslTri } from './modules/glslTri';
import { simplex3d } from './modules/simplex3d';

export const wallTextureFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const fbm2 = defSimplexFBM2d();

  main( () => {
    const cloud = def( 'float', fbm2( mul( 6.0, vUv ) ) );

    const crackUv = def( 'vec2', mul( 10.0, vUv ) );
    const crackP = def( 'vec3', cyclicNoise( vec3( crackUv, 0.0 ), { pump: 1.1 } ) );
    const crack = sw( cyclicNoise( mul( 0.1, crackP ), { pump: 1.1 } ), 'x' );

    const holepre = simplex3d( mix( vec3( mul( vUv, 80.0 ), 0.0 ), crackP, 0.3 ) );
    const hole = smoothstep( 0.9, 1.0, add( holepre, cloud ) );

    const uvHole2 = sub( abs( sub(
      mod( vUv, vec2( 1.0 / 8.0, 1.0 / 6.0 ) ),
      vec2( 1.0 / 16.0, 1.0 / 12.0 ),
    ) ), vec2( 1.0 / 16.0 - 0.03, 1.0 / 12.0 - 0.03 ) );
    const hole2 = step( length( uvHole2 ), 0.003 );

    const gapptn = add(
      glslTri( add( 0.25, mul( vec2( 8.0, 6.0 ), vUv ) ) ),
      mul( 0.1, crack ),
    );
    const gap = dot( vec2( 1.0 ), smoothstep( 0.97, 1.0, gapptn ) );

    const dirtCyclic = sw( cyclicNoise( mul( 12.0, vec3( vUv, 8.0 ) ), { pump: 1.4 } ), 'x' );
    const dirtSimplexH = fbm2( mul( vec2( 2.0, 10.0 ), vUv ) );
    const dirtSimplexV = fbm2( mul( vec2( 10.0, 2.0 ), vUv ) );
    const dirtGap = dot( vec2( 1.0 ), smoothstep( 0.9, 1.0, gapptn ) );
    const dirtDrip = sq( fract( mul( 6.0, sw( vUv, 'y' ) ) ) );
    const dirt = smoothstep(
      0.0,
      1.0,
      add(
        mul( 0.3, dirtCyclic ),
        mul( 0.5, dirtSimplexH ),
        mul( 0.5, dirtSimplexV ),
        mul( 0.5, dirtGap ),
        mul( 0.5, dirtDrip ),
        hole2,
      )
    );

    const roughness = def( 'float', add(
      0.4,
      mul( 0.03, cloud ),
      mul( 0.2, crack ),
    ) );
    const height = def( 'float', sub(
      mul( 0.1, cloud ),
      mul( 0.3, hole ),
      gap,
      mul( 1.0, hole2 ),
      mul( 0.1, roughness ),
    ) );
    assign( fragColor, vec4( height, roughness, hole, dirt ) );
  } );
} );
