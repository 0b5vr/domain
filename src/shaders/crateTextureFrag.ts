import { add, assign, build, def, defFn, defInNamed, defOut, insert, length, main, mix, mul, mulAssign, num, pow, retFn, sin, smoothstep, sub, sw, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { glslLinearstep } from './modules/glslLinearstep';
import { sdcapsule } from './modules/sdcapsule';
import { simplex4d } from './modules/simplex4d';

export const crateTextureFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const woodTexture = defFn( 'vec3', [ 'float' ], ( s ) => {
    const noise = simplex4d(
      vec4( mul( vec2( 8.0, 32.0 ), vUv ), s, 0.0 )
    );
    retFn( mix(
      vec3( 0.8, 0.4, 0.0 ),
      vec3( 0.6, 0.2, 0.0 ),
      smoothstep( -1.0, 1.0, noise )
    ) );
  } );

  main( () => {
    const col = def( 'vec3', woodTexture( num( -1.0 ) ) );
    mulAssign( col, mix(
      0.55,
      0.7,
      smoothstep( -0.5, 0.5, sin( mul( 13.0, sw( vUv, 'y' ) ) ) )
    ) );

    [
      [ 1, 0, 0, 1, 1 ],
      [ 0, 0, 1, 1, 1 ],
      [ 0, 0, 0, 1, 2 ],
      [ 1, 1, 1, 0, 2 ],
      [ 0, 1, 1, 1, 2 ],
      [ 1, 0, 0, 0, 2 ],
    ].map( ( [ x1, y1, x2, y2, t ], i ) => {
      const tex = woodTexture( num( i ) );

      const a = vec2( x1, y1 );
      const b = vec2( x2, y2 );
      const d = sdcapsule( sub( vUv, a ), sub( b, a ) );
      const tBar1 = mul( t, 0.05 );
      const tBar0 = sub( tBar1, 0.01 );
      const tShadow = add( tBar1, 0.05 );
      mulAssign( col, sub( 1.0, mul( 0.5, glslLinearstep( tShadow, tBar1, d ) ) ) );
      assign( col, mix( col, tex, glslLinearstep( tBar1, tBar0, d ) ) );
    } );

    [
      [ 0, 0 ],
      [ 0, 1 ],
      [ 1, 0 ],
      [ 1, 1 ],
    ].map( ( [ x1, y1 ] ) => {
      const p = mix( vec2( 0.06 ), vec2( 0.94 ), vec2( x1, y1 ) );
      const d = length( sub( p, vUv ) );
      assign( col, mix( col, vec3( 0.5, 0.15, 0.0 ), glslLinearstep( 0.04, 0.03, d ) ) );
    } );

    assign( fragColor, vec4( mul( pow( col, vec3( 2.2 ) ), 0.5 ), 1.0 ) );
  } );
} );
