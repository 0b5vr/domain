import { GLCatFramebuffer, GLCatTextureCubemap } from '@fms-cat/glcat-ts';
import { RenderTarget } from './RenderTarget';
import { gl, glCat } from '../globals/canvas';

export interface CubemapRenderTargetOptions {
  width: number;
  height: number;
  isFloat?: boolean;
}

export class CubemapRenderTarget extends RenderTarget {
  public readonly framebuffer: GLCatFramebuffer;
  public readonly texture: GLCatTextureCubemap;
  public viewport: [ number, number, number, number ];

  public constructor( options: CubemapRenderTargetOptions ) {
    super();

    this.viewport = [ 0, 0, options.width, options.height ];

    const { framebuffer, texture } = glCat.lazyCubemapFramebuffer(
      options.width,
      options.height,
      {
        isFloat: options.isFloat ?? true
      },
    );
    this.framebuffer = framebuffer;
    this.texture = texture;
  }

  public bind(): void {
    gl.bindFramebuffer( gl.FRAMEBUFFER, this.framebuffer.raw );
    glCat.drawBuffers( 1 );
    gl.viewport( ...this.viewport );
  }

  public dispose(): void {
    this.framebuffer.dispose();
  }
}
