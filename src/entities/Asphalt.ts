import { Material } from '../heck/Material';
import { RaymarcherNode } from './utils/RaymarcherNode';
import { ShaderRenderTarget } from './utils/ShaderRenderTarget';
import { asphaltFrag } from '../shaders/asphaltFrag';
import { asphaltSurfaceFrag } from '../shaders/asphaltSurfaceFrag';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl } from '../globals/canvas';
import { objectVert } from '../shaders/objectVert';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';

export class Asphalt extends RaymarcherNode {
  public constructor() {
    super( asphaltFrag );

    const targetVoronoi = new ShaderRenderTarget( {
      width: 1024,
      height: 1024,
      filter: gl.LINEAR,
      material: new Material(
        quadVert,
        asphaltSurfaceFrag,
        { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
      ),
      name: process.env.DEV && 'Asphalt/voronoi',
    } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/asphaltSurfaceFrag',
          ],
          () => {
            targetVoronoi.material.replaceShader( quadVert, asphaltSurfaceFrag ).then( () => {
              targetVoronoi.quad.drawImmediate();
            } );
          },
        );
      }
    }

    this.forEachMaterials( ( material ) => {
      material.addUniformTextures( 'samplerSurface', targetVoronoi.texture );
    } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/asphaltFrag',
          ],
          () => {
            const { cubemap, deferred, depth } = this.materials;

            cubemap.replaceShader( objectVert, asphaltFrag( 'forward' ) );
            deferred.replaceShader( objectVert, asphaltFrag( 'deferred' ) );
            depth.replaceShader( objectVert, asphaltFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
