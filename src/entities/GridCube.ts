import { RaymarcherNode } from './utils/RaymarcherNode';
import { TransparentShell } from './TransparentShell';
import { gridCubeFrag } from '../shaders/gridCubeFrag';
import { objectVert } from '../shaders/objectVert';

export class GridCube extends RaymarcherNode {
  public constructor() {
    super( gridCubeFrag, { dimension: [ 0.5, 0.5, 0.5 ] } );

    const shell = new TransparentShell( {
      baseColor: [ 0.0, 0.0, 0.0 ],
    } );
    shell.transform.scale = [ 1.01, 1.01, 1.01 ];
    this.children.push( shell );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/gridCubeFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, gridCubeFrag( 'deferred' ) );
            depth.replaceShader( objectVert, gridCubeFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
