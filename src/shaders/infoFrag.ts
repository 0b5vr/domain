import { MTL_PBR_ROUGHNESS_METALLIC } from './deferredConstants';
import { abs, assign, build, def, defInNamed, defOut, defUniformNamed, div, insert, length, main, max, mix, mul, step, sub, sw, texture, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { sdbox2 } from './modules/sdbox2';

export const infoFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const samplerTexture = defUniformNamed( 'sampler2D', 'samplerTexture' );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    const infomark = def( 'float', mul(
      step( length( sub( vUv, 0.5 ) ), 0.45 ), // circle
      step( 0.13, length( sub( vUv, vec2( 0.5, 0.76 ) ) ) ), // small circle
      step( 0.0, sdbox2( sub( vUv, vec2( 0.46, 0.58 ) ), vec2( 0.16, 0.02 ) ) ),
      step( 0.0, sdbox2( sub( vUv, vec2( 0.5, 0.38 ) ), vec2( 0.12, 0.2 ) ) ),
      step( 0.0, sdbox2( sub( vUv, vec2( 0.5, 0.18 ) ), vec2( 0.2, 0.02 ) ) ),
    ) );
    const infoColored = mix(
      vec3( 0.1, 0.2, 0.5 ),
      vec3( 0.9 ),
      infomark,
    );

    const isMetal = def( 'float', step(
      max( abs( sw( vPositionWithoutModel, 'z' ) ), abs( sw( vPositionWithoutModel, 'x' ) ) ),
      0.48,
    ) );
    const albedo = mix( infoColored, vec3( 0.2 ), isMetal );
    const roughness = sw( texture( samplerTexture, mul( vUv, 0.25 ) ), 'y' );

    assign( fragColor, vec4( albedo, 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( vNormal, MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( roughness, isMetal, 0.0, 0.0 ) );
    return;
  } );
} );
