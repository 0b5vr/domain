import { RaymarcherNode } from './utils/RaymarcherNode';
import { TransparentShell } from './TransparentShell';
import { objectVert } from '../shaders/objectVert';
import { octreeFrag } from '../shaders/octreeFrag';

export class Octree extends RaymarcherNode {
  public constructor() {
    super( octreeFrag );

    this.children.push( new TransparentShell( {
      opacity: 0.04,
    } ) );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/octreeFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, octreeFrag( 'deferred' ) );
            depth.replaceShader( objectVert, octreeFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
