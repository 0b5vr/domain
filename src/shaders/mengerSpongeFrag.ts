import { INV_PI } from '../utils/constants';
import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOutNamed, defUniform, discard, div, dot, glFragCoord, glFragDepth, gt, ifThen, insert, length, main, max, mod, mul, neg, normalize, retFn, sin, step, sub, swizzle, texture, unrollLoop, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { brdfGGX } from './modules/brdfGGX';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { glslDefRandom } from './modules/glslDefRandom';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';
import { sortVec3Components } from './modules/sortVec3Components';

export const mengerSpongeFrag = ( tag: 'forward' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniform( 'mat4', 'pvm' );
  const modelMatrix = defUniform( 'mat4', 'modelMatrix' );
  const modelMatrixT3 = defUniform( 'mat3', 'modelMatrixT3' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const time = defUniform( 'float', 'time' );
  const resolution = defUniform( 'vec2', 'resolution' );
  const cameraNearFar = defUniform( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniform( 'vec3', 'cameraPos' );
  const inversePVM = defUniform( 'mat4', 'inversePVM' );
  const samplerRandom = defUniform( 'sampler2D', 'samplerRandom' );

  const { init } = glslDefRandom();

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    // const d = def( 'float', sub( length( p ), 0.1 ) );
    const d = def( 'float', sdbox( p, vec3( 0.5 ) ) );

    let scale = 1.0;
    unrollLoop( 4, () => {
      const pt = def( 'vec3', abs( sub( mod( add( p, scale / 2.0 ), scale ), scale / 2.0 ) ) );
      assign( pt, sortVec3Components( pt ) );
      assign( d, max( d, neg( sdbox( pt, vec3( scale / 6.0, scale / 6.0, 9 ) ) ) ) );
      scale /= 3.0;
    } );

    retFn( vec4( d, step( 0.0, sin( dot( vec4( p, time ), vec4( 10.0 ) ) ) ), 0, 0 ) );
  } );

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, swizzle( glFragCoord, 'xy' ) ), resolution ),
      swizzle( resolution, 'y' ),
    ) );
    init( texture( samplerRandom, p ) );

    const { ro, rd } = setupRoRd( { inversePVM, p } );

    const { isect, rp } = raymarch( {
      iter: 80,
      ro,
      rd,
      map,
      initRl: length( sub( swizzle( vPositionWithoutModel, 'xyz' ), ro ) ),
      marchMultiplier: 0.6,
    } );

    const col = def( 'vec3', vec3( 0.0 ) );

    ifThen( gt( swizzle( isect, 'x' ), 1E-2 ), () => discard() );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( swizzle( projPos, 'z' ), swizzle( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'forward' ) {
      const L = def( 'vec3', mul( modelMatrixT3, normalize( vec3( 1, 1, 1 ) ) ) );
      const V = def( 'vec3', neg( rd ) );
      const N = def( 'vec3', calcNormal( { rp, map } ) );

      const baseColor = vec3( 0.5, 0.6, 0.7 );
      const lightGain = vec3( 1.0 );
      const dotNL = def( 'float', max( dot( L, N ), 0.0 ) );
      const irradiance = def( 'vec3', mul( lightGain, dotNL ) );

      const diffuse = mul( irradiance, baseColor, INV_PI );
      addAssign( col, diffuse );

      const specular = mul( irradiance, brdfGGX( L, V, N, baseColor, 0.7, 0.9 ) );
      addAssign( col, specular );

      assign( fragColor, vec4( col, 1.0 ) );
    } else if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, swizzle( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
    }
  } );
} );
