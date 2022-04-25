import { DIELECTRIC_SPECULAR, INV_PI } from '../utils/constants';
import { MTL_PBR_EMISSIVE3_ROUGHNESS } from './deferredConstants';
import { abs, add, addAssign, assign, atan, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, dot, glFragCoord, glFragDepth, gt, ifThen, insert, length, main, max, mul, mulAssign, neg, normalize, num, retFn, sin, sq, sub, subAssign, sw, texture, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcL } from './modules/calcL';
import { calcNormal } from './modules/calcNormal';
import { calcSS } from './modules/calcSS';
import { forEachLights } from './modules/forEachLights';
import { fresnelSchlick } from './modules/fresnelSchlick';
import { glslDefRandom } from './modules/glslDefRandom';
import { raymarch } from './modules/raymarch';
import { rotate2D } from './modules/rotate2D';
import { setupRoRd } from './modules/setupRoRd';

export const sp4ghetFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const modelMatrixT3 = defUniformNamed( 'mat3', 'modelMatrixT3' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const { init } = glslDefRandom();

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    mulAssign( sw( p, 'yz' ), rotate2D( num( 0.7 ) ) );
    mulAssign( sw( p, 'xy' ), rotate2D( num( 0.7 ) ) );

    // hello sp4ghet
    const cy = def( 'vec2', vec2( sw( p, 'y' ), length( sw( p, 'xz' ) ) ) );
    const phi = atan( sw( p, 'z' ), sw( p, 'x' ) );
    subAssign( sw( cy, 'y' ), 0.4 );
    mulAssign( cy, rotate2D( mul( 4.0, phi ) ) );
    assign( sw( cy, 'x' ), sub(
      abs( add( sw( cy, 'x' ), mul( 0.05, sin( add( time, phi ) ) ) ) ),
      0.05,
    ) );
    const d = sub( length( cy ), 0.03 );

    retFn( vec4( d, 0, 0, 0 ) );
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

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    const V = def( 'vec3', neg( rd ) );
    const N = def( 'vec3', calcNormal( { rp, map } ) );
    const baseColor = def( 'vec3', mul( 0.5, vec3( 0.2, 0.7, 0.6 ) ) );
    const subsurfaceColor = mul( 0.5, vec3( 0.2, 0.2, 0.6 ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      retFn();

    }

    const ssAccum = def( 'vec3', vec3( 0.0 ) );

    const f0 = DIELECTRIC_SPECULAR;
    const f90 = vec3( 1.0 );

    forEachLights( ( { lightPos, lightColor } ) => {
      const [ L ] = calcL(
        mul( modelMatrixT3, lightPos ),
        rp,
      );

      const [ _L, lenL ] = calcL(
        lightPos,
        sw( mul( modelMatrix, vec4( rp, 1.0 ) ), 'xyz' ),
      );
      const lightDecay = div( 1.0, sq( lenL ) );

      const H = def( 'vec3', normalize( add( L, V ) ) );
      const dotVH = def( 'float', max( dot( V, H ), 0.0 ) );
      const FSpec = fresnelSchlick( dotVH, f0, f90 );

      addAssign( ssAccum, mul(
        lightColor,
        lightDecay,
        subsurfaceColor,
        calcSS( { rp, V, L, N, map, lenMultiplier: 0.003, intensity: 2.0 } ),
        INV_PI,
        sub( 1.0, FSpec ),
      ) );
    } );

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4(
      normalize( mul( normalMatrix, N ) ),
      MTL_PBR_EMISSIVE3_ROUGHNESS,
    ) );
    assign( fragMisc, vec4( ssAccum, 0.5 ) );

  } );
} );
