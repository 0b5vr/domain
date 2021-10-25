import { add, assign, build, def, defInNamed, defOut, defUniformNamed, div, insert, main, mul, sub, sw } from '../shader-builder/shaderBuilder';
import { defFluidClampToGrid } from './modules/defFluidClampToGrid';
import { defFluidSampleLinear3D } from './modules/defFluidSampleLinear3D';
import { defFluidSampleNearest3D } from './modules/defFluidSampleNearest3D';
import { defFluidUvToPos } from './modules/defFluidUvToPos';

export const fluidAdvectionFrag = (
  fGridResoSqrt: number,
  fGridReso: number,
): string => build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const deltaTime = defUniformNamed( 'float', 'deltaTime' );
  const dissipation = defUniformNamed( 'float', 'dissipation' );
  const samplerVelocity = defUniformNamed( 'sampler2D', 'samplerVelocity' );
  const samplerSource = defUniformNamed( 'sampler2D', 'samplerSource' );

  const clampToGrid = defFluidClampToGrid( fGridReso );
  const uvToPos = defFluidUvToPos( fGridResoSqrt, fGridReso );
  const sampleNearest3D = defFluidSampleNearest3D( fGridResoSqrt, fGridReso );
  const sampleLinear3D = defFluidSampleLinear3D( fGridResoSqrt, fGridReso );

  main( () => {
    const pos = def( 'vec3', uvToPos( vUv ) );

    const vel = sw( sampleNearest3D( samplerVelocity, pos ), 'xyz' );
    const samplePos = clampToGrid( sub( pos, mul( deltaTime, vel ) ) );
    const result = sampleLinear3D( samplerSource, samplePos );

    const decay = add( 1.0, mul( deltaTime, dissipation ) );

    assign( fragColor, div( result, decay ) );
  } );
} );
