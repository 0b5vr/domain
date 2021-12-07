import { GLSLExpression, GLSLFloatExpression, add, addAssign, and, arrayIndex, assign, build, clamp, def, defConstArray, defFn, defInNamed, defOutNamed, defUniformNamed, div, eq, exp, floor, fract, gt, gte, ifThen, int, lt, main, max, mix, mod, mul, mulAssign, neg, not, num, or, pow, retFn, sin, smoothstep, sq, step, sub, sw, tern, texture, unrollLoop, vec2, vec3 } from '../shader-builder/shaderBuilder';
import { TAU } from '../utils/constants';
import { glslLofi } from './modules/glslLofi';
import { glslSaturate } from './modules/glslSaturate';
import { glslTri } from './modules/glslTri';
import { pcg3df } from './modules/pcg3df';

const SAMPLES = 16;
const INV_SAMPLES = 1.0 / SAMPLES;

export const musicVert = build( () => {
  const off = defInNamed( 'float', 'off' );

  const outL = defOutNamed( 'float', 'outL' );
  const outR = defOutNamed( 'float', 'outR' );

  const _deltaSample = defUniformNamed( 'float', '_deltaSample' );
  const _sectionHead = defUniformNamed( 'float', '_sectionHead' );
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

  const rimshot = (
    t: GLSLFloatExpression,
  ): GLSLExpression<'vec2'> => {
    const attack = mul( 0.6, exp( mul( -400.0, t ) ) );
    const wave = add(
      glslTri( sub( mul( 450.0, vec2( 1.005, 0.995 ), t ), attack ) ),
      glslTri( sub( mul( 1800.0, vec2( 0.995, 1.005 ), t ), attack ) ),
    );
    return clamp( mul( 4.0, wave, exp( mul( -400.0, t ) ) ), -1.0, 1.0 );
  };

  // const rim = (
  //   t: GLSLFloatExpression,
  // ): GLSLExpression<'vec2'> => mul(
  //   exp( mul( decay, t ) ),
  //   sub( fract( mul( sin( mul( add( t, vec2( 0.0, 2.0 ) ), 4444.141 ) ), 15.56 ) ), 0.5 ),
  // );

  const crash = (
    t: GLSLFloatExpression,
  ): GLSLExpression<'vec2'> => {
    const tt = def( 'vec2', add( t, mul(
      0.01,
      sin( add( mul( 0.5, exp( mul( vec2( -40.0, -30.0 ), t ) ) ), 3.0 ) ),
    ) ) );
    assign( tt, glslLofi( mul( 0.8, tt ), 0.00004 ) );
    const fmamp = mul( -3.4, exp( mul( -1.0, tt ) ) );
    const fm = mul( fmamp, sin( mul( vec2( 10855.0, 10865.0 ), tt ) ) );
    const amp = exp( mul( -3.0, tt ) );
    const wave = def( 'vec2', vec2( sin( add( fm, mul( vec2( 14892.0, 14890.0 ), tt ) ) ) ) );
    assign( wave, mix( vec2( -1.0 ), vec2( 1.0 ), fract( add( mul( 2.0, wave ), 0.5 ) ) ) );

    return mul( amp, wave );
  };

  const snesChoir = ( t: GLSLExpression<'float'> ): GLSLExpression<'float'> => (
    sample( num( 5.0 ), snesloop( t, 0.22, 0.53 ) )
  );

  // const wavetable = (
  //   phase: GLSLExpression<'float'>,
  //   radius: GLSLFloatExpression,
  //   off: GLSLExpression<'vec2'>,
  // ): GLSLExpression<'vec2'> => {
  //   const tauphase = def( 'float', mul( TAU, phase ) );
  //   return sw( texture(
  //     samplerRandom,
  //     add( off, mul( radius, vec2( cos( tauphase ), sin( tauphase ) ) ) )
  //   ), 'xy' );
  // };

  const mainAudio = (
    time: GLSLExpression<'vec4'>,
    sectionIndex: GLSLExpression<'float'>,
  ): GLSLExpression<'vec2'> => {
    const dest = def( 'vec2', vec2( 0.0 ) );

    const chords = defConstArray( 'float', [
      -4, 3, 10, 12, 14, 15, 19,
      -5, 2, 7, 9, 12, 14, 17,
    ] );

    const beatLength = def( 'float', sw( timeLength, 'x' ) );
    const timeX = sw( time, 'x' );
    const timeY = sw( time, 'y' );
    const timeZ = sw( time, 'z' );
    const timeW = sw( time, 'w' );
    const barPhase = div( timeY, sw( timeLength, 'y' ) );
    const sectionPhase = div( timeZ, sw( timeLength, 'z' ) );
    // const beatY = div( timeY, beatLength );
    const beatZ = div( timeZ, beatLength );
    const beatW = div( timeW, beatLength );
    // const phaseY = div( timeY, sw( timeLength, 'y' ) );

    const chordHead = mul(
      floor( mod( mul( sectionPhase, 4 ), 2 ) ),
      7,
    );

    const woah = and(
      gte( sectionPhase, 0.9375 ),
      or(
        eq( sectionIndex, 4.0 ),
        eq( sectionIndex, 5.0 ),
      ),
    );

    // triangle
    ifThen( and(
      lt( sectionIndex, 4.0 ),
    ), () => {
      const len = mul( beatLength, 16.0 );
      const t = mod( timeZ, len );
      const note = mix( -4.0, -5.0, step( 0.5, fract( mul( 2.0, sectionPhase ) ) ) );
      const phase = sub( mul( 0.125, t, n2f( note ) ) );
      const wave = glslTri( phase );
      const amp = mul(
        0.2,
        zcross( t, len ),
        tern( eq( sectionIndex, 3.0 ), smoothstep( 1.0, 0.75, sectionPhase ), 1.0 ),
      );
      addAssign( dest, mul( amp, wave ) );
    } );

    // sub bass
    ifThen( and(
      gte( sectionIndex, 4.0 ),
    ), () => {
      const pattern = defConstArray( 'float', [
        0, 0, 1, 2, 3, 0, 1, 2,
        0, 1, 2, 0, 1, 2, 3, 4,
        0, 0, 1, 2, 3, 0, 1, 2,
        0, 1, 2, 0, 1, 2, 3, 1,
      ] );

      const notes = defConstArray( 'float', [
        0, 0, 0, 0, 0, -2, -2, -2,
        3, 3, 3, 1, 1, 1, 1, 1,
        0, 0, 0, 0, 0, -2, -2, -2,
        3, 3, 3, 1, 1, 1, 1, 7,
      ] );

      const index = int( mod( mul( beatZ, 2 ), 32 ) );
      const note = arrayIndex( notes, index );
      const t = add(
        mul( beatLength, 0.5, arrayIndex( pattern, index ) ),
        mod( timeY, mul( beatLength, 0.5 ) ),
      );
      const phase = sub( mul( 0.1, t, n2f( note ) ), mul( 3.0, exp( mul( -5.0, t ) ) ) );
      const wave = sin( mul( TAU, phase ) );
      const amp = mul( 0.5, exp( mul( -0.5, t ) ), zcross( t, num( 9.0 ) ) );
      addAssign( dest, mul( amp, wave ) );
    } );

    // breaks roll
    ifThen( and(
      or( eq( sectionIndex, 1.0 ), eq( sectionIndex, 3.0 ) ),
      gt( sectionPhase, 0.9375 ),
    ), () => {
      const len = mul( beatLength, tern( gt( barPhase, 0.875 ), 0.125, 0.5 ) );
      const t = mod( timeY, len );

      const wave = sample( num( 1.0 ), div( t, mul( beatLength, 0.5 ) ) );
      const satwave = clamp( mul( 2.0, wave ), -1.0, 1.0 );
      const amp = mul(
        0.3,
        zcross( t, len ),
        smoothstep( 0.9375, 1.0, sectionPhase ),
      );
      addAssign( dest, mul( amp, satwave ) );
    } );

    // breaks
    ifThen( and(
      or(
        eq( sectionIndex, 2.0 ),
        gte( sectionIndex, 4.0 ),
      ),
      lt( sectionIndex, 7.0 ),
    ), () => {
      const len = def( 'float', mul( beatLength, 0.5 ) );
      const cell = floor( div( timeZ, len ) );
      const dice = def( 'vec3', pcg3df( mul( 1E5, add( cell, vec3( 4.0, 5.0, 6.0 ) ) ) ) );

      ifThen( gte( sectionIndex, 4.0 ), () => {
        mulAssign( len, pow( 0.5, floor( mul( 4.0, pow( sw( dice, 'x' ), 10.0 ) ) ) ) );
      } );
      const t = def( 'float', mod( timeX, len ) );

      ifThen( woah, () => {
        assign( t, mix(
          glslLofi( t, 0.004 ),
          t,
          tern(
            eq( sectionIndex, 4.0 ),
            mix( 1.0, 0.5, smoothstep( 0.9375, 1.0, sectionPhase ) ),
            mix( 0.8, 4.0, sq( smoothstep( 0.9375, 1.0, sectionPhase ) ) ),
          ),
        ) );
      } );

      const pattern = defConstArray( 'float', [
        0, 0, 1, 2, 3, 0, 2, 3,
        0, 1, 3, 0, 2, 3, 2, 1,
      ] );

      const index = int( mod( mul( beatZ, 2 ), 16 ) );
      const wave = sample( arrayIndex( pattern, index ), div( t, mul( 0.5, beatLength ) ) );
      const satwave = clamp( mul(
        2.0,
        tern( lt( sectionIndex, 3.0 ), exp( mul( -5.0, t ) ), 1.0 ),
        wave,
      ), -1.0, 1.0 );
      const amp = mul(
        0.3,
        zcross( t, len ),
      );
      addAssign( dest, mul( amp, satwave ) );
    } );

    // hihat
    ifThen( and( gte( sectionIndex, 2.0 ), not( woah ) ), () => {
      const len = def( 'float', mul( beatLength, 0.25 ) );
      const cell = floor( div( timeZ, len ) );
      const dice = def( 'vec3', pcg3df( mul( 1E5, add( cell, vec3( 4.0, 5.0, 6.0 ) ) ) ) );

      ifThen( gte( sectionIndex, 4.0 ), () => {
        mulAssign( len, pow( 0.5, floor( mul( 3.0, pow( sw( dice, 'x' ), 50.0 ) ) ) ) );
      } );
      const t = mod( timeX, len );

      const decay = mix( -80.0, -20.0, sq( sw( dice, 'y' ) ) );
      const wave = hihat( t, decay );
      const amp = mul( 0.2, zcross( t, len ) );
      addAssign( dest, mul( amp, wave ) );
    } );

    // clap
    ifThen( or(
      eq( sectionIndex, 3.0 ),
      eq( sectionIndex, 3.0 ),
    ), () => {
      const t = timeX;
      const wave = sample( num( 4.0 ), glslSaturate( mul( 4.0, t ) ) );
      const amp = mul( 0.5, zcross( t, beatLength ) );
      addAssign( dest, mul( amp, wave ) );
    } );

    // crash
    ifThen( gte( sectionIndex, 2.0 ), () => {
      const t = timeZ;
      const wave = crash( t );
      const amp = mul( 0.15, zcross( t, num( 9.0 ) ) );
      addAssign( dest, mul( amp, wave ) );
    } );

    // fm perc
    ifThen( gte( sectionIndex, 3.0 ), () => {
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
    } );

    // rimshot
    ifThen( and( gte( sectionIndex, 3.0 ), not( woah ) ), () => {
      const t = mod(
        mod(
          mod( timeZ, mul( 2.75, beatLength ) ),
          mul( 1.25, beatLength ),
        ),
        mul( 0.5, beatLength ),
      );

      const wave = rimshot( t );
      const amp = mul( 0.3, zcross( t, num( 9.0 ) ) );
      addAssign( dest, mul( amp, wave ) );
    } );

    // choir
    ifThen( or(
      lt( sectionIndex, 4.0 ),
      gte( sectionIndex, 6.0 ),
    ), () => {
      const len = mul( beatLength, 16.0 );
      const t = mod( timeZ, len );

      unrollLoop( 7, ( i ) => {
        const index = int( add(
          mod( i, 7 ),
          chordHead,
        ) );
        const rate = n2r( arrayIndex( chords, index ) );
        const rateMul = def( 'vec3', pcg3df( mul( 1E5, add( i, vec3( 1, 2, 3 ) ) ) ) );
        assign( rateMul, mix( vec3( 0.5 ), rateMul, 0.002 ) );
        const wave = vec2(
          snesChoir( mul( rate, sw( rateMul, 'x' ), t ) ),
          snesChoir( mul( rate, sw( rateMul, 'y' ), t ) ),
        );
        const amp = mul(
          0.14,
          zcross( t, len ),
          tern( eq( sectionIndex, 3.0 ), smoothstep( 1.0, 0.75, sectionPhase ), 1.0 ),
        );
        addAssign( dest, mul( amp, wave ) );
      } );
    } );

    // sinearp
    ifThen( or(
      lt( sectionIndex, 4.0 ),
      gte( sectionIndex, 5.0 ),
    ), () => {
      const len = mul( beatLength, 0.5 );
      const t = mod( timeY, len );

      const arps = defConstArray( 'float', [
        0, -5, 3, -2, 0, 12, 0, 7,
        -5, 3, -2, 12, -5, 7, 3, -2,
      ] );

      unrollLoop( 3, ( i ) => {
        const index = mod( sub( mul( beatZ, 2 ), i ), 16 );
        const freq = n2f( arrayIndex( arps, int( index ) ) );
        const pan = div( vec2(
          sub( 2.0, mod( index, 2.0 ) ),
          add( 1.0, mod( index, 2.0 ) ),
        ), 2.0 );
        const wave = sin( mul( TAU, freq, 2.0, timeY ) );
        const wave2 = sin( mul( TAU, freq, 1.5, timeY ) );
        const amp = mul(
          0.06,
          exp( -i ),
          zcross( t, len ),
          tern( eq( sectionIndex, 3.0 ), smoothstep( 1.0, 0.75, sectionPhase ), 1.0 ),
        );
        addAssign( dest, mul( pan, amp, wave ) );
        addAssign( dest, mul( neg( pan ), amp, wave2 ) );
      } );
    } );

    // fadein
    mulAssign( dest, smoothstep( 4.0, 36.0, beatW ) );

    // fadeout
    ifThen( eq( sectionIndex, 7.0 ), () => (
      mulAssign( dest, smoothstep( 0.5, 0.0, sectionPhase ) )
    ) );

    // mute
    ifThen( gte( sectionIndex, 8.0 ), () => (
      mulAssign( dest, 0.0 )
    ) );

    return clamp( dest, -1.0, 1.0 );
  };

  main( () => {
    const time = add( _timeHead, mul( off, _deltaSample ) );

    const out2 = def( 'vec2', (
      mainAudio(
        mod( time, timeLength ),
        add( _sectionHead, floor( sw( div( time, timeLength ), 'z' ) ) ),
      )
    ) );

    assign( outL, sw( out2, 'x' ) );
    assign( outR, sw( out2, 'y' ) );
  } );
} );
