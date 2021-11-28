import { assign, build, defInNamed, defOut, exp, glPointCoord, insert, length, main, max, mix, mul, smoothstep, sub, vec3, vec4 } from '../shader-builder/shaderBuilder';

export const oscilloscopeFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOut( 'vec4' );

  const vInstanceId = defInNamed( 'float', 'vInstanceId' );

  main( () => {
    const shape = smoothstep( 0.5, 0.2, length( sub( glPointCoord, 0.5 ) ) );

    assign( fragColor, vec4(
      mul(
        vec3( 0.0, shape, 0.0 ),
        exp( mul( -5.0, max( 0.0, mix( 1.0, -1.0, vInstanceId ) ) ) ),
      ),
      1.0,
    ) );

  } );
} );
