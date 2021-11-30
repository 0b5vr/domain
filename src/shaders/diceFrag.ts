import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredShadeFrag';
import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, eq, glFragCoord, glFragDepth, glslFalse, glslTrue, gt, ifThen, insert, length, lt, main, mix, mul, neg, normalize, pow, retFn, sign, smoothstep, step, sub, sw, tern, ternChain, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { cyclicNoise } from './modules/cyclicNoise';
import { glslLofi } from './modules/glslLofi';
import { orthBas } from './modules/orthBas';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';
import { smax } from './modules/smax';
import { triplanarMapping } from './modules/triplanarMapping';

export const diceFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );

  const shouldCalcNoise = def( 'bool', glslFalse );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    // addAssign( p, mul( 0.04, noise ) );
    const d = def( 'float', smax(
      sdbox( p, vec3( 0.5 ) ),
      sub( sdbox( p, vec3( 0.26 ) ), 0.3 ),
      0.02,
    ) );

    const pa = abs( p );
    const N = mul( sign( p ), step( sw( pa, 'yzx' ), pa ), step( sw( pa, 'zxy' ), pa ) );
    const holetype = step( 0.5, sw( N, 'y' ) );
    const holer = mix( 0.2, 0.3, holetype );
    const pt = add( p, triplanarMapping( p, N, 1.0, ( uv ) => mul(
      orthBas( N ),
      vec3( ternChain(
        vec2( 0.0 ), // 1
        [ // 2
          eq( sw( N, 'z' ), 1.0 ),
          mul( vec2( -0.2, 0.2 ), sign( sw( uv, 'x' ) ) ),
        ],
        [ // 3
          eq( sw( N, 'x' ), 1.0 ),
          vec2( glslLofi( add( sw( uv, 'x' ), 0.12 ), 0.24 ) ),
        ],
        [ // 4
          eq( sw( N, 'x' ), -1.0 ),
          mul( -0.2, sign( uv ) ),
        ],
        [ // 5
          eq( sw( N, 'z' ), -1.0 ),
          tern(
            lt( length( uv ), 0.2 ),
            vec2( 0.0 ),
            mul( vec2( 0.24, -0.24 ), sign( uv ) ),
          ),
        ],
        [ // 6
          eq( sw( N, 'y' ), -1.0 ),
          vec2(
            mul( -0.2, sign( sw( uv, 'x' ) ) ),
            glslLofi( add( sw( neg( uv ), 'y' ), 0.14 ), 0.28 ),
          ),
        ],
      ), 0.0 ),
    ) ) );

    const holed = sub( holer, length( sub( pt, mul( N, add( 0.5, mul( 0.9, holer ) ) ) ) ) );
    assign( d, smax( d, holed, 0.02 ) );

    const hole = smoothstep( -0.02, -0.01, holed );

    const scratch = def( 'float' );
    ifThen( shouldCalcNoise, () => {
      assign( scratch, mul(
        mix( 1.0, 0.0, hole ),
        pow( smoothstep(
          -1.0,
          1.0,
          sw( mul(
            cyclicNoise( mul( p, 1.1 ) ),
            cyclicNoise( mul( p, 8.1 ) ),
          ), 'x' ),
        ), 5.0 ),
      ) );
      addAssign( d, mul( 0.001, scratch ) );
    } );

    retFn( vec4( d, holetype, hole, scratch ) );
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

    //  calc voronoi for finalizing map and normals
    assign( shouldCalcNoise, glslTrue );
    assign( isect, map( rp ) );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    const N = def( 'vec3', calcNormal( { rp, map } ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcDepth( cameraNearFar, len ) );
      retFn();

    }

    const hole = sw( isect, 'z' );

    const baseColor = mix(
      vec3( 0.8 ),
      mix( vec3( 0.04 ), vec3( 0.7, 0.1, 0.1 ), sw( isect, 'y' ) ),
      hole,
    );
    const roughness = mix(
      0.05,
      0.1,
      add( sw( isect, 'w' ), sw( cyclicNoise( mul( rp, 4.0 ) ), 'x' ) ),
    );

    assign( fragColor, vec4( baseColor, 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4(
      normalize( mul( normalMatrix, N ) ),
      MTL_PBR_ROUGHNESS_METALLIC,
    ) );
    assign( fragMisc, vec4( roughness, 0.0, 0.0, 0.0 ) );

  } );
} );
