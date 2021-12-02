import { add, addAssign, assign, build, def, defInNamed, defOutNamed, defUniformNamed, discard, ifThen, insert, length, lt, main, max, min, mul, mulAssign, sin, sub, sw, texture, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { glslLinearstep } from './modules/glslLinearstep';
import { rotate2D } from './modules/rotate2D';
import { sdcapsule } from './modules/sdcapsule';

export const fuiFrag = ( tag: 'forward' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const time = defUniformNamed( 'float', 'time' );
  const opacity = defUniformNamed( 'float', 'opacity' );
  const samplerChar = defUniformNamed( 'sampler2D', 'samplerChar' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );

  main( () => {
    const p = def( 'vec2', sub( mul( vUv, 2.0 ), 1.0 ) );

    const haha = def( 'float', 0.0 );

    // cube
    const mCubeZX = def( 'mat2', rotate2D( time ) );
    const mCubeYZ = def( 'mat2', rotate2D( 0.4 ) );
    const cubeVs = ( [
      [ -1, -1, -1 ],
      [ -1, -1,  1 ],
      [ -1,  1,  1 ],
      [ -1,  1, -1 ],
      [  1, -1, -1 ],
      [  1, -1,  1 ],
      [  1,  1,  1 ],
      [  1,  1, -1 ],
    ] as [ number, number, number ][] ).map( ( arr ) => {
      const v = def( 'vec3', vec3( ...arr ) );
      assign( sw( v, 'zx' ), mul( mCubeZX, sw( v, 'zx' ) ) );
      assign( sw( v, 'yz' ), mul( mCubeYZ, sw( v, 'yz' ) ) );
      mulAssign( v, 0.06 );
      addAssign( v, vec3( 0.86, -0.86, 0.0 ) );
      return def( 'vec2', sw( v, 'xy' ) );
    } );

    const dCube = def( 'float', 1.0 );
    [
      [ 0, 1 ],
      [ 1, 2 ],
      [ 2, 3 ],
      [ 3, 0 ],
      [ 4, 5 ],
      [ 5, 6 ],
      [ 6, 7 ],
      [ 7, 4 ],
      [ 0, 4 ],
      [ 1, 5 ],
      [ 2, 6 ],
      [ 3, 7 ],
    ].map( ( [ ia, ib ] ) => {
      const a = cubeVs[ ia ];
      const b = cubeVs[ ib ];
      assign( dCube, min( dCube, sdcapsule( sub( p, a ), sub( b, a ) ) ) );
    } );

    assign( haha, max( haha, (
      glslLinearstep( 0.005, 0.002, dCube )
    ) ) );

    // dotted line
    assign( haha, max( haha, mul(
      glslLinearstep( 0.005, 0.003, sdcapsule( sub( p, vec2( -1.0, -0.97 ) ), vec2( 2.0, 0.0 ) ) ),
      glslLinearstep( -0.5, -0.4, sin( mul( 100.0, add( sw( p, 'x' ), mul( 0.1, time ) ) ) ) ),
    ) ) );

    // chars
    const tex = texture( samplerChar, vUv );
    assign( haha, max( haha, sw( tex, 'x' ) ) );

    // opacity
    mulAssign( haha, opacity );

    if ( tag === 'forward' ) {
      ifThen( lt( haha, 0.1 ), () => discard() );

      assign( fragColor, vec4( haha ) );

    } else if ( tag === 'depth' ) {
      ifThen( lt( haha, 0.5 ), () => discard() );

      const posXYZ = sw( vPosition, 'xyz' );

      const len = length( sub( cameraPos, posXYZ ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      return;

    }
  } );
} );
