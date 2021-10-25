import { GLSLExpression, add, addAssign, assign, build, def, defConst, defFn, defInNamed, defOut, defUniformNamed, div, insert, length, main, mul, mulAssign, neg, retFn, sub, sw, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { defFluidClampToGrid } from './modules/defFluidClampToGrid';
import { defFluidSampleNearest3D } from './modules/defFluidSampleNearest3D';
import { defFluidUvToPos } from './modules/defFluidUvToPos';

export const fluidResolvePressureFrag = (
  fGridResoSqrt: number,
  fGridReso: number,
): string => build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const deltaTime = defUniformNamed( 'float', 'deltaTime' );
  const curl = defUniformNamed( 'float', 'curl' );
  const samplerCurl = defUniformNamed( 'sampler2D', 'samplerCurl' );
  const samplerVelocity = defUniformNamed( 'sampler2D', 'samplerVelocity' );
  const samplerPressure = defUniformNamed( 'sampler2D', 'samplerPressure' );

  const clampToGrid = defFluidClampToGrid( fGridReso );
  const uvToPos = defFluidUvToPos( fGridResoSqrt, fGridReso );
  const sampleNearest3D = defFluidSampleNearest3D( fGridResoSqrt, fGridReso );

  const d = defConst( 'vec2', vec2( 0.0, 1.0 / fGridReso ) );

  const safeNormalize = defFn( 'vec2', [ 'vec2' ], ( v ) => {
    retFn( div( v, add( length( v ), 1E-4 ) ) );
  } );

  const resolveVorticity = ( pos: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> => {
    const v = sampleNearest3D( samplerCurl, pos );
    const nx = sampleNearest3D( samplerCurl, clampToGrid( sub( pos, sw( d, 'yxx' ) ) ) );
    const px = sampleNearest3D( samplerCurl, clampToGrid( add( pos, sw( d, 'yxx' ) ) ) );
    const dx = def( 'vec4', sub( px, nx ) );
    const ny = sampleNearest3D( samplerCurl, clampToGrid( sub( pos, sw( d, 'xyx' ) ) ) );
    const py = sampleNearest3D( samplerCurl, clampToGrid( add( pos, sw( d, 'xyx' ) ) ) );
    const dy = def( 'vec4', sub( py, ny ) );
    const nz = sampleNearest3D( samplerCurl, clampToGrid( sub( pos, sw( d, 'xxy' ) ) ) );
    const pz = sampleNearest3D( samplerCurl, clampToGrid( add( pos, sw( d, 'xxy' ) ) ) );
    const dz = def( 'vec4', sub( pz, nz ) );

    const force = def( 'vec3', vec3( 0.0 ) );
    addAssign( sw( force, 'xy' ), safeNormalize(
      mul( 0.25, vec2( sw( dy, 'z' ), neg( sw( dx, 'z' ) ) ) )
    ) );
    addAssign( sw( force, 'yz' ), safeNormalize(
      mul( 0.25, vec2( sw( dz, 'x' ), neg( sw( dy, 'x' ) ) ) )
    ) );
    addAssign( sw( force, 'zx' ), safeNormalize(
      mul( 0.25, vec2( sw( dx, 'y' ), neg( sw( dz, 'y' ) ) ) )
    ) );
    mulAssign( force, mul( curl, sw( v, 'xyz' ) ) );

    return mul( deltaTime, force );
  };

  const resolvePressure = ( pos: GLSLExpression<'vec3'> ): GLSLExpression<'vec3'> => {
    const n = vec3(
      sw( sampleNearest3D( samplerPressure, clampToGrid( sub( pos, sw( d, 'yxx' ) ) ) ), 'x' ),
      sw( sampleNearest3D( samplerPressure, clampToGrid( sub( pos, sw( d, 'xyx' ) ) ) ), 'x' ),
      sw( sampleNearest3D( samplerPressure, clampToGrid( sub( pos, sw( d, 'xxy' ) ) ) ), 'x' )
    );
    const p = vec3(
      sw( sampleNearest3D( samplerPressure, clampToGrid( add( pos, sw( d, 'yxx' ) ) ) ), 'x' ),
      sw( sampleNearest3D( samplerPressure, clampToGrid( add( pos, sw( d, 'xyx' ) ) ) ), 'x' ),
      sw( sampleNearest3D( samplerPressure, clampToGrid( add( pos, sw( d, 'xxy' ) ) ) ), 'x' )
    );

    return sub( n, p );
  };

  main( () => {
    const pos = def( 'vec3', uvToPos( vUv ) );

    const v = def( 'vec3', sw( sampleNearest3D( samplerVelocity, pos ), 'xyz' ) );

    addAssign( v, resolveVorticity( pos ) );
    addAssign( v, resolvePressure( pos ) );

    assign( fragColor, vec4( v, 1.0 ) );
  } );
} );
