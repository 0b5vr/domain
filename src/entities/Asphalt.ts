import { RaymarcherEntity } from './utils/RaymarcherEntity';
import { asphaltFrag } from '../shaders/asphaltFrag';

export class Asphalt extends RaymarcherEntity {
  public constructor() {
    super( asphaltFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/asphaltFrag',
          ],
          () => {
            const { cubemap, deferred, depth } = this.materials;
            const vert = this.vert;

            cubemap.replaceShader( vert, asphaltFrag( 'forward' ) );
            deferred.replaceShader( vert, asphaltFrag( 'deferred' ) );
            depth.replaceShader( vert, asphaltFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
