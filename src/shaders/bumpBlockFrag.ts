import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredShadeFrag';
import { abs, add, addAssign, assign, build, clamp, def, defFn, defInNamed, defOut, defUniformNamed, discard, div, eq, glFragCoord, glFragDepth, glslFalse, glslTrue, gt, ifThen, insert, length, main, mix, mod, mul, normalize, pow, retFn, smoothstep, step, sub, subAssign, sw, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { calcDepth } from './modules/calcDepth';
import { calcNormal } from './modules/calcNormal';
import { cyclicNoise } from './modules/cyclicNoise';
import { defSimplexFBM4d } from './modules/simplexFBM4d';
import { glslLinearstep } from './modules/glslLinearstep';
import { glslSaturate } from './modules/glslSaturate';
import { maxOfVec3 } from './modules/maxOfVec3';
import { raymarch } from './modules/raymarch';
import { sdbox } from './modules/sdbox';
import { setupRoRd } from './modules/setupRoRd';

export const bumpBlockFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
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

  const fbm = defSimplexFBM4d();

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const d = def( 'float', sdbox( p, vec3( 0.47 ) ) );
    const dirt = def( 'float', 0.0 );

    // addAssign( d, (
    //   glslSaturate( sub( 0.002, abs( sub( sw( p, 'z' ), 0.42 ) ) ) )
    // ) );

    const mtl = step( 0.42, sw( p, 'z' ) );

    ifThen( eq( mtl, 0.0 ), () => {
      const uv = clamp( vec2( -0.5 ), vec2( 0.5 ), sw( p, 'xy' ) );
      addAssign( p, mul(
        vec3( 0.0, 0.0, -0.2 ),
        mix( 0.5, 1.0, fbm( vec4( uv, 0.0, 0.0 ) ) ),
      ) );

      assign( d, sdbox( p, vec3( 0.47 ) ) );

      ifThen( shouldCalcNoise, () => {
        addAssign( d, mul(
          0.01,
          smoothstep( 0.6, 0.5, maxOfVec3( abs( p ) ) ),
          mix( 0.5, 1.0, fbm( vec4( p, 3.0 ) ) ),
        ) );
      } );

    }, () => {
      const uv = sub( mod( sub( sw( p, 'xy' ), 0.09 ), vec2( 0.18 ) ), 0.09 );

      // subAssign( d, clamp( sw( uv, 'x' ), 0.0, 0.02 ) );
      const bumpHeight = sub( 0.04, length( uv ) );
      subAssign( d, mul( 0.5, clamp( bumpHeight, 0.0, 0.02 ) ) );
      addAssign( dirt, mul(
        0.5,
        glslLinearstep( 0.04, 0.0, abs( bumpHeight ) ),
      ) );
      addAssign( dirt, mul(
        0.2,
        glslLinearstep( 0.0, 0.02, bumpHeight ),
      ) );

      ifThen( shouldCalcNoise, () => {
        const scratch = def( 'float', mul(
          pow( smoothstep(
            -1.0,
            1.0,
            sw( mul(
              cyclicNoise( mul( p, 4.1 ) ),
              cyclicNoise( mul( p, 14.1 ) ),
            ), 'x' ),
          ), 5.0 ),
        ) );
        addAssign( d, mul( 0.001, scratch ) );
        addAssign( dirt, mul( 1.0, scratch ) );
      } );

    } );

    retFn( vec4( d, mtl, dirt, 0 ) );
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

    const mtl = sw( isect, 'y' );

    const cyc = cyclicNoise( mul( rp, 2.0 ) );

    const dirt = def( 'float', glslSaturate( add(
      fbm( vec4( add(
        mul( mix( 2.0, 4.0, mtl ), rp ),
        mul( mix( 0.1, 0.5, mtl ), cyc ),
      ), 0.0 ) ),
      sw( isect, 'z' ),
      mix( 0.0, -0.2, mtl ),
    ) ) );

    const baseColor = mix(
      mix(
        vec3( 0.4 ),
        vec3( 0.8, 0.6, 0.1 ),
        mtl,
      ),
      vec3( 0.1 ),
      dirt,
    );
    const roughness = mix(
      mix(
        0.9,
        mix(
          0.4,
          0.5,
          add( sw( isect, 'w' ), sw( cyc, 'x' ) ),
        ),
        mtl,
      ),
      1.0,
      dirt,
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
