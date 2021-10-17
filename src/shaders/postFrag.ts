import { GLSLExpression, abs, add, addAssign, assign, build, def, defFn, defOutNamed, defUniform, div, dot, float, glFragCoord, gt, ifThen, insert, length, log2, main, max, min, mix, mul, mulAssign, normalize, pow, retFn, sqrt, step, sub, swizzle, tan, texture, unrollLoop, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { PI } from '../utils/constants';
import { glslDefRandom } from './modules/glslDefRandom';
import { glslLofi } from './modules/glslLofi';
import { glslSaturate } from './modules/glslSaturate';

const BARREL_ITER = 10;
const BARREL_OFFSET = 0.05;
const BARREL_AMP = 0.05;

const LUMA = vec3( 0.2126, 0.7152, 0.0722 );

export const postFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const mosaicAmp = defUniform( 'float', 'mosaicAmp' );
  const mixInvert = defUniform( 'float', 'mixInvert' );
  const colorLift = defUniform( 'vec4', 'colorLift' );
  const colorGamma = defUniform( 'vec4', 'colorGamma' );
  const colorGain = defUniform( 'vec4', 'colorGain' );
  const resolution = defUniform( 'vec2', 'resolution' );
  const sampler0 = defUniform( 'sampler2D', 'sampler0' );
  const samplerRandom = defUniform( 'sampler2D', 'samplerRandom' );

  const { init, random } = glslDefRandom();

  const barrel = defFn( 'vec3', [ 'float', 'vec2' ], ( amp, uv ) => {
    const corn = def( 'float', length( vec2( 0.5 ) ) );
    const a = def( 'float', min( mul( 3.0, sqrt( amp ) ), mul( corn, PI ) ) );
    const zoom = def( 'float', div( corn, add( tan( mul( corn, a ) ), corn ) ) );
    const uvt = sub( uv, 0.5 );
    const p = glslSaturate( add(
      mul( add( uv, mul( normalize( uvt ), tan( mul( length( uvt ), a ) ) ) ), zoom ),
      mul( 0.5, sub( 1.0, zoom ) )
    ) ) as GLSLExpression<'vec2'>;
    retFn( swizzle( texture( sampler0, p ), 'xyz' ) );
  } );

  const liftGammaGain = defFn(
    'vec3',
    [ 'vec3', 'vec4', 'vec4', 'vec4' ],
    ( rgb, lift, gamma, gain ) => {
      const liftt = def( 'vec4', (
        sub( 1.0, pow( sub( 1.0, lift ), log2( add( gain, 1.0 ) ) ) )
      ) );

      const gammat = def( 'vec4', (
        sub( gamma, vec4( 0.0, 0.0, 0.0, dot( vec4( LUMA, 0.0 ), gamma ) ) )
      ) );
      const gammatTemp = add( 1.0, mul( 4.0, abs( gammat ) ) );
      assign( gammat, mix( gammatTemp, div( 1.0, gammatTemp ), step( 0.0, gammat ) ) );

      const col = def( 'vec3', rgb );
      const luma = def( 'float', dot( LUMA, col ) );

      assign( col, pow( col, swizzle( gammat, 'rgb' ) ) );
      mulAssign( col, pow( swizzle( gain, 'rgb' ), swizzle( gammat, 'rgb' ) ) );
      assign(
        col,
        max( mix( mul( 2.0, swizzle( liftt, 'rgb' ) ), vec3( 1.0 ), col ), 0.0 )
      );

      assign( luma, pow( luma, swizzle( gammat, 'a' ) ) );
      mulAssign( luma, pow( swizzle( gain, 'a' ), swizzle( gammat, 'a' ) ) );
      assign( luma, max( mix( mul( 2.0, swizzle( liftt, 'a' ) ), 1.0, luma ), 0.0 ) );

      addAssign( col, sub( luma, dot( LUMA, col ) ) );

      retFn( glslSaturate( col ) );
    }
  );

  function aces( x: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> {
    return glslSaturate( div(
      mul( x, add( mul( 0.45, x ), 0.02 ) ),
      add( mul( x, add( mul( 0.45, x ), 0.07 ) ), 0.2 )
    ) ) as GLSLExpression<'vec3'>;
  }

  function sRGBOETL( x: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> {
    const x_ = def( 'vec3', glslSaturate( x ) as GLSLExpression<'vec3'> );
    return mix(
      mul( x_, 12.92 ),
      sub( mul( pow( x_, vec3( 0.4167 ) ), 1.055 ), 0.055 ),
      step( 0.0031308, x_ )
    );
  }

  main( () => {
    const uv = def( 'vec2', div( swizzle( glFragCoord, 'xy' ), resolution ) );

    init( texture( samplerRandom, uv ) );

    const mosaic = mul( mosaicAmp, swizzle( resolution, 'y' ) );
    ifThen( gt( mosaic, 1.0 ), () => {
      assign( uv, add(
        glslLofi( sub( uv, 0.5 ), div( mosaic, resolution ) ) as GLSLExpression<'vec2'>,
        mul( mosaic, div( 0.5, resolution ) ),
        0.5
      ) );
    } );

    const aspect = div( swizzle( resolution, 'x' ), swizzle( resolution, 'y' ) );
    const p = def( 'vec2', sub( mul( uv, 2.0 ), 1.0 ) );
    mulAssign( swizzle( p, 'x' ), aspect );

    const vig = sub( 1.0, mul( 0.2, length( p ) ) );

    const tex = def( 'vec3', vec3( 0.0 ) );

    unrollLoop( BARREL_ITER, ( i ) => {
      const phase = div( add( float( i ), 0.5 ), BARREL_ITER );
      const a = mul(
        glslSaturate( sub( 1.0, mul( 3.0, abs( sub( div( vec3( 1.0, 3.0, 5.0 ), 6.0 ), phase ) ) ) ) ) as GLSLExpression<'vec3'>,
        4.0 / BARREL_ITER
      );
      const barrelAmp = add( BARREL_OFFSET, mul( BARREL_AMP, phase ) );
      addAssign( tex, mul( a, barrel( barrelAmp, uv ) ) );
    } );

    assign( tex, mix( vec3( 0.0 ), tex, vig ) );

    const col = def( 'vec3', tex );
    assign( col, div( aces( max( mul( 2.0, col ), 0.0 ) ), aces( vec3( 11.2 ) ) ) );
    addAssign( col, mul( 0.002, sRGBOETL( vec3( random() ) ) ) );
    assign( col, glslSaturate( col ) as GLSLExpression<'vec3'> );
    assign( col, sRGBOETL( col ) );
    assign( col, mix( col, sub( 1.0, col ), mixInvert ) );
    assign( col, liftGammaGain( col, colorLift, colorGamma, colorGain ) );

    assign( fragColor, vec4( col, 1.0 ) );
  } );
} );
