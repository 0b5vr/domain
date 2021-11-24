import { RaymarcherNode } from './utils/RaymarcherNode';
import { objectVert } from '../shaders/objectVert';
import { sp4ghetFrag } from '../shaders/sp4ghetFrag';

export class Sp4ghet extends RaymarcherNode {
  public constructor() {
    super( sp4ghetFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/sp4ghetFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, sp4ghetFrag( 'deferred' ) );
            depth.replaceShader( objectVert, sp4ghetFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
