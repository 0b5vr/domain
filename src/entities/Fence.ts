import { RaymarcherNode } from './utils/RaymarcherNode';
import { fenceFrag } from '../shaders/fenceFrag';
import { objectVert } from '../shaders/objectVert';

export class Fence extends RaymarcherNode {
  public constructor() {
    super( fenceFrag, {
      dimension: [ 10.0, 0.5, 0.1 ],
    } );

    this.transform.position = [ 0.0, 0.5, 3.0 ];

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/fenceFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, fenceFrag( 'deferred' ) );
            depth.replaceShader( objectVert, fenceFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
