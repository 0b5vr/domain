import { add, assign, build, def, defInNamed, defOut, defUniform, discard, exp, ifThen, insert, length, lt, main, max, mul, mulAssign, sin, sub, swizzle, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';

export const boundingBoxFrag = ( tag: 'forward' | 'shadow' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const vPosition = defInNamed( 'vec4', 'vPosition' );

  const fragColor = defOut( 'vec4' );

  const time = defUniform( 'float', 'time' );
  const cameraNearFar = defUniform( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniform( 'vec3', 'cameraPos' );

  main( () => {
    const phase = add(
      swizzle( vPositionWithoutModel, 'x' ),
      swizzle( vPositionWithoutModel, 'y' ),
      swizzle( vPositionWithoutModel, 'z' ),
    );
    const pattern = sin( add( mul( phase, 40.0 ), mul( 10.0, time ) ) );

    ifThen( lt( pattern, 0.0 ), () => discard() );

    if ( tag === 'forward' ) {
      const color = def( 'vec3', vec3( 1.0 ) );

      const lenV = length( sub( cameraPos, swizzle( vPosition, 'xyz' ) ) );
      mulAssign( color, exp( mul( -0.4, max( sub( lenV, 3.0 ), 0.0 ) ) ) );

      assign( fragColor, vec4( color, 1.0 ) );

    } else if ( tag === 'shadow' ) {
      const distance = length( sub( cameraPos, swizzle( vPosition, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, distance ) );

    }
  } );
} );
