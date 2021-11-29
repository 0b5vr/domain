import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredShadeFrag';
import { abs, add, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, floor, forLoop, glFragCoord, glFragDepth, gt, ifThen, insert, length, main, max, min, mix, mul, mulAssign, normalize, retFn, step, sub, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { cyclicNoise } from './modules/cyclicNoise';
import { foldSortXYZ } from './modules/foldSortXYZ';
import { glslDefRandom } from './modules/glslDefRandom';
import { orthBas } from './modules/orthBas';
import { pcg3df } from './modules/pcg3df';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';

export const ifsCubeFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const seed = defUniformNamed( 'float', 'seed' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const { init } = glslDefRandom();

  const ifs = defFn( 'vec3', [ 'vec3', 'vec3', 'vec3' ], ( p, r, s ) => {
    const b = def( 'mat3', orthBas( r ) );

    forLoop( 5, () => {
      assign( p, abs( p ) );
      assign( p, foldSortXYZ( p ) );
      mulAssign( s, b );
      mulAssign( s, 0.58 );
      assign( p, sub( abs( p ), abs( s ) ) );
    } );

    retFn( p );
  } );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const dClip = def( 'float', sdbox( p, vec3( 0.5 ) ) );

    assign( p, ifs(
      p,
      mul( 1.0, pcg3df( mul( vec3( 1E1 ), add( 3.0, floor( seed ) ) ) ) ),
      mul( 0.8, pcg3df( mul( vec3( 1E1 ), add( 1.0, floor( seed ) ) ) ) ),
    ) );

    const d = def( 'float', sdbox( p, vec3( 0.02, 0.03, 0.08 ) ) );
    const d2 = def( 'float', sdbox( sub( p, vec3( 0.0, 0.02, 0.03 ) ), vec3( 0.01, 0.01, 0.06 ) ) );
    const mtl = def( 'float', step( d, d2 ) );
    assign( d, max( dClip, min( d, d2 ) ) );

    retFn( vec4( d, mtl, 0, 0 ) );
  } );

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
      sw( resolution, 'y' ),
    ) );
    init( texture( samplerRandom, p ) );

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

    const mtl = sw( isect, 'y' );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      retFn();

    }

    const N = def( 'vec3', calcNormal( { rp, map } ) );
    const roughness = add(
      0.2,
      mul( 0.1, sw( cyclicNoise( mul( 4.0, rp ) ), 'x' ) ),
    );

    const metallic = mix(
      0.0,
      1.0,
      mtl,
    );

    const baseColor = mix(
      vec3( 0.6, 0.8, 0.04 ),
      vec3( 0.12 ),
      mtl,
    );

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( roughness, metallic, 0.0, 0.0 ) );

  } );
} );
