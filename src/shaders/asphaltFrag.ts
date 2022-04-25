import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredConstants';
import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, dot, glFragCoord, glFragDepth, gt, ifThen, insert, length, main, max, mix, mul, normalize, retFn, sin, smoothstep, sub, subAssign, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { cyclicNoise } from './modules/cyclicNoise';
import { glslDefRandom } from './modules/glslDefRandom';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';
import { triplanarMapping } from './modules/triplanarMapping';

export const asphaltFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
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
  const samplerSurface = defUniformNamed( 'sampler2D', 'samplerSurface' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const { init } = glslDefRandom();

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const phase = add( dot( p, vec3( 10.0 ) ), time );
    const line = def( 'float', smoothstep( 0.1, 0.2, sin( phase ) ) );

    addAssign( p, mul( 0.02, cyclicNoise( p, { pump: mix( 2.0, 4.0, line ) } ) ) );

    const d = def( 'float', sdbox( p, vec3( 0.45 ) ) );
    subAssign( d, 0.05 );

    if ( tag !== 'depth' ) {
      const N = normalize( max( sub( abs( p ), 0.45 ), 0.0 ) );
      const mapSurface = triplanarMapping(
        add( 0.5, mul( p, 0.5 ) ),
        N,
        4.0,
        ( uv ) => texture( samplerSurface, uv ),
      );

      subAssign( d, mix( sw( mapSurface, 'x' ), 0.01, line ) );
      // const voronoiSamplePos = mul( 50.0, add( p, 1.0 ) );
      // const voronoi = voronoi3d( voronoiSamplePos );
      // const border = sw( voronoi3dBorder( voronoiSamplePos, voronoi ), 'w' );
      // subAssign( d, div( border, 100.0 ) );
      // assign( line, smoothstep( 0.2, 0.1, border ) );
    }

    retFn( vec4( d, line, 0, 0 ) );
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
    const line = def( 'float', sw( isect, 'y' ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      retFn();

    }

    const N = def( 'vec3', calcNormal( { rp, map } ) );
    const roughness = mix( 0.5, 0.8, line );
    const metallic = 0.0;

    const baseColor = mix(
      vec3( 0.1 ),
      vec3( 0.8 ),
      line
    );

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( roughness, metallic, 0.0, 0.0 ) );

  } );
} );
