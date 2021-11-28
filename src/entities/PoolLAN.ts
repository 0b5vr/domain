import { CanvasTexture } from './utils/CanvasTexture';
import { RaymarcherNode } from './utils/RaymarcherNode';
import { TransparentShell } from './TransparentShell';
import { objectVert } from '../shaders/objectVert';
import { poolLanFrag } from '../shaders/poolLanFrag';

const textCanvas = new CanvasTexture( 1024, 256 );
textCanvas.clear();

const context = textCanvas.context;
context.textAlign = 'center';
context.textBaseline = 'middle';
context.font = '700 192px Cambria';

context.fillText( 'Pool-LAN', 512, 128 );

textCanvas.updateTexture();

export class PoolLAN extends RaymarcherNode {
  public constructor() {
    super( poolLanFrag );

    this.materials.deferred.addUniformTextures( 'samplerText', textCanvas.texture );

    const shell = new TransparentShell();
    shell.transform.position = [ 0.0, 0.05, 0.4 ];
    shell.transform.scale = [ 0.9, 0.8, 0.01 ];
    this.children.push( shell );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/poolLanFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, poolLanFrag( 'deferred' ) );
            depth.replaceShader( objectVert, poolLanFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
