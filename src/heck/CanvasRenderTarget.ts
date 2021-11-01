import { RenderTarget } from './RenderTarget';
import { canvas, gl, glCat } from '../globals/canvas';

export interface CanvasRenderTargetOptions {
  viewport?: [ number, number, number, number ];
}

export class CanvasRenderTarget extends RenderTarget {
  public viewport: [ number, number, number, number ];

  public constructor( options?: CanvasRenderTargetOptions ) {
    super();

    this.viewport = options?.viewport ?? [ 0, 0, canvas.width, canvas.height ];
  }

  public bind(): void {
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    glCat.drawBuffers( [ gl.BACK ] );
    gl.viewport( ...this.viewport );
  }
}
