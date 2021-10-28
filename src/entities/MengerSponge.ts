import { RaymarcherNode } from './utils/RaymarcherNode';
import { mengerSpongeFrag } from '../shaders/mengerSpongeFrag';

export class MengerSponge extends RaymarcherNode {
  public constructor() {
    super( mengerSpongeFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/mengerSpongeFrag',
          ],
          () => {
            const { cubemap, deferred, depth } = this.materials;
            const vert = this.vert;

            cubemap.replaceShader( vert, mengerSpongeFrag( 'forward' ) );
            deferred.replaceShader( vert, mengerSpongeFrag( 'deferred' ) );
            depth.replaceShader( vert, mengerSpongeFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
