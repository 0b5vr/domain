import { MTL_PBR_EMISSIVE3_ROUGHNESS, MTL_PBR_ROUGHNESS_METALLIC } from './deferredShadeFrag';
import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, divAssign, eq, glFragCoord, glFragDepth, glslFalse, glslTrue, gt, ifThen, insert, length, lt, main, max, min, mod, mul, mulAssign, neg, normalize, retFn, sin, smoothstep, step, sub, subAssign, sw, tern, ternChain, unrollLoop, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { cyclicNoise } from './modules/cyclicNoise';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { sdbox2 } from './modules/sdbox2';
import { setupRoRd } from './modules/setupRoRd';
import { simplex3d } from './modules/simplex3d';

export const parkingSpaceFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
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
  const full = defUniformNamed( 'float', 'full' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );

  const shouldUseNoise = def( 'bool', glslFalse );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const d = def( 'float', sdbox( p, vec3( 0.48 ) ) );
    subAssign( d, 0.02 );

    ifThen( shouldUseNoise, () => {
      const noise = simplex3d( mul( 50.0, p ) );
      addAssign( d, mul( 0.0003, noise ) );
    } );

    const mtl = def( 'float', 0.0 );
    const lamp = def( 'float', 0.0 );

    const dBlackFrame = def( 'float', sdbox(
      sub( p, vec3( 0.0, 0.0, 0.5 ) ),
      vec3( 0.43, 0.43, 0.0 )
    ) );
    subAssign( dBlackFrame, 0.005 );
    assign( d, max( d, neg( dBlackFrame ) ) );
    ( tag !== 'depth' ) && assign( mtl, tern( lt( dBlackFrame, 0.0 ), 1.0, mtl ) );

    const dInside = def( 'float', sdbox(
      sub( p, vec3( 0.0, 0.0, 0.5 ) ),
      vec3( 0.35, 0.35, 0.05 )
    ) );
    subAssign( dInside, 0.01 );
    assign( d, max( d, neg( dInside ) ) );
    ( tag !== 'depth' ) && assign( mtl, tern( lt( dInside, 0.0 ), 2.0, mtl ) );

    unrollLoop( 2, ( i ) => {
      const pDot = def( 'vec3', sub( p, vec3( 0.0, 0.008 - 0.016 * i, 0.45 ) ) );
      assign( sw( pDot, 'xy' ), sub( mod( sw( pDot, 'xy' ), 0.04 ), 0.02 ) );
      const dDot = def( 'float', max(
        sub( length( pDot ), 0.008 ),
        sdbox( p, vec3( 0.32, 0.32, 1.0 ) ),
      ) );
      assign( d, min( d, dDot ) );

      const hitDot = lt( dDot, 1E-3 );

      if ( tag !== 'depth' ) {
        assign( mtl, tern( hitDot, 3.0, mtl ) );

        const pxy = def( 'vec2', sw( p, 'xy' ) );
        divAssign( pxy, 0.04 );
        const pxya = def( 'vec2', pxy );
        assign( sw( pxya, 'x' ), abs( sw( pxya, 'x' ) ) );

        const s = def( 'float', 1.0 );
        if ( i === 0 ) {
          [
            [ 0.0, 6.0, 1.0, 2.0 ],
            [ 0.0, 5.0, 8.0, 1.0 ],
            [ 7.0, 3.0, 1.0, 1.0 ],
            [ 2.0, 1.5, 1.0, 1.5 ],
            [ 4.0, 0.0, 2.0, 1.0 ],
            [ 0.0, -3.0, 6.0, 1.0 ],
            [ 0.0, -5.0, 1.0, 1.0 ],
            [ 0.0, -7.0, 8.0, 1.0 ],
          ].map( ( [ x, y, w, h ] ) => (
            assign( s, min( s, sdbox2( sub( pxya, vec2( x, y ) ), vec2( w, h ) ) ) )
          ) );
          assign( lamp, tern( hitDot, step( s, 0.0 ), lamp ) );
        } else {
          [
            [ -6.5, 7.0, 0.5, 1.0 ],
            [ -5.5, 6.0, 0.5, 1.0 ],
            [ -4.5, 5.5, 0.5, 0.5 ],
            [ -7.5, 3.0, 0.5, 1.0 ],
            [ -6.5, 2.0, 0.5, 1.0 ],
            [ -5.5, 1.5, 0.5, 0.5 ],
            [ -7.5, -6.5, 0.5, 1.5 ],
            [ -6.5, -5.0, 0.5, 2.0 ],
            [ -5.5, -3.5, 0.5, 1.5 ],
            [ 2.0, 5.5, 5.0, 0.5 ],
            [ -1.0, 5.0, 1.0, 3.0 ],
            [ 4.0, 5.0, 1.0, 3.0 ],
            [ 2.0, 1.5, 6.0, 0.5 ],
            [ 6.5, 2.0, 0.5, 1.0 ],
            [ -3.0, -4.0, 1.0, 4.0 ],
            [ 1.5, -0.5, 5.5, 0.5 ],
            [ 6.0, -4.0, 1.0, 4.0 ],
            [ 5.0, -8.0, 1.0, 1.0 ],
            [ 1.5, -2.0, 0.5, 4.0 ],
            [ -0.5, -4.5, 0.5, 1.5 ],
            [ 1.5, -5.5, 2.5, 0.5 ],
            [ 3.5, -4.5, 0.5, 1.5 ],
          ].map( ( [ x, y, w, h ] ) => (
            assign( s, min( s, sdbox2( sub( pxy, vec2( x, y ) ), vec2( w, h ) ) ) )
          ) );
          assign( lamp, tern( hitDot, neg( step( s, 0.0 ) ), lamp ) );
        }
      }
    } );

    retFn( vec4( d, mtl, lamp, 0 ) );
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
    const mtl = sw( isect, 'y' );
    const lamp = sw( isect, 'z' );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      retFn();

    }

    assign( shouldUseNoise, glslTrue );

    const N = def( 'vec3', calcNormal( { rp, map } ) );
    const noise = mul( 0.1, smoothstep( -1.0, 1.0, sw( cyclicNoise( mul( 4.0, rp ) ), 'x' ) ) );
    const noise2 = mul( 0.1, smoothstep( -1.0, 1.0, sw( cyclicNoise( mul( 20.0, rp ) ), 'x' ) ) );
    const roughness = ternChain(
      add( 0.7, noise ),
      [ eq( mtl, 1.0 ), add( 0.1, noise2 ) ],
      [ eq( mtl, 2.0 ), 0.6 ],
    );
    const metallic = tern( eq( mtl, 1.0 ), 0.0, 1.0 );
    const baseColor = vec3( tern( eq( mtl, 0.0 ), 0.8, 0.04 ) );

    const emissive = def( 'vec3', add(
      mul( step( full, 0.5 ), step( 0.0, lamp ), lamp, vec3( 0.0, 5.0, 1.0 ) ),
      mul( step( 0.5, full ), step( lamp, 0.0 ), lamp, vec3( -5.0, -1.0, -0.0 ) ),
    ) );
    const flickerPhase = add( mul( time, 100.0 ), mul( sw( rp, 'y' ), 10.0 ) );
    mulAssign( emissive, add( 0.7, mul( 0.3, sin( flickerPhase ) ) ) );

    const mtlKind = tern(
      eq( mtl, 3.0 ),
      MTL_PBR_EMISSIVE3_ROUGHNESS,
      MTL_PBR_ROUGHNESS_METALLIC,
    );

    const mtlParams = tern(
      eq( mtl, 3.0 ),
      vec4( emissive, 0.3 ),
      vec4( roughness, metallic, 0.0, 0.0 ),
    );

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), mtlKind ) );
    assign( fragMisc, mtlParams );

  } );
} );
