import { add, addAssign, assign, build, def, defInNamed, defOut, insert, main, mul, sw, vec4 } from '../shader-builder/shaderBuilder';
import { defSimplexFBM4d } from './modules/simplexFBM4d';
import { glslSaturate } from './modules/glslSaturate';
import { voronoi2d } from './modules/voronoi2d';
import { voronoi2dBorder } from './modules/voronoi2dBorder';

export const warningCubeSurfaceFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const simplexFBM4d = defSimplexFBM4d();

  main( () => {
    const voro = def( 'vec3', voronoi2d( mul( vUv, 140.0 ) ) );
    const voroBorder = def( 'vec3', voronoi2dBorder( mul( vUv, 140.0 ), voro ) );
    const height = def( 'float', mul( sw( voroBorder, 'z' ), 0.5 ) );

    const fbm = def( 'float', simplexFBM4d( vec4( mul( vUv, 40.0 ), 0.0, 0.0 ) ) );
    addAssign( height, mul( fbm, 0.5 ) );

    const fbm2 = def( 'float', simplexFBM4d( vec4( mul( vUv, 8.0 ), 0.0, 0.0 ) ) );
    const dirt = def( 'float', glslSaturate(
      add(
        0.3,
        mul(
          0.4,
          add( fbm2, mul( -0.5, height ) ),
        ),
      ),
    ) );

    assign( fragColor, vec4( height, fbm, dirt, 1.0 ) );
  } );
} );
