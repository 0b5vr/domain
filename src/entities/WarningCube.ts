import { RaymarcherNode } from './utils/RaymarcherNode';
import { ShaderRenderTarget } from './utils/ShaderRenderTarget';
import { objectVert } from '../shaders/objectVert';
import { quadVert } from '../shaders/quadVert';
import { warningCubeFrag } from '../shaders/warningCubeFrag';
import { warningCubeSurfaceFrag } from '../shaders/warningCubeSurfaceFrag';

export const warningCubeTextureTarget = new ShaderRenderTarget(
  1024,
  warningCubeSurfaceFrag,
  process.env.DEV && 'Asphalt/voronoi',
);

if ( process.env.DEV ) {
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/asphaltSurfaceFrag',
      ],
      () => {
        warningCubeTextureTarget.material.replaceShader(
          quadVert,
          warningCubeSurfaceFrag,
        ).then( () => {
          warningCubeTextureTarget.quad.drawImmediate();
        } );
      },
    );
  }
}

export class WarningCube extends RaymarcherNode {
  public constructor() {
    super( warningCubeFrag );

    this.forEachMaterials( ( material ) => {
      material.addUniformTextures( 'samplerSurface', warningCubeTextureTarget.texture );
    } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/warningCubeFrag',
          ],
          () => {
            const { cubemap, deferred, depth } = this.materials;

            cubemap.replaceShader( objectVert, warningCubeFrag( 'forward' ) );
            deferred.replaceShader( objectVert, warningCubeFrag( 'deferred' ) );
            depth.replaceShader( objectVert, warningCubeFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
