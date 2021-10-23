import { add, addAssign, assign, build, clamp, def, defFn, defInNamed, defOut, defUniformNamed, div, dot, eq, ifThen, insert, lt, main, max, mix, mul, pow, retFn, step, sub, sw, tern, texture, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { downsampleTap13 } from './modules/downsampleTap13';

export const bloomDownFrag = build( () => {
  insert( 'precision highp float;' );

  const LUMA = vec3( 0.299, 0.587, 0.114 );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const level = defUniformNamed( 'float', 'level' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  const fetchWithWeight = defFn( 'vec4', [ 'vec2' ], ( uv ) => {
    const tex = def( 'vec3', sw( texture( sampler0, uv ), 'xyz' ) );
    const luma = dot( LUMA, tex );
    retFn( vec4( tex, add( 1.0, mul( 0.5, luma ) ) ) );
  } );

  main( () => {
    const p = mul( 2.0, def( 'float', pow( 0.5, level ) ) ); // 2.0, 1.0, 0.5, 0.25...

    const deltaTexel = def( 'vec2', div( 1.0, resolution ) );

    const uv0 = def( 'vec2', mul( step( 0.5, level ), vec2( sub( 1.0, p ) ) ) );
    const uv1 = def( 'vec2', vec2( sub( 1.0, mul( step( 0.5, level ), 0.5, p ) ) ) );
    const uv = def( 'vec2', mix( uv0, uv1, vUv ) );
    assign( uv, clamp(
      uv,
      add( uv0, deltaTexel ),
      sub( uv1, deltaTexel ),
    ) );

    const accum = def( 'vec4' );
    downsampleTap13( ( weight, offset ) => {
      const tex = fetchWithWeight( sub( uv, mul( deltaTexel, offset ) ) );
      addAssign( accum, mul( weight, tex ) );
    } );

    const col = def( 'vec3', div( sw( accum, 'rgb' ), sw( accum, 'w' ) ) );

    ifThen( eq( level, 0.0 ), () => {
      const brightness = def( 'float', dot( LUMA, col ) );
      const normalized = tern( lt( brightness, 1E-4 ), vec3( brightness ), div( col, brightness ) );
      assign( col, mul( max( 0.0, sub( brightness, 0.6 ) ), normalized ) );
    } );

    assign( fragColor, vec4( col, 1.0 ) );
  } );
} );
