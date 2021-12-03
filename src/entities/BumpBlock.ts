import { RaymarcherNode } from './utils/RaymarcherNode';
import { asphaltTextureTarget } from './Asphalt';
import { bumpBlockFrag } from '../shaders/bumpBlockFrag';
import { objectVert } from '../shaders/objectVert';

export class BumpBlock extends RaymarcherNode {
  public constructor() {
    super( bumpBlockFrag );

    this.materials.deferred.addUniformTextures( 'textureSurface', asphaltTextureTarget.texture );
    this.materials.depth.addUniformTextures( 'textureSurface', asphaltTextureTarget.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/bumpBlockFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, bumpBlockFrag( 'deferred' ) );
            depth.replaceShader( objectVert, bumpBlockFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
