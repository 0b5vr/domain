import { add, addAssign, assign, build, def, defInNamed, defOut, div, dot, insert, main, mix, mul, mulAssign, smoothstep, sub, sw, unrollLoop, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { cyclicNoise } from './modules/cyclicNoise';
import { glslTri } from './modules/glslTri';
import { simplex4d } from './modules/simplex4d';

export const wallTextureFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  main( () => {
    const cloud = def( 'float', 0.0 );
    const freq = def( 'float', 1.0 );
    unrollLoop( 4, ( i ) => {
      mulAssign( freq, 2.0 );
      const n = simplex4d( vec4( mul( 10.0, vUv, freq ), 0.0, i ) );
      addAssign( cloud, div( n, freq ) );
    } );

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

    const roughness = def( 'float', add(
      0.3,
      mul( 0.03, cloud ),
      mul( 0.2, crack ),
    ) );
    const height = def( 'float', sub(
      mul( 0.1, cloud ),
      hole,
      gap,
      mul( 0.1, roughness )
    ) );
    assign( fragColor, vec4( height, roughness, hole, 1.0 ) );
  } );
} );
