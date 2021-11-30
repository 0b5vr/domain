import { RaymarcherNode } from './utils/RaymarcherNode';
import { diceFrag } from '../shaders/diceFrag';
import { objectVert } from '../shaders/objectVert';

export class Dice extends RaymarcherNode {
  public constructor() {
    super( diceFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/diceFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, diceFrag( 'deferred' ) );
            depth.replaceShader( objectVert, diceFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
