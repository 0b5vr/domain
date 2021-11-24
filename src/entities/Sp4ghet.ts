import { RaymarcherNode } from './utils/RaymarcherNode';
import { TransparentShell } from './TransparentShell';
import { objectVert } from '../shaders/objectVert';
import { sp4ghetFrag } from '../shaders/sp4ghetFrag';

export class Sp4ghet extends RaymarcherNode {
  public constructor() {
    super( sp4ghetFrag );

    this.children.push( new TransparentShell( {
      baseColor: [ 0.2, 0.9, 0.8 ],
      opacity: 0.1,
    } ) );

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
