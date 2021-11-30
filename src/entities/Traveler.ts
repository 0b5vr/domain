import { RaymarcherNode } from './utils/RaymarcherNode';
import { auto } from '../globals/automaton';
import { objectVert } from '../shaders/objectVert';
import { travelerFrag } from '../shaders/travelerFrag';

export class Traveler extends RaymarcherNode {
  public constructor() {
    super( travelerFrag );

    auto( 'traveler/glow', ( { value } ) => {
      this.materials.deferred.addUniform( 'glow', '1f', value );
    } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/travelerFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, travelerFrag( 'deferred' ) );
            depth.replaceShader( objectVert, travelerFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
