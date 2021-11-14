import { GLSLExpression, GLSLFloatExpression, add, addAssign, arrayIndex, assign, build, clamp, def, defConstArray, defFn, defInNamed, defOutNamed, defUniformNamed, div, exp, floor, fract, ifThen, int, lt, main, max, mix, mod, mul, neg, num, pow, retFn, sin, sq, sub, sw, texture, unrollLoop, vec2, vec3 } from '../shader-builder/shaderBuilder';
import { TAU } from '../utils/constants';
import { glslLofi } from './modules/glslLofi';
import { glslSaturate } from './modules/glslSaturate';
import { pcg3df } from './modules/pcg3df';

const SAMPLES = 16;
const INV_SAMPLES = 1.0 / SAMPLES;

export const musicVert = build( () => {
  const off = defInNamed( 'float', 'off' );

  const outL = defOutNamed( 'float', 'outL' );
  const outR = defOutNamed( 'float', 'outR' );

  const _deltaSample = defUniformNamed( 'float', '_deltaSample' );
  const _timeHead = defUniformNamed( 'vec4', '_timeHead' );
  const timeLength = defUniformNamed( 'vec4', 'timeLength' );
  const samplerSamples = defUniformNamed( 'sampler2D', 'samplerSamples' );

  const n2r = ( n: GLSLFloatExpression ): GLSLFloatExpression => (
    pow( 2.0, div( add( n, 2.0 ), 12.0 ) )
  );

  const n2f = ( n: GLSLFloatExpression ): GLSLFloatExpression => (
    mul( n2r( n ), 440.0 )
  );

  const zcross = defFn( 'float', [ 'float', 'float' ], ( t, l ) => {
    retFn(
      glslSaturate( mul(
        sub( 1.0, exp( mul( -999.0, t ) ) ),
        l ? sub( 1.0, exp( mul( 999.0, sub( t, l ) ) ) ) : 1.0,
      ) )
    );
  } );

  const snesloop = (
    time: GLSLExpression<'float'>,
    start: GLSLFloatExpression,
    length: GLSLFloatExpression,
  ): GLSLExpression<'float'> => {
    return sub( time, glslLofi( max( sub( time, start ), 0.0 ), length ) );
  };

  const sample = defFn( 'float', [ 'float', 'float' ], ( slot, time ) => {
    ifThen( lt( time, 0.0 ), () => retFn( 0.0 ) );

    retFn(
      sw( texture( samplerSamples, vec2( time, mul( add( slot, 0.5 ), INV_SAMPLES ) ) ), 'x' )
    );
  } );

  const hihat = (
    t: GLSLFloatExpression,
    decay: GLSLFloatExpression,
  ): GLSLExpression<'vec2'> => mul(
    exp( mul( decay, t ) ),
    sub( fract( mul( sin( mul( add( t, vec2( 0.0, 2.0 ) ), 4444.141 ) ), 15.56 ) ), 0.5 ),
  );

  const mainAudio = ( time: GLSLExpression<'vec4'> ): GLSLExpression<'vec2'> => {
    const dest = def( 'vec2', vec2( 0.0 ) );

    const chords = defConstArray( 'float', [
      -4, 3, 10, 12, 14, 15, 19,
      -5, 2, 7, 9, 12, 14, 17,
    ] );

    const beatLength = def( 'float', sw( timeLength, 'x' ) );
    const timeX = sw( time, 'x' );
    const timeY = sw( time, 'y' );
    const timeZ = sw( time, 'z' );
    // const beatY = div( timeY, beatLength );
    const beatZ = div( timeZ, beatLength );
    // const phaseY = div( timeY, sw( timeLength, 'y' ) );
    const phaseZ = div( timeZ, sw( timeLength, 'z' ) );

    // breaks
    {
      const len = mul( beatLength, 0.5 );
      const t = mod( timeY, len );

      const pattern = defConstArray( 'float', [
        0, 0, 1, 2, 3, 0, 2, 3,
        0, 1, 3, 0, 2, 3, 2, 1,
      ] );

      const index = int( mod( mul( beatZ, 2 ), 16 ) );
      const wave = sample( arrayIndex( pattern, index ), div( t, len ) );
      const satwave = clamp( mul( 2.0, wave ), -1.0, 1.0 );
      const amp = mul( 0.3, zcross( t, len ) );
      addAssign( dest, mul( amp, satwave ) );
    }

    // hihat
    {
      const len = mul( beatLength, 0.25 );
      const t = mod( timeX, len );

      const cell = glslLofi( timeZ, len );
      const dice = def( 'vec3', pcg3df( mul( 1E5, add( cell, vec3( 4.0, 5.0, 6.0 ) ) ) ) );

      const decay = mix( -40.0, -20.0, sq( sw( dice, 'y' ) ) );
      const wave = hihat( t, decay );
      const amp = mul( 0.2, zcross( t, len ) );
      addAssign( dest, mul( amp, wave ) );
    }

    // fm perc
    {
      const len = mul( beatLength, 0.25 );
      const t = mod( timeX, len );

      const cell = glslLofi( timeZ, len );
      const dice = def( 'vec3', pcg3df( mul( 2E5, add( cell, vec3( 4.0, 5.0, 6.0 ) ) ) ) );

      const freq = mix( 200.0, 1000.0, sq( sq( sw( dice, 'x' ) ) ) );
      const decay = mix( 50.0, 10.0, sq( sw( dice, 'y' ) ) );
      const fmamp = mix( 50.0, 100.0, sq( sw( dice, 'x' ) ) );

      const pan = mix(
        vec2( 1.0 ),
        sin( add( mul( 18.0, cell ), vec2( 0.0, 3.0 ) ) ),
        0.2,
      );
      const wave = sin( mul(
        fmamp,
        sin( mul( freq, exp( neg( t ) ) ) ),
        exp( mul( -1.0, decay, t ) ),
      ) );
      const amp = mul( 0.08, zcross( t, len ) );
      addAssign( dest, mul( pan, amp, wave ) );
    }

    // choir
    {
      const len = mul( beatLength, 16.0 );
      const t = mod( timeZ, len );

      unrollLoop( 7, ( i ) => {
        const index = int( add( i, mul( floor( mod( mul( phaseZ, 4 ), 2 ) ), 7 ) ) );
        const rate = n2r( arrayIndex( chords, index ) );
        const wave = vec2(
          sample( num( 10.0 ), snesloop( mul( rate, 0.497, t ), 0.22, 0.53 ) ),
          sample( num( 10.0 ), snesloop( mul( rate, 0.503, t ), 0.22, 0.53 ) ),
        );
        const amp = mul( 0.1, zcross( t, len ) );
        addAssign( dest, mul( amp, wave ) );
      } );
    }

    // mulAssign( dest, 0.0 );
    // sinearp
    {
      const len = mul( beatLength, 0.5 );
      const t = mod( timeY, len );

      const arps = defConstArray( 'float', [
        0, -5, 3, -2, 0, 12, 0, 7,
        -5, 3, -2, 12, -5, 7, 3, -2,
      ] );

      unrollLoop( 3, ( i ) => {
        const index = mod( sub( mul( beatZ, 2 ), i ), 16 );
        const freq = n2f( arrayIndex( arps, int( index ) ) );
        const freq2 = n2f( add( arrayIndex( arps, int( index ) ), -5 ) );
        const pan = div( vec2(
          sub( 2.0, mod( index, 2.0 ) ),
          add( 1.0, mod( index, 2.0 ) ),
        ), 2.0 );
        const wave = sin( mul( TAU, freq, 2.0, timeY ) );
        const wave2 = sin( mul( TAU, freq2, 2.0, timeY ) );
        const amp = mul( 0.05, exp( -i ), zcross( t, len ) );
        addAssign( dest, mul( pan, amp, wave ) );
        addAssign( dest, mul( neg( pan ), amp, wave2 ) );
      } );
    }

    return dest;
  };

  main( () => {
    const out2 = def( 'vec2', (
      mainAudio( mod( add( _timeHead, mul( off, _deltaSample ) ), timeLength ) )
    ) );
    assign( outL, sw( out2, 'x' ) );
    assign( outR, sw( out2, 'y' ) );
  } );
} );
