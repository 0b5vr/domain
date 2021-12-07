import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredShadeFrag';
import { TAU } from '../utils/constants';
import { add, assign, build, cos, defInNamed, defOut, div, insert, main, max, min, mix, mul, normalize, sw, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { glslLinearstep } from './modules/glslLinearstep';
import { simplex3d } from './modules/simplex3d';

export const oscilloscopeMeasureFrag = build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    const color = add(
      vec3( 0.03, 0.05, 0.04 ),
      mix( 0.0, 0.03, simplex3d( mul( 200.0, sw( vPositionWithoutModel, 'xyz' ) ) ) ),
    );

    const measureBigGrid = glslLinearstep( 0.98, 0.99, cos( mul( TAU, 10.0, vUv ) ) );
    const measureSmallGrid = glslLinearstep( 0.9, 0.95, cos( mul( TAU, 50.0, vUv ) ) );
    const measureSmallGridClip = glslLinearstep( 0.94, 0.97, cos( mul( TAU, 2.0, vUv ) ) );
    const measure = max(
      max( sw( measureBigGrid, 'x' ), sw( measureBigGrid, 'y' ) ),
      max(
        min( sw( measureSmallGrid, 'x' ), sw( measureSmallGridClip, 'y' ) ),
        min( sw( measureSmallGrid, 'y' ), sw( measureSmallGridClip, 'x' ) ),
      ),
    );

    // const measure = max(
    //   mul(
    //     glslLinearstep( 0.98, 0.99, sw( measureSmallGrid, 'x' ) ),
    //   ),
    //   glslLinearstep( 0.98, 0.99, sw( measureSmallGrid, 'y' ) ),
    // );

    assign( fragColor, vec4( mix( color, vec3( 0.0 ), measure ), 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( vNormal ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 1.0, 0.0, 0.0, 0.0 ) );
    return;
  } );
} );
