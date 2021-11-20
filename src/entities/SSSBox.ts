import { RaymarcherNode } from './utils/RaymarcherNode';
import { objectVert } from '../shaders/objectVert';
import { sssBoxFrag } from '../shaders/sssBoxFrag';

export class SSSBox extends RaymarcherNode {
  public constructor() {
    super( sssBoxFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/sssBoxFrag',
          ],
          () => {
            const { cubemap, deferred, depth } = this.materials;

            cubemap.replaceShader( objectVert, sssBoxFrag( 'forward' ) );
            deferred.replaceShader( objectVert, sssBoxFrag( 'deferred' ) );
            depth.replaceShader( objectVert, sssBoxFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
