import { RenderTarget } from './RenderTarget';
import { canvas, gl, glCat } from '../globals/canvas';

export class CanvasRenderTarget extends RenderTarget {
  public get width(): number {
    return canvas.width;
  }

  public get height(): number {
    return canvas.height;
  }

  public bind(): void {
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    glCat.drawBuffers( [ gl.BACK ] );
    gl.viewport( 0, 0, this.width, this.height );
  }
}
