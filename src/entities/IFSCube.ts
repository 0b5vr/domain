import { RaymarcherNode } from './utils/RaymarcherNode';
import { ifsCubeFrag } from '../shaders/ifsCubeFrag';
import { objectVert } from '../shaders/objectVert';

export class IFSCube extends RaymarcherNode {
  public constructor() {
    super( ifsCubeFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/ifsCubeFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, ifsCubeFrag( 'deferred' ) );
            depth.replaceShader( objectVert, ifsCubeFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
