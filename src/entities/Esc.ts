import { CanvasTexture } from './utils/CanvasTexture';
import { RaymarcherNode } from './utils/RaymarcherNode';
import { escFrag } from '../shaders/escFrag';
import { objectVert } from '../shaders/objectVert';

const textCanvas = new CanvasTexture( 1024, 256 );
textCanvas.clear();

const context = textCanvas.context;
context.textAlign = 'center';
context.textBaseline = 'middle';
context.font = '700 italic 192px Arial';

context.fillText( 'Esc', 512, 128 );

textCanvas.updateTexture();

export class Esc extends RaymarcherNode {
  public constructor() {
    super( escFrag );

    this.materials.deferred.addUniformTextures( 'samplerText', textCanvas.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/escFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, escFrag( 'deferred' ) );
            depth.replaceShader( objectVert, escFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
