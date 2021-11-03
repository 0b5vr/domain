import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, forBreak, forLoop, glFragCoord, glFrontFacing, gt, ifThen, insert, length, lt, main, mix, mul, mulAssign, normalize, num, or, retFn, smoothstep, sq, sub, sw, tern, texture, vec4 } from '../shader-builder/shaderBuilder';
import { doShadowMapping } from './modules/doShadowMapping';
import { glslDefRandom } from './modules/glslDefRandom';

const MARCH_ITER = 20;
const INV_MARCH_ITER = 1.0 / MARCH_ITER;

export const lightShaftFrag = build( () => {
  insert( 'precision highp float;' );

  const vFrustumZ = defInNamed( 'float', 'vFrustumZ' );
  const vPosition = defInNamed( 'vec4', 'vPosition' );

  const fragColor = defOut( 'vec4' );

  const intensity = defUniformNamed( 'float', 'intensity' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const lightNearFar = defUniformNamed( 'vec2', 'lightNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const lightPos = defUniformNamed( 'vec3', 'lightPos' );
  const lightColor = defUniformNamed( 'vec3', 'lightColor' );
  const lightParams = defUniformNamed( 'vec4', 'lightParams' );
  const lightPV = defUniformNamed( 'mat4', 'lightPV' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const samplerShadow = defUniformNamed( 'sampler2D', 'samplerShadow' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );
  const samplerDeferred1 = defUniformNamed( 'sampler2D', 'samplerDeferred1' );

  const { random, init } = glslDefRandom();

  const cameraDepth = def( 'float' );

  const map = defFn( 'float', [ 'vec3' ], ( p ) => {
    const lenL = def( 'float', length( sub( p, lightPos ) ) );
    const tooNear = smoothstep( 0.0, 0.1, lenL );

    const lightProj = def( 'vec4', mul( lightPV, vec4( p, 1.0 ) ) );
    const lightP = def( 'vec3', div( sw( lightProj, 'xyz' ), sw( lightProj, 'w' ) ) );

    ifThen( or( lt( sw( lightP, 'z' ), 0.0 ), lt( 1.0, sw( lightP, 'z' ) ) ), () => (
      retFn( num( 0.0 ) ) )
    );

    const shadow = doShadowMapping(
      texture( samplerShadow, add( 0.5, mul( 0.5, sw( lightP, 'xy' ) ) ) ),
      lenL,
      num( 1.0 ),
      lightP,
      lightNearFar,
      sw( lightParams, 'x' ),
    );

    const invSqLenL = div( 1.0, sq( lenL ) );
    retFn( mul( tooNear, shadow, invSqLenL ) );
  } );

  main( () => {
    ifThen( gt( vFrustumZ, 0.99 ), () => {
      discard();
      retFn();
    } );

    const uv = def( 'vec2', div( sw( glFragCoord, 'xy' ), resolution ) );
    const p = def( 'vec2', sub( mul( uv, 2.0 ), 1.0 ) );
    mulAssign( sw( p, 'x' ), div( sw( resolution, 'x' ), sw( resolution, 'y' ) ) );
    init( texture( samplerRandom, p ) );

    const texDeferred1 = texture( samplerDeferred1, uv );
    assign( cameraDepth, sub( mul( 2.0, sw( texDeferred1, 'w' ) ), 1.0 ) );

    const rayOri = def( 'vec3', cameraPos );
    const v = sub( sw( vPosition, 'xyz' ), rayOri );
    const rayDir = def( 'vec3', normalize( v ) );
    const rayLen = def( 'float', tern( glFrontFacing, 1E-2, length( v ) ) );
    const rayPos = def( 'vec3', add( rayOri, mul( rayDir, rayLen ) ) );

    // this is terrible
    // There definitely are better ways to do this
    const stepLen = tern( glFrontFacing, 1.0, 0.1 );

    const accum = def( 'float', 0.0 );
    const isect = def( 'float' );

    forLoop( MARCH_ITER, () => {
      assign( isect, map( rayPos ) );
      addAssign( accum, mul( isect, INV_MARCH_ITER ) );
      addAssign( rayLen, mul( stepLen, mix( 0.5, 1.0, random() ) ) );
      assign( rayPos, add( rayOri, mul( rayDir, rayLen ) ) );

      // kill me
      const pt = mul( projectionMatrix, viewMatrix, vec4( rayPos, 1.0 ) );
      const depth = div( sw( pt, 'z' ), sw( pt, 'w' ) );
      ifThen( gt( depth, cameraDepth ), () => forBreak() );
    } );

    assign( fragColor, vec4( mul( intensity, lightColor, accum ), 1.0 ) );
    // assign( fragColor, vec4( sw( rayPos, 'xyz' ), 1.0 ) );
  } );
} );
