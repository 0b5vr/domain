import { addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, div, insert, main, mul, sub, sw, textureLod } from '../shader-builder/shaderBuilder';
import { downsampleTap13 } from './modules/downsampleTap13';

export const mipmapDownFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const lod = defUniformNamed( 'float', 'lod' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    const deltaTexel = def( 'vec2', div( 1.0, resolution ) );

    const accum = def( 'vec4' );
    downsampleTap13( ( weight, offset ) => {
      const tex = textureLod( sampler0, sub( vUv, mul( deltaTexel, offset ) ), lod );
      addAssign( accum, mul( weight, tex ) );
      addAssign( accum, mul( weight, tex ) );
    } );

    assign( fragColor, div( accum, sw( accum, 'w' ) ) );
  } );
} );
