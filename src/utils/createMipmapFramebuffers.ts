import { GLCatFramebuffer, GLCatRenderbuffer, GLCatTexture } from '@fms-cat/glcat-ts';
import { gl, glCat } from '../globals/canvas';

export function createMipmapFramebuffers(
  width: number,
  height: number,
  levels: number,
): GLCatFramebuffer<WebGL2RenderingContext>[] {
  let texture: GLCatTexture<WebGL2RenderingContext> | undefined;
  let renderbuffer: GLCatRenderbuffer<WebGL2RenderingContext> | undefined;
  let framebuffers: GLCatFramebuffer<WebGL2RenderingContext>[] | undefined;

  try {
    // == texture ==================================================================================
    texture = glCat.createTexture();
    texture.textureFilter( gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR );
    texture.bind( () => {
      gl.texStorage2D( gl.TEXTURE_2D, levels, gl.RGBA32F, width, height );
    } );

    // == framebuffers =============================================================================
    framebuffers = [ ...new Array( levels ) ].map( ( _, i ) => {
      const framebuffer = glCat.createFramebuffer();
      framebuffer.attachTexture( texture!, { level: i } );

      if ( i === 0 ) {
        renderbuffer = glCat.createRenderbuffer();
        renderbuffer.renderbufferStorage( width, height, { format: gl.DEPTH_COMPONENT24 } );
        framebuffer.attachRenderbuffer( renderbuffer, { attachment: gl.DEPTH_ATTACHMENT } );
      }

      return framebuffer;
    } );

    // == almost done ============================================================================
    return framebuffers;
  } catch ( e ) {
    texture?.dispose();
    renderbuffer?.dispose();
    framebuffers?.forEach( ( framebuffer ) => {
      framebuffer.dispose();
    } );
    throw e;
  }
}
