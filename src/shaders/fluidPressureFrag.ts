import { add, addAssign, assign, build, def, defConst, defInNamed, defOut, defUniformNamed, div, exp, fract, insert, length, main, mul, neg, sin, smoothstep, sub, sw, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { defFluidClampToGrid } from './modules/defFluidClampToGrid';
import { defFluidSampleNearest3D } from './modules/defFluidSampleNearest3D';
import { defFluidUvToPos } from './modules/defFluidUvToPos';

export const fluidPressureFrag = (
  fGridResoSqrt: number,
  fGridReso: number,
): string => build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const time = defUniformNamed( 'float', 'time' );
  const samplerDivergence = defUniformNamed( 'sampler2D', 'samplerDivergence' );
  const samplerPressure = defUniformNamed( 'sampler2D', 'samplerPressure' );

  const clampToGrid = defFluidClampToGrid( fGridReso );
  const uvToPos = defFluidUvToPos( fGridResoSqrt, fGridReso );
  const sampleNearest3D = defFluidSampleNearest3D( fGridResoSqrt, fGridReso );

  const d = defConst( 'vec2', vec2( 0.0, 1.0 / fGridReso ) );

  main( () => {
    const pos = def( 'vec3', uvToPos( vUv ) );

    const divergence = sw( sampleNearest3D( samplerDivergence, pos ), 'x' );
    const pressure = def( 'float', (
      div( add(
        sw( sampleNearest3D( samplerPressure, clampToGrid( add( pos, sw( d, 'yxx' ) ) ) ), 'x' ),
        sw( sampleNearest3D( samplerPressure, clampToGrid( sub( pos, sw( d, 'yxx' ) ) ) ), 'x' ),
        sw( sampleNearest3D( samplerPressure, clampToGrid( add( pos, sw( d, 'xyx' ) ) ) ), 'x' ),
        sw( sampleNearest3D( samplerPressure, clampToGrid( sub( pos, sw( d, 'xyx' ) ) ) ), 'x' ),
        sw( sampleNearest3D( samplerPressure, clampToGrid( add( pos, sw( d, 'xxy' ) ) ) ), 'x' ),
        sw( sampleNearest3D( samplerPressure, clampToGrid( sub( pos, sw( d, 'xxy' ) ) ) ), 'x' ),
        neg( divergence )
      ), 6.0 )
    ) );

    const l = def( 'float', (
      length( add( pos, mul( 0.4, sin( mul( time, vec3( 3, 4, 5 ) ) ) ) ) )
    ) );
    addAssign( pressure, mul(
      50.0,
      exp( mul( -20.0, fract( time ) ) ),
      smoothstep( 0.05, 0.0, l )
    ) );

    assign( fragColor, vec4( pressure, 0.0, 0.0, 1.0 ) );
  } );
} );
