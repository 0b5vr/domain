import { RaymarcherNode } from './utils/RaymarcherNode';
import { TransparentShell } from './TransparentShell';
import { auto } from '../globals/automaton';
import { objectVert } from '../shaders/objectVert';
import { octreeFrag } from '../shaders/octreeFrag';

export class Octree extends RaymarcherNode {
  public constructor() {
    super( octreeFrag );

    auto( 'octree/seed', ( { value } ) => {
      this.materials.deferred.addUniform( 'seed', '1f', value );
      this.materials.depth.addUniform( 'seed', '1f', value );
    } );

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
