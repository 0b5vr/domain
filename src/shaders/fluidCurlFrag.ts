import { add, assign, build, def, defConst, defInNamed, defOut, defUniformNamed, insert, main, neg, sub, sw, vec2, vec4 } from '../shader-builder/shaderBuilder';
import { defFluidClampToGrid } from './modules/defFluidClampToGrid';
import { defFluidSampleNearest3D } from './modules/defFluidSampleNearest3D';
import { defFluidUvToPos } from './modules/defFluidUvToPos';

export const fluidCurlFrag = (
  fGridResoSqrt: number,
  fGridReso: number,
): string => build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const samplerVelocity = defUniformNamed( 'sampler2D', 'samplerVelocity' );

  const clampToGrid = defFluidClampToGrid( fGridReso );
  const uvToPos = defFluidUvToPos( fGridResoSqrt, fGridReso );
  const sampleNearest3D = defFluidSampleNearest3D( fGridResoSqrt, fGridReso );

  const d = defConst( 'vec2', vec2( 0.0, 1.0 / fGridReso ) );

  main( () => {
    const pos = def( 'vec3', uvToPos( vUv ) );

    const nx = def( 'vec4', sampleNearest3D( samplerVelocity, clampToGrid( sub( pos, sw( d, 'yxx' ) ) ) ) );
    const px = def( 'vec4', sampleNearest3D( samplerVelocity, clampToGrid( add( pos, sw( d, 'yxx' ) ) ) ) );
    const ny = def( 'vec4', sampleNearest3D( samplerVelocity, clampToGrid( sub( pos, sw( d, 'xyx' ) ) ) ) );
    const py = def( 'vec4', sampleNearest3D( samplerVelocity, clampToGrid( add( pos, sw( d, 'xyx' ) ) ) ) );
    const nz = def( 'vec4', sampleNearest3D( samplerVelocity, clampToGrid( sub( pos, sw( d, 'xxy' ) ) ) ) );
    const pz = def( 'vec4', sampleNearest3D( samplerVelocity, clampToGrid( add( pos, sw( d, 'xxy' ) ) ) ) );

    assign( fragColor, vec4(
      add( sw( nz, 'y' ), sw( py, 'z' ), neg( sw( pz, 'y' ) ), neg( sw( ny, 'z' ) ) ),
      add( sw( nx, 'z' ), sw( pz, 'x' ), neg( sw( px, 'z' ) ), neg( sw( nz, 'x' ) ) ),
      add( sw( ny, 'x' ), sw( px, 'y' ), neg( sw( py, 'x' ) ), neg( sw( nx, 'y' ) ) ),
      1.0
    ) );
  } );
} );
