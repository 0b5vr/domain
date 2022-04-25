import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredConstants';
import { assign, build, defInNamed, defOut, div, fract, insert, main, mul, normalize, sw, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { glslGradient } from './modules/glslGradient';

export const particlesRenderFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vDice = defInNamed( 'vec4', 'vDice' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    const gradientPhase = fract( mul( 100.0, sw( vDice, 'x' ) ) );
    const color = glslGradient( gradientPhase, [
      vec3( 0.04 ),
      vec3( 0.7, 0.7, 0.04 ),
      vec3( 0.3, 0.7, 0.1 ),
      vec3( 0.7 ),
    ] );
    const roughness = 0.8;

    assign( fragColor, vec4( color, 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( vNormal ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( roughness, 0.0, 0.0, 0.0 ) );
    return;
  } );
} );
