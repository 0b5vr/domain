import { RaymarcherNode } from './utils/RaymarcherNode';
import { objectVert } from '../shaders/objectVert';
import { parkingSpaceFrag } from '../shaders/parkingSpaceFrag';

export class ParkingSpace extends RaymarcherNode {
  public constructor() {
    super( parkingSpaceFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/parkingSpaceFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, parkingSpaceFrag( 'deferred' ) );
            depth.replaceShader( objectVert, parkingSpaceFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
