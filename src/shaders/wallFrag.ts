import { MTL_PBR_EMISSIVE3_ROUGHNESS } from './deferredShadeFrag';
import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, glFragCoord, glFragDepth, gt, ifThen, insert, length, main, mix, mul, normalize, retFn, sub, subAssign, sw, texture, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { raymarch } from './modules/raymarch';
import { setupRoRd } from './modules/setupRoRd';

export const wallFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );

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
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );
  const samplerTexture = defUniformNamed( 'sampler2D', 'samplerTexture' );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const uv = def( 'vec2', add( 0.5, mul( 0.5, sw( p, 'xy' ) ) ) );
    const d = def( 'float', sw( p, 'z' ) );
    const tex = texture( samplerTexture, uv );
    subAssign( d, mul( 0.001, sw( tex, 'x' ) ) );

    retFn( vec4( d, sw( tex, 'yzw' ) ) );
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
      return;

    }

    const N = def( 'vec3', calcNormal( { rp, map, delta: 1E-3 } ) );

    const dirt = sw( isect, 'w' );

    const roughness = mix(
      def( 'float', add( sw( isect, 'y' ), mul( 0.3, sw( isect, 'z' ) ) ) ),
      0.7,
      dirt
    );
    const baseColor = def( 'vec3', vec3( mix( 0.4, 0.3, roughness ) ) );
    addAssign( baseColor, mul( vec3( 0.0, -0.01, -0.02 ), sw( isect, 'z' ) ) );
    assign( baseColor, mix( baseColor, vec3( 0.2 ), dirt ) );

    const emissive = def( 'vec3', vec3( 0.0 ) );
    // const phase = mul( 20.0, sw( rp, 'y' ) );
    // addAssign( emissive, step( 0.99, sin( phase ) ) );

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_EMISSIVE3_ROUGHNESS ) );
    assign( fragMisc, vec4( emissive, roughness ) );
    return;
  } );
} );
