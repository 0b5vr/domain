
import { RaymarcherNode } from './utils/RaymarcherNode';
import { sssBoxFrag } from '../shaders/sssBoxFrag';

export class SSSBox extends RaymarcherNode {
  public constructor() {
    super( sssBoxFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/sssBoxFrag',
          ],
          () => {
            const { cubemap, deferred, depth } = this.materials;
            const vert = this.vert;

            cubemap.replaceShader( vert, sssBoxFrag( 'forward' ) );
            deferred.replaceShader( vert, sssBoxFrag( 'deferred' ) );
            depth.replaceShader( vert, sssBoxFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
