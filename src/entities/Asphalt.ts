import { RaymarcherNode } from './utils/RaymarcherNode';
import { ShaderRenderTarget } from './utils/ShaderRenderTarget';
import { asphaltFrag } from '../shaders/asphaltFrag';
import { asphaltSurfaceFrag } from '../shaders/asphaltSurfaceFrag';
import { objectVert } from '../shaders/objectVert';
import { quadVert } from '../shaders/quadVert';

export const asphaltTextureTarget = new ShaderRenderTarget(
  1024,
  1024,
  asphaltSurfaceFrag,
  process.env.DEV && 'Asphalt/voronoi',
);

if ( process.env.DEV ) {
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/asphaltSurfaceFrag',
      ],
      () => {
        asphaltTextureTarget.material.replaceShader( quadVert, asphaltSurfaceFrag ).then( () => {
          asphaltTextureTarget.quad.drawImmediate();
        } );
      },
    );
  }
}

export class Asphalt extends RaymarcherNode {
  public constructor() {
    super( asphaltFrag );

    this.forEachMaterials( ( material ) => {
      material.addUniformTextures( 'samplerSurface', asphaltTextureTarget.texture );
    } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/asphaltFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, asphaltFrag( 'deferred' ) );
            depth.replaceShader( objectVert, asphaltFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
