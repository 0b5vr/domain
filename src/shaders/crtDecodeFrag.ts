import { PI, TAU } from '../utils/constants';
import { abs, add, addAssign, assign, build, cos, def, defInNamed, defOut, defUniformNamed, div, dot, float, forLoop, ifThen, insert, lt, main, mat3, mul, sin, sub, sw, texture, vec2, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { glslLinearstep } from './modules/glslLinearstep';
import { glslSaturate } from './modules/glslSaturate';

const CHROMA_AMP = 0.4;
const CHROMA_FREQ = 97.5;
const DECODE_PERIOD = 2.0;
const DECODE_ITER = 10.0;
const CHROMA_SCANLINE_OFFSET = 120.0;

const YCBCR_TO_RGB = mat3( 1.0, 1.0, 1.0, 0.0, -0.344136, 1.772, 1.402, -0.714136, 0.0 );

export const crtDecodeFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    const y = def( 'float', 0.0 );
    const cbcr = def( 'vec2', vec2( 0.0, 0.0 ) );

    const sampleOffset = vec2( DECODE_PERIOD / CHROMA_FREQ / DECODE_ITER, 0.0 );

    forLoop( DECODE_ITER, ( i ) => {
      const uvt = def( 'vec2', sub(
        vUv,
        mul( sampleOffset, sub( float( i ), DECODE_ITER / 2.0 ) )
      ) );

      ifThen( lt( abs( sub( sw( uvt, 'x' ), 0.5 ) ), 0.5 ), () => {
        const tex = def( 'float', sw( div( texture( sampler0, uvt ), DECODE_ITER ), 'x' ) );
        addAssign( y, tex );
        const phase = def( 'float', (
          mul( TAU, dot( vec2( CHROMA_FREQ, CHROMA_SCANLINE_OFFSET ), uvt ) ) )
        );
        addAssign( cbcr, mul( tex, vec2( cos( phase ), sin( phase ) ) ) );
      } );
    } );

    const ycbcr = def( 'vec3', vec3(
      glslSaturate( add( 0.5, (
        add( glslLinearstep( CHROMA_AMP, 1.0 - CHROMA_AMP, y ), -0.5 )
      ) ) ),
      mul( 2.0, PI / CHROMA_AMP, cbcr ),
    ) );

    assign( fragColor, vec4(
      mul( YCBCR_TO_RGB, ycbcr ),
      1.0,
    ) );
    // assign( fragColor, texture( sampler0, vUv ) );
  } );
} );
