import { addAssign, assign, build, def, defInNamed, defOut, insert, main, mul, sw, vec4 } from '../shader-builder/shaderBuilder';
import { defSimplexFBM2d } from './modules/simplexFBM2d';
import { voronoi2d } from './modules/voronoi2d';
import { voronoi2dBorder } from './modules/voronoi2dBorder';

export const asphaltSurfaceFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const fbm2 = defSimplexFBM2d();

  main( () => {
    const voro = def( 'vec3', voronoi2d( mul( vUv, 80.0 ) ) );
    const voroBorder = def( 'vec3', voronoi2dBorder( mul( vUv, 80.0 ), voro ) );
    const height = def( 'float', mul( sw( voroBorder, 'z' ), 0.006 ) );

    const fbm = def( 'float', fbm2( mul( vUv, 20.0 ) ) );
    addAssign( height, mul( fbm, 0.007 ) );

    assign( fragColor, vec4(
      height,
      fbm2( mul( vUv, 1.0 ) ),
      fbm2( mul( vUv, 6.0 ) ),
      fbm2( mul( vUv, 40.0 ) ),
    ) );
  } );
} );
