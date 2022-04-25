import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredConstants';
import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, glFragCoord, glFragDepth, glslFalse, glslTrue, gt, ifThen, insert, length, main, max, min, mix, mul, neg, normalize, retFn, sign, smoothstep, sq, sub, subAssign, sw, texture, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { cyclicNoise } from './modules/cyclicNoise';
import { glslLinearstep } from './modules/glslLinearstep';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';
import { simplex3d } from './modules/simplex3d';
import { smax } from './modules/smax';
import { smin } from './modules/smin';

export const escFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );
  const samplerText = defUniformNamed( 'sampler2D', 'samplerText' );

  const shouldUseNoise = def( 'bool', glslFalse );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const pt = def( 'vec3', p );
    subAssign( sw( pt, 'z' ), mul(
      0.5,
      smax( 0.0, sw( pt, 'z' ), 0.1 ),
      sq( smin( 0.5, length( sw( pt, 'xy' ) ), 0.1 ) ),
    ) );
    addAssign( sw( pt, 'xy' ), mul(
      0.15,
      sign( sw( pt, 'xy' ) ),
      sq( min( 1.0, add( sw( pt, 'z' ), 0.5 ) ) ),
    ) );
    const d = def( 'float', max(
      sdbox( pt, vec3( 0.48, 0.48, 0.38 ) ),
      neg( sdbox( add( pt, vec3( 0.0, 0.0, 0.1 ) ), vec3( 0.44, 0.44, 0.38 ) ) ),
    ) );
    subAssign( d, 0.02 );

    assign( d, min( d, max(
      sub( abs( sw( p, 'z' ) ), 0.4 ),
      max(
        sub( length( sw( p, 'xy' ) ), 0.1 ),
        neg( min(
          sdbox( p, vec3( 0.02, 0.07, 1.0 ) ),
          sdbox( p, vec3( 0.07, 0.02, 1.0 ) ),
        ) )
      ),
    ) ) );

    const text = def( 'float', 0.0 );

    ifThen( shouldUseNoise, () => {
      const noise = simplex3d( mul( 50.0, p ) );
      addAssign( d, mul( 0.0001, noise ) );

      ifThen( gt( sw( pt, 'z' ), 0.40 ), () => {
        const uv = glslLinearstep( vec2( -0.7, 0.3 ), vec2( 0.5, -0.08 ), sw( p, 'xy' ) );
        assign( text, sw( texture( samplerText, uv ), 'w' ) );
        subAssign( d, mul( 0.01, text ) );
      } );
    } );

    retFn( vec4( d, text, 0, 0 ) );
  } );

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
      sw( resolution, 'y' ),
    ) );

    const { ro, rd } = setupRoRd( { inversePVM, p } );

    const { isect, rp } = raymarch( {
      iter: 80,
      ro,
      rd,
      map,
      initRl: length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ),
      marchMultiplier: 0.5,
    } );

    ifThen( gt( sw( isect, 'x' ), 1E-2 ), () => discard() );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      retFn();

    }

    assign( shouldUseNoise, glslTrue );
    assign( isect, map( rp ) );
    const text = sw( isect, 'y' );

    const N = def( 'vec3', calcNormal( { rp, map } ) );
    const noise = mul( 0.2, smoothstep( -1.0, 1.0, sw( cyclicNoise( mul( 4.0, rp ) ), 'x' ) ) );
    const roughness = mix(
      add( 0.6, noise ),
      0.2,
      text,
    );
    const baseColor = mix(
      vec3( 0.16, 0.15, 0.14 ),
      vec3( 0.02, 0.03, 0.04 ),
      text,
    );

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( roughness, 0.0, 0.0, 0.0 ) );

  } );
} );
