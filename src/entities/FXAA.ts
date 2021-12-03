import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { SceneNode } from '../heck/components/SceneNode';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { fxaaFrag } from '../shaders/fxaaFrag';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';

export interface FXAAOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class FXAA extends SceneNode {
  public constructor( options: FXAAOptions ) {
    super();

    this.visible = false;

    // -- post -------------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      fxaaFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    material.addUniformTextures( 'sampler0', options.input.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/fxaaFrag', () => {
          material.replaceShader( quadVert, fxaaFrag );
        } );
      }
    }

    const quad = new Quad( {
      target: options.target,
      material,
      name: process.env.DEV && 'quad',
    } );
    this.children.push( quad );
  }
}
