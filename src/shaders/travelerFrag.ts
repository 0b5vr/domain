import { MTL_PBR_EMISSIVE3_ROUGHNESS } from './deferredShadeFrag';
import { Swizzle2ComponentsVec3, abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, forLoop, fract, glFragCoord, glFragDepth, glslFalse, glslTrue, gt, ifThen, insert, length, main, max, min, mul, mulAssign, normalize, retFn, sub, sw, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { glslLinearstep } from './modules/glslLinearstep';
import { raymarch } from './modules/raymarch';
import { rotate2D } from './modules/rotate2D';
import { sdbox } from './modules/sdbox';
import { sdbox2 } from './modules/sdbox2';
import { setupRoRd } from './modules/setupRoRd';

export const travelerFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const glow = defUniformNamed( 'float', 'glow' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );

  const shouldCalcNoise = def( 'bool', glslFalse );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const d = def( 'float', sdbox( p, vec3( 0.5 ) ) );

    // Ref: https://www.shadertoy.com/view/4tGBDG
    const coord = mul( 19.36, normalize( p ) );
    const pattern = def( 'float', 0.0 );

    ( [
      'zy',
      'xz',
      'xy',
    ] as Swizzle2ComponentsVec3[] ).map( ( s ) => {
      const q = def( 'vec2', mul( 10.0, sub( fract( div( sw( coord, s ), 10.0 ) ), 0.5 ) ) );
      const d = def( 'float', 1.0 );
      forLoop( 3, () => {
        assign( q, sub( abs( q ), 0.5 ) );
        mulAssign( q, rotate2D( -0.785398 ) ); // it's not HALF_SQRT_TWO, it's a magic number
        assign( q, sub( abs( q ), 0.5 ) );
        assign( d, min( d, sdbox2( q, vec2( 1.0, add( 0.55, sw( q, 'x' ) ) ) ) ) );
      } );
      const f = def( 'float', div( 1.0, add( 1.0, abs( d ) ) ) );
      assign( pattern, max( pattern, f ) );
    } );

    const whoa = glslLinearstep( 0.9, 1.0, pattern );
    addAssign( d, mul( 0.001, whoa ) );

    retFn( vec4( d, glslLinearstep( 0.9, 0.95, pattern ), 0, 0 ) );
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

    //  calc voronoi for finalizing map and normals
    assign( shouldCalcNoise, glslTrue );
    assign( isect, map( rp ) );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    const N = def( 'vec3', calcNormal( { rp, map } ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      retFn();

    }

    const pattern = sw( isect, 'y' );

    assign( fragColor, vec4( 0.1, 0.1, 0.1, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4(
      normalize( mul( normalMatrix, N ) ),
      MTL_PBR_EMISSIVE3_ROUGHNESS,
    ) );
    assign( fragMisc, vec4( mul( vec3( 3.0, 0.4, 0.8 ), glow, pattern ), -0.4 ) );

  } );
} );
