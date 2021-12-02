import { add, assign, build, defInNamed, defOut, defUniformNamed, discard, fract, ifThen, insert, length, lt, main, mul, sub, sw, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';

export const boundingBoxFrag = ( tag: 'forward' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const vPosition = defInNamed( 'vec4', 'vPosition' );

  const fragColor = defOut( 'vec4' );

  const dashRatio = defUniformNamed( 'float', 'dashRatio' );
  const time = defUniformNamed( 'float', 'time' );
  const opacity = defUniformNamed( 'float', 'opacity' );
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
      assign( fragColor, vec4( opacity ) );

    } else if ( tag === 'depth' ) {
      ifThen( lt( opacity, 0.5 ), () => discard() );
      const distance = length( sub( cameraPos, sw( vPosition, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, distance ) );

    }
  } );
} );
