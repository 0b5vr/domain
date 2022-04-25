import { MTL_PBR_ROUGHNESS_METALLIC } from '../shaders/deferredConstants';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode } from '../heck/components/SceneNode';
import { deferredColorFrag } from '../shaders/deferredColorFrag';
import { depthFrag } from '../shaders/depthFrag';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { objectVert } from '../shaders/objectVert';

export class SingleStep extends SceneNode {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } ).geometry;

    const deferred = new Material(
      objectVert,
      deferredColorFrag,
      {
        initOptions: { geometry: geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    deferred.addUniform( 'color', '4f', 1.0, 1.0, 1.0, 1.0 );
    deferred.addUniform( 'mtlKind', '1f', MTL_PBR_ROUGHNESS_METALLIC );
    deferred.addUniform( 'mtlParams', '4f', 1.0, 0.0, 0.0, 0.0 );

    const depth = new Material(
      objectVert,
      depthFrag,
      {
        initOptions: { geometry: geometry, target: dummyRenderTarget },
      },
    );

    const mesh = new Mesh( {
      geometry: geometry,
      materials: { deferred: deferred, depth },
    } );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      mesh,
    ];

    if ( process.env.DEV ) {
      mesh.name = 'mesh';
    }
  }
}
