import { CanvasTexture } from './utils/CanvasTexture';
import { RaymarcherNode } from './utils/RaymarcherNode';
import { cardboardFrag } from '../shaders/cardboardFrag';
import { objectVert } from '../shaders/objectVert';

const canvasTexture = new CanvasTexture( 1024, 1024 );
const { context, texture } = canvasTexture;

context.lineWidth = 8.0;
context.textAlign = 'center';

context.strokeRect( 128, 640, 160, 256 );
context.strokeRect( 736, 128, 160, 160 );

context.fillRect( 752, 240, 128, 16 );

context.beginPath();
context.moveTo( 756, 180 );
context.lineTo( 796, 220 );
context.lineTo( 788, 228 );
context.lineTo( 820, 228 );
context.lineTo( 820, 196 );
context.lineTo( 812, 204 );
context.lineTo( 772, 164 );
context.fill();

context.beginPath();
context.moveTo( 828, 228 );
context.lineTo( 868, 188 );
context.lineTo( 876, 196 );
context.lineTo( 876, 164 );
context.lineTo( 844, 164 );
context.lineTo( 852, 172 );
context.lineTo( 852, 172 );
context.lineTo( 828, 196 );
context.fill();

context.lineWidth = 4.0;
context.font = '700 128px Trebuchet MS';
context.strokeText( 'pouët', 430, 512 );
context.fillText( 'pouët', 430, 512 );

context.lineWidth = 2.5;
context.font = '700 96px Trebuchet MS';
context.strokeText( '.net', 700, 512 );
context.fillText( '.net', 700, 512 );

canvasTexture.updateTexture();

export class Cardboard extends RaymarcherNode {
  public constructor() {
    super( cardboardFrag );

    this.materials.deferred.addUniformTextures( 'samplerTexture', texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/cardboardFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, cardboardFrag( 'deferred' ) );
            depth.replaceShader( objectVert, cardboardFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
