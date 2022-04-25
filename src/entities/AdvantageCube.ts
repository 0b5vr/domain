import { MTL_PBR_ROUGHNESS_METALLIC } from '../shaders/deferredConstants';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode } from '../heck/components/SceneNode';
import { ShaderRenderTarget } from './utils/ShaderRenderTarget';
import { advantageCubeTextureFrag } from '../shaders/advantageCubeTextureFrag';
import { deferredTextureFrag } from '../shaders/deferredTextureFrag';
import { depthFrag } from '../shaders/depthFrag';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { psxVert } from '../shaders/psxVert';
import { quadVert } from '../shaders/quadVert';

export class AdvantageCube extends SceneNode {
  public constructor() {
    super();

    // -- target -----------------------------------------------------------------------------------
    const advantageCubeTextureTarget = new ShaderRenderTarget(
      32,
      32,
      advantageCubeTextureFrag,
      process.env.DEV && 'AdvantageCube/texture',
    );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/advantageCubeTextureFrag',
          ],
          () => {
            advantageCubeTextureTarget.material.replaceShader(
              quadVert,
              advantageCubeTextureFrag,
            ).then( () => {
              advantageCubeTextureTarget.quad.drawImmediate();
            } );
          },
        );
      }
    }

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } ).geometry;

    const deferred = new Material(
      psxVert,
      deferredTextureFrag,
      {
        initOptions: { geometry: geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    deferred.addUniform( 'mtlKind', '1f', MTL_PBR_ROUGHNESS_METALLIC );
    deferred.addUniform( 'mtlParams', '4f', 1.0, 0.0, 0.5, 0.0 );
    deferred.addUniformTextures( 'sampler0', advantageCubeTextureTarget.texture );

    const depth = new Material(
      psxVert,
      depthFrag,
      {
        initOptions: { geometry: geometry, target: dummyRenderTarget },
      },
    );

    const mesh = new Mesh( {
      geometry: geometry,
      materials: { deferred: deferred, depth },
    } );

    if ( process.env.DEV ) {
      module.hot?.accept(
        [ '../shaders/deferredTextureFrag', '../shaders/psxVert' ],
        () => {
          deferred.replaceShader( psxVert, deferredTextureFrag );
        },
      );
    }

    // -- components -------------------------------------------------------------------------------
    this.children = [
      mesh,
    ];

    if ( process.env.DEV ) {
      mesh.name = 'mesh';
    }
  }
}
