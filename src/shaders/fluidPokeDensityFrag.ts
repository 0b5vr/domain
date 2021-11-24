import { add, addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, exp, fract, insert, length, main, mul, mulAssign, sin, smoothstep, sw, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { defFluidSampleNearest3D } from './modules/defFluidSampleNearest3D';
import { defFluidUvToPos } from './modules/defFluidUvToPos';

export const fluidPokeDensityFrag = (
  fGridResoSqrt: number,
  fGridReso: number,
): string => build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const time = defUniformNamed( 'float', 'time' );
  const deltaTime = defUniformNamed( 'float', 'deltaTime' );
  const samplerDensity = defUniformNamed( 'sampler2D', 'samplerDensity' );

  const uvToPos = defFluidUvToPos( fGridResoSqrt, fGridReso );
  const sampleNearest3D = defFluidSampleNearest3D( fGridResoSqrt, fGridReso );

  main( () => {
    const pos = def( 'vec3', uvToPos( vUv ) );

    const density = def( 'vec4', sampleNearest3D( samplerDensity, pos ) );

    const l = def( 'float', (
      length( add( pos, mul( 0.4, sin( mul( time, vec3( 0.7, 1.1, 1.5 ) ) ) ) ) )
    ) );
    const poke = def( 'float', smoothstep( 0.2, 0.0, l ) );
    mulAssign( poke, exp( mul( -5.0, l ) ) );
    addAssign( sw( density, 'x' ), mul( 100.0, deltaTime, poke ) );

    assign( fragColor, density );
  } );
} );
