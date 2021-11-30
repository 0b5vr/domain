import { RaymarcherNode } from './utils/RaymarcherNode';
import { ShaderRenderTarget } from './utils/ShaderRenderTarget';
import { objectVert } from '../shaders/objectVert';
import { quadVert } from '../shaders/quadVert';
import { sierpinskiFrag } from '../shaders/sierpinskiFrag';
import { sierpinskiPatternFrag } from '../shaders/sierpinskiPatternFrag';

const sierpinskiPatternTextureTarget = new ShaderRenderTarget(
  64,
  64,
  sierpinskiPatternFrag,
  process.env.DEV && 'Sierpinski/pattern',
);

if ( process.env.DEV ) {
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/sierpinskiPatternFrag',
      ],
      () => {
        sierpinskiPatternTextureTarget.material.replaceShader(
          quadVert,
          sierpinskiPatternFrag,
        ).then( () => {
          sierpinskiPatternTextureTarget.quad.drawImmediate();
        } );
      },
    );
  }
}

export class Sierpinski extends RaymarcherNode {
  public constructor() {
    super( sierpinskiFrag );

    this.materials.deferred.addUniformTextures(
      'samplerPattern',
      sierpinskiPatternTextureTarget.texture,
    );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/sierpinskiFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, sierpinskiFrag( 'deferred' ) );
            depth.replaceShader( objectVert, sierpinskiFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
