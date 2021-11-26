import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredShadeFrag';
import { abs, add, addAssign, and, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, dot, eq, glFragCoord, glFragDepth, glslFalse, glslTrue, gt, ifThen, insert, length, lt, main, max, mix, mul, mulAssign, normalize, or, retFn, sin, smoothstep, sub, subAssign, sw, ternChain, texture, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { cyclicNoise } from './modules/cyclicNoise';
import { defSimplexFBM4d } from './modules/simplexFBM4d';
import { pcg3df } from './modules/pcg3df';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { sdbox2 } from './modules/sdbox2';
import { setupRoRd } from './modules/setupRoRd';
import { simplex4d } from './modules/simplex4d';

export const cardboardFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
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
  const samplerTexture = defUniformNamed( 'sampler2D', 'samplerTexture' );

  const shouldUseNoise = def( 'bool', glslFalse );

  const fbm = defSimplexFBM4d();

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    addAssign( p, mul( 0.02, cyclicNoise( add( p, 2.0 ), { freq: 1.7, pump: 2.0 } ) ) );

    const d = def( 'float', sdbox( p, vec3( 0.46 ) ) );
    subAssign( d, 0.02 );

    const uv = def( 'vec2', vec2( 0.0 ) );
    const mtl = def( 'float', 0.0 );

    ifThen( shouldUseNoise, () => {
      ifThen( and(
        lt( abs( sw( p, 'z' ) ), 0.1 ),
        gt( abs( sw( p, 'y' ) ), 0.25 ),
      ), () => {
        assign( mtl, 1.0 );
        subAssign( d, 0.001 );
      } );

      ifThen( eq( mtl, 0.0 ), () => {
        const N = normalize( max( sub( abs( p ), vec3( 0.46 ) ), 0.0 ) );

        assign( uv, sw( p, 'xy' ) );

        const wave = dot(
          vec2(
            sin( mul( 400.0, sw( p, 'x' ) ) ),
            sin( mul( 400.0, sw( p, 'z' ) ) ),
          ),
          normalize( vec2(
            sub( 1.0, sw( N, 'x' ) ),
            sw( N, 'x' ),
          ) ),
        );
        addAssign( d, mul( 0.0001, wave ) );

        const pt = add( p, mul( cyclicNoise( mul( p, 3.0 ) ) ) );

        const noise = mul(
          smoothstep( -0.3, 1.0, fbm( vec4( pt, 0.0 ) ) ),
          0.002,
        );
        addAssign( d, noise );
      } );
    } );

    retFn( vec4( d, mtl, uv ) );
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

    const mtl = def( 'float', sw( isect, 'y' ) );
    const uv = sw( isect, 'zw' );

    const N = def( 'vec3', calcNormal( { rp, map } ) );

    ifThen( and(
      eq( mtl, 0.0 ),
      gt( sw( rp, 'z' ), 0.0 ),
      or(
        lt( max(
          sdbox2( sub( uv, vec2( -0.296, -0.25 ) ), vec2( 0.06, 0.1 ) ),
          simplex4d( vec4(
            mul( 50.0, add( sw( uv, 'y' ), sw( pcg3df( vec3( mul( 500.0, time ) ) ), 'x' ) ) )
          ) ),
        ), 0.0 ), // barcode
        gt( (
          sw( texture( samplerTexture, add( 0.5, mul( uv, vec2( 1.0, -1.0 ) ) ) ), 'w' )
        ), 0.5 ), // texture
      )
    ), () => {
      assign( mtl, 2.0 );
    } );

    const dirt = def( 'float', smoothstep(
      -1.0,
      1.0,
      fbm( mul( 2.0, vec4( rp, 4.0 ) ) ),
    ) );
    mulAssign( dirt, mix( 0.3, 0.6, smoothstep( 0.7, 1.0, length( rp ) ) ) );

    const roughness = ternChain(
      add( 0.6, mul( 0.3, dirt ) ),
      [ eq( mtl, 1.0 ), add( 0.1, mul( 0.05, sw( cyclicNoise( mul( 10.0, rp ) ), 'x' ) ) ) ],
      [ eq( mtl, 2.0 ), 0.7 ],
    );
    const baseColor = ternChain(
      mix(
        mul(
          vec3( 0.34, 0.28, 0.18 ),
          mix( 0.8, 1.0, simplex4d( vec4( mul( 120.0, rp ), 1.0 ) ) ),
        ),
        vec3( 0.04, 0.04, 0.04 ),
        dirt,
      ),
      [ eq( mtl, 1.0 ), vec3( 0.7, 0.6, 0.1 ) ],
      [ eq( mtl, 2.0 ), vec3( 0.02 ) ],
    );

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( roughness, 0.0, 0.0, 0.0 ) );

  } );
} );
