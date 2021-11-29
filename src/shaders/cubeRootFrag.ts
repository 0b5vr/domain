import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredShadeFrag';
import { abs, add, addAssign, assign, build, clamp, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, glFragCoord, glFragDepth, glslFalse, glslTrue, gt, ifThen, insert, length, main, max, min, mix, mul, normalize, retFn, sub, subAssign, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { cyclicNoise } from './modules/cyclicNoise';
import { glslLinearstep } from './modules/glslLinearstep';
import { glslSaturate } from './modules/glslSaturate';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';
import { simplex4d } from './modules/simplex4d';
import { triplanarMapping } from './modules/triplanarMapping';

export const cubeRootFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );
  const samplerSurface = defUniformNamed( 'sampler2D', 'samplerSurface' );

  const shouldUseNoise = def( 'bool', glslFalse );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const d = def( 'float', sub( sdbox( p, vec3( 0.43 ) ), 0.05 ) );

    const tex = def( 'vec4' );

    const N = normalize( max( sub( abs( p ), 0.43 ), 0.0 ) );
    const mapSurface = triplanarMapping(
      mix( vec3( 0.5 ), vec3( 1.5 ), p ),
      N,
      1.0,
      ( uv ) => texture( samplerSurface, uv ),
    );

    subAssign( d, sw( mapSurface, 'x' ) );
    subAssign( d, mul(
      0.01,
      simplex4d( mul( 5.0, vec4( clamp( p, -0.5, 0.5 ), 8.0 ) ) ),
    ) );

    assign( tex, mapSurface );

    ifThen( shouldUseNoise, () => {
      addAssign( p, mul( 0.002, cyclicNoise( add( mul( 20.0, p ), mul( 0.01, time ) ) ) ) );
      const dwater  = sub( sdbox( p, vec3( 0.427 ) ), 0.05 );
      assign( d, min( d, dwater ) );
      assign( sw( tex, 'w' ), glslLinearstep( 0.01, 0.0, dwater ) );
    } );

    retFn( vec4( d, sw( tex, 'yzw' ) ) );
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
      marchMultiplier: 0.6,
    } );

    ifThen( gt( sw( isect, 'x' ), 1E-2 ), () => discard() );

    assign( shouldUseNoise, glslTrue );
    assign( isect, map( rp ) );

    const rootd = sw( isect, 'y' );
    const root = glslLinearstep( 0.005, 0.0, rootd );

    const dirt = sw( isect, 'z' );
    const water = sw( isect, 'w' );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      retFn();

    }

    const N = def( 'vec3', calcNormal( { rp, map, delta: mix( 1E-4, 1E-2, root ) } ) );
    const roughness = mix(
      mix( 0.9, 0.3, root ),
      0.03,
      water,
    );
    const metallic = 0.0;

    const baseColor = mul(
      glslSaturate( mix(
        add(
          vec3( 0.11, 0.04, 0.02 ),
          mul( 0.05, dirt ),
        ),
        add(
          vec3( 0.2, 0.13, 0.1 ),
          mul( 0.1, simplex4d( vec4( mul( 4.0, rp ), mul( 30.0, rootd ) ) ) ),
        ),
        root,
      ) ),
      mix( 1.0, 0.5, water ),
    );

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( roughness, metallic, 0.0, 0.0 ) );

  } );
} );
