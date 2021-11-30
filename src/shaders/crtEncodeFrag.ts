import { TAU } from '../utils/constants';
import { abs, add, addAssign, assign, build, cos, def, defInNamed, defOut, defUniformNamed, dot, float, forLoop, ifThen, insert, lt, main, mat3, mix, mul, mulAssign, sin, sub, sw, texture, vec2, vec4 } from '../shader-builder/shaderBuilder';
import { glslDefRandom } from './modules/glslDefRandom';
import { glslSaturate } from './modules/glslSaturate';

const CHROMA_AMP = 0.4;
const CHROMA_FREQ = 227.5;
const CHROMA_SCANLINE_OFFSET = 120.0;
const LPF_WIDTH = 0.04;
const LPF_ITER = 10;

const RGB_TO_YCBCR = mat3(
  0.299, -0.168736, 0.5,
  0.587, -0.331264, -0.418688,
  0.114, 0.5, -0.081312,
);

export const crtEncodeFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const { init, random } = glslDefRandom();

  main( () => {
    init( texture( samplerRandom, vUv ) );

    const phase = def( 'float', (
      mul( TAU, dot( vec2( CHROMA_FREQ, CHROMA_SCANLINE_OFFSET ), vUv ) ) )
    );

    const tex = glslSaturate( texture( sampler0, vUv ) );
    const ycbcr = def( 'vec3', mul( RGB_TO_YCBCR, sw( tex, 'xyz' ) ) );

    // chroma signal will be filtered using LPF, this time we're gonna use cheap LPF
    mulAssign( sw( ycbcr, 'yz' ), 0.2 );

    forLoop( LPF_ITER - 1, ( i ) => {
      const uvt = sub( vUv, vec2( mul( LPF_WIDTH / LPF_ITER, add( 1.0, float( i ) ) ), 0.0 ) );
      ifThen( lt( abs( sub( sw( uvt, 'x' ), 0.5 ) ), 0.5 ), () => {
        const tex = def( 'vec4', glslSaturate( texture( sampler0, uvt ) ) );
        addAssign( sw( ycbcr, 'yz' ), (
          sw( mul( RGB_TO_YCBCR, sw( tex, 'xyz' ), 1.0 / LPF_ITER ), 'yz' )
        ) );
      } );
    } );

    const signal = def( 'float', sw( ycbcr, 'x' ) ); // y as base level
    assign( signal, mix( CHROMA_AMP, 1.0 - CHROMA_AMP, signal ) );
    addAssign( signal, mul(
      CHROMA_AMP,
      dot( vec2( sw( ycbcr, 'y' ) ), vec2( cos( phase ), sin( phase ) ) ),
    ) );

    addAssign( signal, mul( 0.03, random() ) );

    assign( fragColor, vec4( signal, 0.0, 0.0, 1.0 ) );
  } );
} );
