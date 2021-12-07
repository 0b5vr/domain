import { add, addAssign, assign, build, def, defInNamed, defOut, insert, main, mul, smoothstep, sw, vec4 } from '../shader-builder/shaderBuilder';
import { defSimplexFBM2d } from './modules/simplexFBM2d';
import { voronoi2d } from './modules/voronoi2d';
import { voronoi2dBorder } from './modules/voronoi2dBorder';

export const warningCubeSurfaceFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const fbm2 = defSimplexFBM2d();

  main( () => {
    const voro = def( 'vec3', voronoi2d( mul( vUv, 300.0 ) ) );
    const voroBorder = def( 'vec3', voronoi2dBorder( mul( vUv, 300.0 ), voro ) );
    const height = def( 'float', mul( sw( voroBorder, 'z' ), 0.5 ) );

    const fbm = def( 'float', fbm2( mul( vUv, 100.0 ) ) );
    addAssign( height, mul( fbm, 0.5 ) );

    const fbmb = def( 'float', fbm2( add( 2.0, mul( vUv, 2.0 ) ) ) );
    const dirt = def( 'float', smoothstep(
      0.0,
      0.7,
      add( fbmb, mul( -0.5, height ) ),
    ) );

    assign( fragColor, vec4( height, fbm, dirt, 1.0 ) );
  } );
} );
