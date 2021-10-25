import { RaymarcherEntity } from './utils/RaymarcherEntity';
import { sp4ghetFrag } from '../shaders/sp4ghetFrag';

export class Sp4ghet extends RaymarcherEntity {
  public constructor() {
    super( sp4ghetFrag );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/sp4ghetFrag',
          ],
          () => {
            const { cubemap, deferred, depth } = this.materials;
            const vert = this.vert;

            cubemap.replaceShader( vert, sp4ghetFrag( 'forward' ) );
            deferred.replaceShader( vert, sp4ghetFrag( 'deferred' ) );
            depth.replaceShader( vert, sp4ghetFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
