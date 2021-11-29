import { RaymarcherNode } from './utils/RaymarcherNode';
import { auto } from '../globals/automaton';
import { ifsCubeFrag } from '../shaders/ifsCubeFrag';
import { objectVert } from '../shaders/objectVert';

export class IFSCube extends RaymarcherNode {
  public constructor() {
    super( ifsCubeFrag );

    auto( 'ifsCube/seed', ( { value } ) => {
      this.materials.deferred.addUniform( 'seed', '1f', value );
      this.materials.depth.addUniform( 'seed', '1f', value );
    } );

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
