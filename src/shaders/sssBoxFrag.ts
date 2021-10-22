import { DIELECTRIC_SPECULAR, INV_PI, ONE_SUB_DIELECTRIC_SPECULAR } from '../utils/constants';
import { MTL_PRESHADED_PUNCTUALS } from './deferredShadeFrag';
import { add, addAssign, arrayIndex, assign, build, def, defFn, defInNamed, defOut, defUniformArrayNamed, defUniformNamed, discard, div, divAssign, dot, forBreak, forLoop, glFragCoord, glFragDepth, gt, gte, ifThen, insert, length, main, max, mix, mul, neg, normalize, retFn, sq, sub, subAssign, sw, tern, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { calcSS } from './modules/calcSS';
import { cyclicNoise } from './modules/cyclicNoise';
import { dGGX } from './modules/dGGX';
import { fresnelSchlick } from './modules/fresnelSchlick';
import { glslDefRandom } from './modules/glslDefRandom';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';
import { vGGX } from './modules/vGGX';
import { voronoi3d } from './modules/voronoi3d';

export const sssBoxFrag = ( tag: 'forward' | 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const modelMatrixT3 = defUniformNamed( 'mat3', 'modelMatrixT3' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = tag === 'deferred' ? defOut( 'vec4', 1 ) : null;
  const fragNormal = tag === 'deferred' ? defOut( 'vec4', 2 ) : null;
  const fragMisc = tag === 'deferred' ? defOut( 'vec4', 3 ) : null;

  const lightCount = defUniformNamed( 'int', 'lightCount' );
  const lightPos = defUniformArrayNamed( 'vec3', 'lightPos', 8 );
  const lightColor = defUniformArrayNamed( 'vec3', 'lightColor', 8 );
  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const { init } = glslDefRandom();

  const shouldCalcVoronoi = def( 'bool', false );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    // const d = def( 'float', sub( length( p ), 0.1 ) );
    const noise = cyclicNoise( add( mul( p, 5.0 ), time ), {
      freq: 1.3,
    } );
    addAssign( p, mul( 0.1, noise ) );
    const d = def( 'float', sdbox( p, vec3( 0.33 ) ) );
    subAssign( d, 0.07 );

    const voro = def( 'float', tern(
      shouldCalcVoronoi,
      sw( voronoi3d( mul( 40.0, add( p, 80.0 ) ) ), 'w' ),
      0.0,
    ) );
    addAssign( d, mul( 0.001, voro ) );

    retFn( vec4( d, voro, 0, 0 ) );
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

    //  calc voronoi for finalizing map and normals
    assign( shouldCalcVoronoi, true );
    assign( isect, map( rp ) );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    const V = def( 'vec3', neg( rd ) );
    const N = def( 'vec3', calcNormal( { rp, map } ) );
    const roughness = 0.1;
    const metallic = 0.0;
    const baseColor = mul( 0.5, vec3( 0.9, 0.7, 0.4 ) );
    const subsurfaceColor = mul( 0.5, vec3( 0.7, 0.04, 0.04 ) );

    // don't calc voronoi for ss
    assign( shouldCalcVoronoi, false );

    if ( tag === 'forward' || tag === 'deferred' ) {
      const col = def( 'vec3', vec3( 0.0 ) );

      const albedo = def( 'vec3', mix(
        mul( baseColor, ONE_SUB_DIELECTRIC_SPECULAR ),
        vec3( 0.0 ),
        metallic,
      ) );
      assign( albedo, mix(
        albedo,
        vec3( 0.0 ),
        mul( 0.1, sw( isect, 'y' ) )
      ) );
      const f0 = mix( DIELECTRIC_SPECULAR, baseColor, metallic );
      const f90 = vec3( 1.0 );

      // for each lights
      forLoop( 8, ( iLight ) => {
        ifThen( gte( iLight, lightCount ), () => { forBreak(); } );

        const lp = mul( modelMatrixT3, arrayIndex( lightPos, iLight ) );
        const L = def( 'vec3', sub( lp, rp ) );
        const lenL = def( 'float', length( L ) );
        divAssign( L, max( 1E-3, lenL ) );

        const H = def( 'vec3', normalize( add( L, V ) ) );

        const dotNL = def( 'float', max( dot( N, L ), 0.0 ) );
        const dotNV = def( 'float', max( dot( N, V ), 0.0 ) );
        const dotNH = def( 'float', max( dot( N, H ), 0.0 ) );
        const dotVH = def( 'float', max( dot( V, H ), 0.0 ) );

        const roughnessSq = mul( roughness, roughness );

        const lightCol = arrayIndex( lightColor, iLight );
        const lightDecay = div( 1.0, sq( lenL ) );
        const irradiance = def( 'vec3', mul( lightCol, dotNL, lightDecay ) );

        const FSpec = fresnelSchlick( dotVH, f0, f90 );
        const Vis = vGGX( dotNL, dotNV, roughnessSq );
        const D = dGGX( dotNH, roughnessSq );

        const ss = def( 'vec3', mul(
          lightCol,
          lightDecay,
          subsurfaceColor,
          calcSS( { rp, V, L, N, map, intensity: 2.0 } ),
          INV_PI,
        ) );

        const diffuse = mul( albedo, INV_PI );
        const specular = vec3( mul( Vis, D ) );

        addAssign( col, mix(
          add( ss, mul( irradiance, diffuse ) ),
          mul( irradiance, specular ),
          FSpec,
        ) );
      } );

      assign( fragColor, vec4( col, 1.0 ) );

      if ( tag === 'deferred' ) {
        assign( fragPosition!, vec4( sw( modelPos, 'xyz' ), depth ) );
        assign( fragNormal!, vec4( normalize( mul( normalMatrix, N ) ), MTL_PRESHADED_PUNCTUALS ) );
        assign( fragMisc!, vec4( vec3( 0.0 ), roughness ) );
      }

    } else if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );

    }
  } );
} );
