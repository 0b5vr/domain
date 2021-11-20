import { RaymarcherNode } from './utils/RaymarcherNode';
import { mengerSpongeFrag } from '../shaders/mengerSpongeFrag';
import { objectVert } from '../shaders/objectVert';

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

            cubemap.replaceShader( objectVert, mengerSpongeFrag( 'forward' ) );
            deferred.replaceShader( objectVert, mengerSpongeFrag( 'deferred' ) );
            depth.replaceShader( objectVert, mengerSpongeFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
