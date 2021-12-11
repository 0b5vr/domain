import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { GLCatTexture } from '@0b5vr/glcat-ts';
import { IBLLUT_ITER, IBLLUT_SIZE } from '../config';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { SceneNode } from '../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl } from '../globals/canvas';
import { iblLutFrag } from '../shaders/iblLutFrag';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';
import { vdc } from '../utils/vdc';

export const IBLLUTCalcTag = Symbol();

export class IBLLUTCalc extends SceneNode {
  public swap: Swap<BufferRenderTarget>;

  public get texture(): GLCatTexture {
    return this.swap.o.texture;
  }

  public constructor() {
    super();

    this.visible = false;
    this.tags.push( IBLLUTCalcTag );

    // -- swap -------------------------------------------------------------------------------------
    this.swap = new Swap(
      new BufferRenderTarget( {
        width: IBLLUT_SIZE,
        height: IBLLUT_SIZE,
        name: process.env.DEV && 'IBLLUTCalc/swap0',
        filter: gl.NEAREST,
      } ),
      new BufferRenderTarget( {
        width: IBLLUT_SIZE,
        height: IBLLUT_SIZE,
        name: process.env.DEV && 'IBLLUTCalc/swap1',
        filter: gl.NEAREST,
      } ),
    );

    // -- post -------------------------------------------------------------------------------------
    let samples = 0.0;

    const material = new Material(
      quadVert,
      iblLutFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    material.addUniform( 'samples', '1f', samples );
    material.addUniform( 'vdc', '1f', vdc( samples, 2.0 ) );
    material.addUniformTextures( 'sampler0', this.swap.i.texture );

    const quad = new Quad( {
      target: this.swap.o,
      material,
      name: process.env.DEV && 'quad',
    } );

    // -- swapper ----------------------------------------------------------------------------------
    this.children.push( new Lambda( {
      onUpdate: () => {
        samples ++;
        this.swap.swap();

        if ( samples > IBLLUT_ITER ) {
          this.active = false; // THE LAMBDA ITSELF WILL ALSO BE DEACTIVATED
        } else {
          material.addUniform( 'samples', '1f', samples );
          material.addUniform( 'vdc', '1f', vdc( samples, 2.0 ) );
          material.addUniformTextures( 'sampler0', this.swap.i.texture );

          quad.target = this.swap.o;
        }
      },
      name: process.env.DEV && 'swapper',
    } ) );

    this.children.push( quad );
  }
}
