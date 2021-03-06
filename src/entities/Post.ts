import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { SceneNode } from '../heck/components/SceneNode';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { postFrag } from '../shaders/postFrag';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';
import { randomTexture } from '../globals/randomTexture';

export interface PostOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class Post extends SceneNode {
  public constructor( options: PostOptions ) {
    super();

    this.visible = false;

    // -- post -------------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      postFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    material.addUniformTextures( 'sampler0', options.input.texture );
    material.addUniformTextures( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/postFrag', () => {
          material.replaceShader( quadVert, postFrag );
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
