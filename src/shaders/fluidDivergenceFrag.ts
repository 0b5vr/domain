import { add, assign, build, def, defConst, defInNamed, defOut, defUniformNamed, div, gt, ifThen, insert, lt, main, neg, sub, sw, vec2, vec4 } from '../shader-builder/shaderBuilder';
import { defFluidClampToGrid } from './modules/defFluidClampToGrid';
import { defFluidSampleNearest3D } from './modules/defFluidSampleNearest3D';
import { defFluidUvToPos } from './modules/defFluidUvToPos';

export const fluidDivergenceFrag = (
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

    const v = def( 'vec3', sw( sampleNearest3D( samplerVelocity, pos ), 'xyz' ) );
    const nx = def( 'float', sw( sampleNearest3D( samplerVelocity, clampToGrid( sub( pos, sw( d, 'yxx' ) ) ) ), 'x' ) );
    const px = def( 'float', sw( sampleNearest3D( samplerVelocity, clampToGrid( add( pos, sw( d, 'yxx' ) ) ) ), 'x' ) );
    const ny = def( 'float', sw( sampleNearest3D( samplerVelocity, clampToGrid( sub( pos, sw( d, 'xyx' ) ) ) ), 'y' ) );
    const py = def( 'float', sw( sampleNearest3D( samplerVelocity, clampToGrid( add( pos, sw( d, 'xyx' ) ) ) ), 'y' ) );
    const nz = def( 'float', sw( sampleNearest3D( samplerVelocity, clampToGrid( sub( pos, sw( d, 'xxy' ) ) ) ), 'z' ) );
    const pz = def( 'float', sw( sampleNearest3D( samplerVelocity, clampToGrid( add( pos, sw( d, 'xxy' ) ) ) ), 'z' ) );

    const maxBound = sub( 0.5, div( 1.0, fGridReso ) );
    const minBound = neg( maxBound );

    ifThen( lt( sw( pos, 'x' ), minBound ), () => assign( nx, neg( sw( v, 'x' ) ) ) );
    ifThen( gt( sw( pos, 'x' ), maxBound ), () => assign( px, neg( sw( v, 'x' ) ) ) );
    ifThen( lt( sw( pos, 'y' ), minBound ), () => assign( ny, neg( sw( v, 'y' ) ) ) );
    ifThen( gt( sw( pos, 'y' ), maxBound ), () => assign( py, neg( sw( v, 'y' ) ) ) );
    ifThen( lt( sw( pos, 'z' ), minBound ), () => assign( nz, neg( sw( v, 'z' ) ) ) );
    ifThen( gt( sw( pos, 'z' ), maxBound ), () => assign( pz, neg( sw( v, 'z' ) ) ) );

    const divergence = div( add( px, neg( nx ), py, neg( ny ), pz, neg( nz ) ), 3.0 );
    assign( fragColor, vec4( divergence, 0.0, 0.0, 1.0 ) );
  } );
} );
