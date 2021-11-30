import { CanvasTexture } from './utils/CanvasTexture';
import { CharCanvasTexture } from './fui/CharCanvasTexture';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Lambda } from '../heck/components/Lambda';
import { RaymarcherNode } from './utils/RaymarcherNode';
import { ShaderRenderTarget } from './utils/ShaderRenderTarget';
import { auto } from '../globals/automaton';
import { crtDecodeFrag } from '../shaders/crtDecodeFrag';
import { crtEffectFrag } from '../shaders/crtEffectFrag';
import { crtEncodeFrag } from '../shaders/crtEncodeFrag';
import { crtFrag } from '../shaders/crtFrag';
import { objectVert } from '../shaders/objectVert';
import { quadVert } from '../shaders/quadVert';

export const tagCRT = Symbol();

export class CRT extends RaymarcherNode {
  public input?: GLCatTexture;

  public constructor() {
    // -- pool-lan ---------------------------------------------------------------------------------
    const textCanvas = new CanvasTexture( 1024, 256 );
    textCanvas.clear();

    const context = textCanvas.context;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '700 192px Cambria';

    context.fillText( 'Pool-LAN', 512, 128 );

    textCanvas.updateTexture();

    // -- char and effect --------------------------------------------------------------------------
    const charCanvasTexture = new CharCanvasTexture( 640, 480 );
    charCanvasTexture.charArray[ 49 ] = '15 36 30,10 50'; // 1
    charCanvasTexture.charArray[ 52 ] = '56 03 02 62,56 50'; // 4
    charCanvasTexture.charArray[ 54 ] = '65 56 16 05 01 10 50 61 62 53 03'; // 6
    charCanvasTexture.charArray[ 58 ] = '35 34,32 31'; // :
    charCanvasTexture.charArray[ 97 ] = '00 04 36 64 60,02 62'; // a
    charCanvasTexture.charArray[ 101 ] = '06 66,03 53,06 00 60'; // e
    charCanvasTexture.charArray[ 103 ] = '65 56 16 05 01 10 50 61 63 33'; // g
    charCanvasTexture.charArray[ 105 ] = '16 56,10 50,36 30'; // i
    charCanvasTexture.charArray[ 106 ] = '36 66,56 51 30 10 01'; // j
    charCanvasTexture.charArray[ 107 ] = '06 00,66 13 03,13 60'; // k
    charCanvasTexture.charArray[ 110 ] = '00 06,05 61,60 66'; // n
    charCanvasTexture.charArray[ 113 ] = '10 50 61 65 56 16 05 01 10,41 60'; // q
    charCanvasTexture.charArray[ 118 ] = '06 02 30 62 66'; // v
    charCanvasTexture.charArray[ 119 ] = '06 01 10 31 33,31 50 61 66'; // w
    charCanvasTexture.widthArray = [];
    charCanvasTexture.defaultWidth = 6;
    charCanvasTexture.pointXMap = [ 0, 1, 1, 2, 3, 3, 4 ];
    charCanvasTexture.pointYMap = [ 0, 1, 2, 3, 4, 5, 6 ];

    auto( 'crt/greetz', ( { value } ) => {
      const str = ( [
        '0x4015',
        'alcatraz',
        'altair',
        'asd',
        'astronomena',
        'bitbendaz',
        'butadiene',
        'cncd',
        'cocoon',
        'conspiracy',
        'cosamentale',
        'ctrl+alt+test',
        'doxas',
        'epoch',
        'evvvvil',
        'fairlight',
        'farbrausch',
        'fizzer',
        'flopine',
        'frontl1ne',
        'holon',
        'gam0022/&/sadakkey',
        'gaz',
        'gyabo',
        'jetlag',
        'jugem-t',
        'kamoshika',
        'kaneta',
        'lexaloffle',
        'limp ninja',
        'lj',
        'logicoma',
        'marcan',
        'mercury',
        'mfx',
        'mrdoob',
        'nerumae',
        'niko_14',
        'nikq::club',
        'ninjadev',
        'notargs',
        'nusan',
        'orange',
        'polarity',
        'poo-brain',
        'primitive',
        'phi16',
        'prismbeings',
        'quite',
        'reflex',
        'rgba',
        'satori',
        'setchi',
        'slay bells',
        'sp4ghet',
        'still',
        'suricrasia/online',
        'system k',
        'tdhooper',
        'titan',
        'tpolm',
        'tomohiro',
        'umalut design',
        'wrighter',
      ][ Math.floor( value ) ] ?? '' ).split( '/' );

      charCanvasTexture.clear();
      str.map( ( s, i ) => (
        charCanvasTexture.drawChars( 320, 170 - i * 80 + str.length * 40, 8, s, 0.5 )
      ) );
      charCanvasTexture.updateTexture();
    } );

    const targetEffect = new ShaderRenderTarget(
      640,
      480,
      crtEffectFrag,
      process.env.DEV && 'crtEffect',
    );
    targetEffect.material.addUniformTextures( 'sampler1', charCanvasTexture.texture );

    const lambdaUpdateInput = new Lambda( {
      onUpdate: () => {
        if ( this.input ) {
          targetEffect.material.addUniformTextures( 'sampler0', this.input );
        }
      },
    } );

    const lambdaUpdateTargetEffect = targetEffect.createUpdateLambda();

    if ( process.env.DEV ) {
      module.hot?.accept( '../shaders/crtEffectFrag', () => {
        targetEffect.material.replaceShader( quadVert, crtEffectFrag );
        targetEffect.quad.drawImmediate();
      } );
    }

    // -- signals ----------------------------------------------------------------------------------
    const targetEncode = new ShaderRenderTarget(
      640,
      480,
      crtEncodeFrag,
      process.env.DEV && 'crtEncode',
    );
    targetEncode.material.addUniformTextures( 'sampler0', targetEffect.texture );

    const lambdaUpdateTargetEncode = targetEncode.createUpdateLambda();

    if ( process.env.DEV ) {
      module.hot?.accept( '../shaders/crtEncodeFrag', () => {
        targetEncode.material.replaceShader( quadVert, crtEncodeFrag );
        targetEncode.quad.drawImmediate();
      } );
    }

    const targetDecode = new ShaderRenderTarget(
      640,
      480,
      crtDecodeFrag,
      process.env.DEV && 'crtDecode',
    );
    targetDecode.material.addUniformTextures( 'sampler0', targetEncode.texture );

    const lambdaUpdateTargetDecode = targetDecode.createUpdateLambda();

    if ( process.env.DEV ) {
      module.hot?.accept( '../shaders/crtDecodeFrag', () => {
        targetDecode.material.replaceShader( quadVert, crtDecodeFrag );
        targetDecode.quad.drawImmediate();
      } );
    }

    // -- raymarch ---------------------------------------------------------------------------------
    super( crtFrag );

    this.materials.deferred.addUniformTextures( 'sampler0', targetDecode.texture );
    this.materials.deferred.addUniformTextures( 'samplerText', textCanvas.texture );

    auto( 'traveler/glow', ( { value } ) => {
      this.materials.deferred.addUniform( 'glow', '1f', value );
    } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/crtFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, crtFrag( 'deferred' ) );
            depth.replaceShader( objectVert, crtFrag( 'depth' ) );
          },
        );
      }
    }

    // -- components -------------------------------------------------------------------------------
    this.tags.push( tagCRT );

    this.children.unshift(
      lambdaUpdateInput,
      lambdaUpdateTargetEffect,
      lambdaUpdateTargetEncode,
      lambdaUpdateTargetDecode,
    );
  }
}
