import { add, assign, build, def, defInNamed, defOut, defUniformNamed, discard, fract, ifThen, insert, length, lt, main, mul, sub, sw, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';

export const boundingBoxFrag = ( tag: 'forward' | 'shadow' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const vPosition = defInNamed( 'vec4', 'vPosition' );

  const fragColor = defOut( 'vec4' );

  const dashRatio = defUniformNamed( 'float', 'dashRatio' );
  const time = defUniformNamed( 'float', 'time' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );

  main( () => {
    const phase = add(
      sw( vPositionWithoutModel, 'x' ),
      sw( vPositionWithoutModel, 'y' ),
      sw( vPositionWithoutModel, 'z' ),
    );
    const pattern = fract( add( mul( phase, 10.0 ), mul( 2.5, time ) ) );

    ifThen( lt( pattern, dashRatio ), () => discard() );

    if ( tag === 'forward' ) {
      const color = def( 'vec3', vec3( 1.0 ) );
      assign( fragColor, vec4( color, 1.0 ) );

    } else if ( tag === 'shadow' ) {
      const distance = length( sub( cameraPos, sw( vPosition, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, distance ) );

    }
  } );
} );
