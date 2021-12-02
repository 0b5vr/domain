import { RaymarcherNode } from './utils/RaymarcherNode';
import { bumpBlockFrag } from '../shaders/bumpBlockFrag';
import { objectVert } from '../shaders/objectVert';

export class BumpBlock extends RaymarcherNode {
  public constructor() {
    super( bumpBlockFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/bumpBlockFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, bumpBlockFrag( 'deferred' ) );
            depth.replaceShader( objectVert, bumpBlockFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
