import { add, assign, build, def, defInNamed, defOut, dot, fract, insert, main, mix, mul, smoothstep, sq, sub, sw, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { cyclicNoise } from './modules/cyclicNoise';
import { defSimplexFBM4d } from './modules/simplexFBM4d';
import { glslTri } from './modules/glslTri';
import { simplex4d } from './modules/simplex4d';

export const wallTextureFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const simplexFBM4d = defSimplexFBM4d();

  main( () => {
    const cloud = def( 'float', simplexFBM4d( vec4( mul( 10.0, vUv ), 0.0, 0.0 ) ) );

    const crackUv = def( 'vec2', mul( 10.0, vUv ) );
    const crackP = def( 'vec3', cyclicNoise( vec3( crackUv, 0.0 ), { pump: 1.1 } ) );
    const crack = sw( cyclicNoise( mul( 0.1, crackP ), { pump: 1.1 } ), 'x' );

    const holepre = simplex4d( vec4( mix( vec3( mul( vUv, 80.0 ), 0.0 ), crackP, 0.3 ), 0.0 ) );
    const hole = smoothstep( 0.9, 1.0, add( holepre, cloud ) );

    const gapptn = add(
      glslTri( add( 0.25, mul( vec2( 8.0, 6.0 ), vUv ) ) ),
      mul( 0.1, crack ),
    );
    const gap = dot( vec2( 1.0 ), smoothstep( 0.97, 1.0, gapptn ) );

    const dirtCyclic = sw( cyclicNoise( mul( 12.0, vec3( vUv, 8.0 ) ), { pump: 1.4 } ), 'x' );
    const dirtSimplexH = simplexFBM4d( vec4( mul( vec2( 4.0, 20.0 ), vUv ), 0.0, 20.0 ) );
    const dirtSimplexV = simplexFBM4d( vec4( mul( vec2( 20.0, 4.0 ), vUv ), 0.0, 40.0 ) );
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
      )
    );

    const roughness = def( 'float', add(
      0.4,
      mul( 0.03, cloud ),
      mul( 0.2, crack ),
    ) );
    const height = def( 'float', sub(
      mul( 0.1, cloud ),
      hole,
      gap,
      mul( 0.1, roughness )
    ) );
    assign( fragColor, vec4( height, roughness, hole, dirt ) );
  } );
} );
