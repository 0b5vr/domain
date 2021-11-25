import { RaymarcherNode } from './utils/RaymarcherNode';
import { TransparentShell } from './TransparentShell';
import { auto } from '../globals/automaton';
import { objectVert } from '../shaders/objectVert';
import { parkingSpaceFrag } from '../shaders/parkingSpaceFrag';

export class ParkingSpace extends RaymarcherNode {
  public constructor() {
    super( parkingSpaceFrag );

    const shell = new TransparentShell( {
      opacity: 0.01,
    } );
    shell.transform.scale = [ 0.95, 0.95, 0.95 ];
    this.children.push( shell );

    auto( 'parkingSpace/full', ( { value } ) => (
      this.materials.deferred.addUniform( 'full', '1f', value )
    ) );

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
