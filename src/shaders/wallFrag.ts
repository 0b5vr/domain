import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredShadeFrag';
import { add, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, glFragCoord, glFragDepth, gt, ifThen, insert, length, main, mix, mul, retFn, sub, sw, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { raymarch } from './modules/raymarch';
import { setupRoRd } from './modules/setupRoRd';

export const wallFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const samplerTexture = defUniformNamed( 'sampler2D', 'samplerTexture' );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const uv = def( 'vec2', sw( p, 'xy' ) );
    const d = def( 'float', sw( p, 'z' ) );

    retFn( vec4( d, 0, 0, 0 ) );
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

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );

    }

    const N = def( 'vec3', calcNormal( { rp, map } ) );
    const roughness = 0.5;
    const metallic = 0.0;

    const baseColor = vec3( 0.1 );

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( vNormal, MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 1.0, 0.0, 0.0, 0.0 ) );
    return;
  } );
} );
