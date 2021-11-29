import { RaymarcherNode } from './utils/RaymarcherNode';
import { iridescentFrag } from '../shaders/iridescentFrag';
import { objectVert } from '../shaders/objectVert';

export class Iridescent extends RaymarcherNode {
  public constructor() {
    super( iridescentFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/iridescentFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, iridescentFrag( 'deferred' ) );
            depth.replaceShader( objectVert, iridescentFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
