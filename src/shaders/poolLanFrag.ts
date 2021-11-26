import { MTL_PBR_EMISSIVE3_ROUGHNESS } from './deferredShadeFrag';
import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, eq, glFragCoord, glFragDepth, glslFalse, glslTrue, gt, ifThen, insert, length, lt, main, max, min, mix, mul, neg, normalize, retFn, sign, sin, smoothstep, sq, step, sub, subAssign, sw, tern, ternChain, texture, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { cyclicNoise } from './modules/cyclicNoise';
import { glslLinearstep } from './modules/glslLinearstep';
import { glslLofi } from './modules/glslLofi';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';
import { simplex4d } from './modules/simplex4d';
import { smax } from './modules/smax';
import { smin } from './modules/smin';

export const poolLanFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
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
  const samplerText = defUniformNamed( 'sampler2D', 'samplerText' );

  const shouldUseNoise = def( 'bool', glslFalse );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const pt = def( 'vec3', p );
    addAssign( sw( pt, 'xy' ), mul(
      sign( sw( pt, 'xy' ) ),
      add(
        mul( -0.1, sw( pt, 'z' ) ),
        mul( -0.3, smin( smax( sw( pt, 'z' ), -0.1, 0.05 ), 0.2, 0.05 ) ),
      ),
    ) );
    const d = def( 'float', sdbox(
      sub( pt, vec3( 0.0, 0.07, 0.0 ) ),
      vec3( 0.37, 0.33, 0.42 ),
    ) );
    subAssign( d, 0.01 );

    const mtl = def( 'float', 0.0 );
    const text = def( 'float', 0.0 );

    assign( d, min(
      d,
      max(
        smin(
          add(
            0.42,
            sw( p, 'y' ),
            mul( length( sw( p, 'zx' ) ), 0.2 ),
          ),
          max(
            sw( p, 'y' ),
            sub( length( sw( p, 'zx' ) ), 0.1 ),
          ),
          0.5,
        ),
        add( -0.5, neg( sw( p, 'y' ) ) )
      ),
    ) );

    ifThen( shouldUseNoise, () => {
      const noise = simplex4d( vec4( mul( add( 2.0, p ), 100.0 ), 1.0 ) );
      addAssign( d, mul( 0.0001, noise ) );

      const uv = glslLinearstep( vec2( -0.25, -0.22 ), vec2( 0.25, -0.32 ), sw( p, 'xy' ) );
      assign( text, sw( texture( samplerText, uv ), 'w' ) );
      addAssign( d, mul( 0.01, text ) );
    } );

    const dBlackFrame = def( 'float', sdbox(
      sub( p, vec3( 0.0, 0.09, 0.42 ) ),
      vec3( 0.4, 0.3, 0.02 )
    ) );
    assign( d, max( d, neg( dBlackFrame ) ) );
    ( tag !== 'depth' ) && assign( mtl, tern( lt( dBlackFrame, 0.0 ), 1.0, mtl ) );

    // const dInside = def( 'float', sdbox(
    //   sub( p, vec3( 0.0, 0.0, 0.5 ) ),
    //   vec3( 0.35, 0.35, 0.05 )
    // ) );
    // subAssign( dInside, 0.01 );
    // assign( d, max( d, neg( dInside ) ) );
    // ( tag !== 'depth' ) && assign( mtl, tern( lt( dInside, 0.0 ), 2.0, mtl ) );

    retFn( vec4( d, mtl, text, 0 ) );
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
      marchMultiplier: 0.5,
    } );

    ifThen( gt( sw( isect, 'x' ), 1E-2 ), () => discard() );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      retFn();

    }

    assign( shouldUseNoise, glslTrue );
    assign( isect, map( rp ) );
    const mtl = sw( isect, 'y' );
    const text = sw( isect, 'z' );

    const N = def( 'vec3', calcNormal( { rp, map } ) );
    const noise = mul( 0.1, smoothstep( -1.0, 1.0, sw( cyclicNoise( mul( 4.0, rp ) ), 'x' ) ) );
    const roughness = ternChain(
      add( 0.6, noise ),
      [ eq( mtl, 1.0 ), 0.1 ],
    );
    const baseColor = tern(
      eq( mtl, 0.0 ),
      mix(
        vec3( 0.7, 0.6, 0.5 ),
        vec3( 0.02 ),
        text
      ),
      vec3( 0.04 ),
    );

    const uv = glslLinearstep( vec2( -0.4, -0.2 ), vec2( 0.4, 0.4 ), sw( rp, 'xy' ) );
    const plasmauv = glslLofi( uv, vec2( 0.04, 0.02 ) );
    const plasma = def( 'float', add( 0.5, mul( 0.5, sin(
      mul( 15.0, simplex4d( vec4( plasmauv, mul( 0.4, time ), 0.0 ) ) )
    ) ) ) );
    const plasmac = add( 0.5, mul( 0.5, sin( add( mul( -3.0, plasma ), 5.0, vec3( 0, 2, 4 ) ) ) ) );

    const flickerPhase = add( mul( time, 100.0 ), mul( sw( rp, 'y' ), 10.0 ) );
    const emissive = mul(
      step( 0.5, mtl ),
      smoothstep( 0.5, 0.45, abs( sub( sw( uv, 'x' ), 0.5 ) ) ),
      smoothstep( 0.5, 0.45, abs( sub( sw( uv, 'y' ), 0.5 ) ) ),
      add( 3.0, mul( 0.5, sin( flickerPhase ) ) ),
      add( 0.5, mul( 0.5, sin( add( mul( 1000.0, sw( uv, 'x' ) ), vec3( 0, 2, 4 ) ) ) ) ),
      sq( plasma ),
      plasmac,
    );

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_EMISSIVE3_ROUGHNESS ) );
    assign( fragMisc, vec4( emissive, roughness ) );

  } );
} );
