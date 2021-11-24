import { FAR } from '../config';
import { GLSLExpression, GLSLToken, abs, add, addAssign, assign, build, def, defFn, defOut, defUniformNamed, discard, div, divAssign, eq, floor, forBreak, forLoop, glFragCoord, glFragDepth, gt, ifThen, insert, length, lt, main, max, min, mul, neg, normalize, not, or, retFn, sign, smoothstep, step, sub, sw, tern, ternChain, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { MTL_PBR_EMISSIVE3_ROUGHNESS, MTL_PBR_ROUGHNESS_METALLIC } from './deferredShadeFrag';
import { calcDepth } from './modules/calcDepth';
import { cyclicNoise } from './modules/cyclicNoise';
import { glslLofi } from './modules/glslLofi';
import { pcg3df } from './modules/pcg3df';
import { setupRoRd } from './modules/setupRoRd';

export const octreeFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

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

  const tbox = defFn( 'vec4', [ 'vec3', 'vec3', 'vec3' ], ( ro, rd, s ) => {
    const src = neg( div( ro, rd ) );
    const dst = abs( div( s, rd ) );
    const f = def( 'vec3', sub( src, dst ) );
    const b = def( 'vec3', add( src, dst ) );
    const fl = def( 'float', max( sw( f, 'x' ), max( sw( f, 'y' ), sw( f, 'z' ) ) ) );
    const bl = min( sw( b, 'x' ), min( sw( b, 'y' ), sw( b, 'z' ) ) );
    ifThen( or( lt( bl, fl ), lt( fl, 0.0 ) ), () => retFn( vec4( FAR ) ) );
    const n = mul(
      neg( sign( rd ) ),
      step( sw( f, 'yzx' ), f ),
      step( sw( f, 'zxy' ), f ),
    );
    retFn( vec4( n, fl ) );
  } );

  const isHole = defFn( 'bool', [ 'vec3' ], ( p ) => {
    ifThen( or(
      gt( abs( sw( p, 'x' ) ), 0.5 ),
      gt( abs( sw( p, 'y' ) ), 0.5 ),
      gt( abs( sw( p, 'z' ) ), 0.5 ),
    ), () => {
      retFn( true );
    } );

    retFn( false );
  } );

  const qt = ( ro: GLSLExpression<'vec3'>, rd: GLSLExpression<'vec3'> ): {
    cell: GLSLToken<'vec3'>,
    dice: GLSLToken<'vec3'>,
    len: GLSLToken<'float'>,
    size: GLSLToken<'float'>,
    hole: GLSLToken<'bool'>,
  } => {
    const size = def( 'float', 1.0 );
    const cell = def( 'vec3' );
    const dice = def( 'vec3' );
    const hole = def( 'bool', false );

    forLoop( 4, () => {
      divAssign( size, 2.0 );
      assign( cell, add( glslLofi( add( ro, mul( rd, 0.01, size ) ), size ), div( size, 2.0 ) ) );
      assign( dice, pcg3df( add( 1E3, mul( 1E2, cell ), mul( time, 1E1 ) ) ) );
      assign( hole, or( isHole( cell ), lt( sw( dice, 'y' ), 0.4 ) ) );
      ifThen( hole, () => forBreak() );
      ifThen( gt( sw( dice, 'x' ), mul( size, 1.5 ) ), () => forBreak() );
    } );

    const src = neg( div( sub( ro, cell ), rd ) );
    const dst = abs( div( size, 2.0, rd ) );
    const b = add( src, dst );
    const len = def( 'float', min( sw( b, 'x' ), min( sw( b, 'y' ), sw( b, 'z' ) ) ) );

    return { size, cell, len, dice, hole };
  };

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
      sw( resolution, 'y' ),
    ) );

    const { ro, rd } = setupRoRd( { inversePVM, p } );
    const rp = def( 'vec3', ro );
    const dice = def( 'vec3' );
    const N = def( 'vec3', vec3( 0.0 ) );

    forLoop( 100, () => {
      const qtr = qt( rp, rd );

      const isect = def( 'vec4', vec4( FAR ) );
      const isectlen = sw( isect, 'w' );

      ifThen( not( qtr.hole ), () => {
        const size = sub( mul( 0.5, qtr.size ), 0.01 );
        assign( isect, tbox( sub( rp, qtr.cell ), rd, vec3( size ) ) );
      } );

      ifThen( lt( isectlen, FAR ), () => {
        addAssign( rp, mul( rd, isectlen ) );
        addAssign( dice, qtr.dice );
        addAssign( N, sw( isect, 'xyz' ) );
        forBreak();
      } );

      addAssign( rp, mul( rd, qtr.len ) );
    } );

    // const isect = def( 'vec4', vec4( FAR ) );
    // assign( isect, tbox( ro, rd, vec3( 0.1 ) ) );
    // addAssign( rp, mul( rd, sw( isect, 'w' ) ) );
    // addAssign( N, sw( isect, 'xyz' ) );

    ifThen( eq( N, vec3( 0.0 ) ), () => {
      discard();
      retFn();
    } );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      retFn();

    }

    const mtl = floor( mul( 3.0, sw( dice, 'z' ) ) );

    const noise = smoothstep( -1.0, 1.0, sw( cyclicNoise( mul( 4.0, add( rp, dice ) ) ), 'x' ) );
    const noise2 = smoothstep( -1.0, 1.0, sw( cyclicNoise( mul( 10.0, add( rp, dice ) ) ), 'x' ) );
    const roughness = ternChain(
      add( 0.6, mul( 0.1, noise ) ),
      [ eq( mtl, 1.0 ), add( 0.5, mul( 0.1, noise ) ) ],
      [ eq( mtl, 2.0 ), add( 0.3, mul( 0.1, noise2 ) ) ],
    );
    const metallic = tern( eq( mtl, 1.0 ), 1.0, 0.0 );
    const baseColor = ternChain(
      vec3( 0.8 ),
      [ eq( mtl, 1.0 ), vec3( 0.15, 0.2, 0.25 ) ],
      [ eq( mtl, 2.0 ), vec3( 0.6, 0.07, 0.07 ) ],
    );

    const mtlKind = tern(
      eq( mtl, 3.0 ),
      MTL_PBR_EMISSIVE3_ROUGHNESS,
      MTL_PBR_ROUGHNESS_METALLIC,
    );

    const mtlParams = vec4( roughness, metallic, 0.0, 0.0 );

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), mtlKind ) );
    assign( fragMisc, mtlParams );

  } );
} );
