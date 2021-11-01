import { RenderTarget } from './RenderTarget';
import { gl, glCat } from '../globals/canvas';

export interface RawBufferRenderTargetOptions {
  framebuffer: WebGLFramebuffer;
  viewport: [ number, number, number, number ];
  attachment?: number | GLenum[];
}

export class RawBufferRenderTarget extends RenderTarget {
  public viewport: [ number, number, number, number ];
  public attachment: number | GLenum[];
  public framebuffer: WebGLFramebuffer;

  public constructor( options: RawBufferRenderTargetOptions ) {
    super();

    this.framebuffer = options.framebuffer;
    this.viewport = options.viewport;
    this.attachment = options.attachment ?? [ gl.BACK ];
  }

  public bind(): void {
    gl.bindFramebuffer( gl.FRAMEBUFFER, this.framebuffer );
    glCat.drawBuffers( this.viewport );
    gl.viewport( ...this.viewport );
  }
}
