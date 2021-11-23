import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode } from '../heck/components/SceneNode';
import { depthFrag } from '../shaders/depthFrag';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { infoFrag } from '../shaders/infoFrag';
import { objectVert } from '../shaders/objectVert';
import { wallTextureTarget } from './Wall';

export class Info extends SceneNode {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const geometryCore = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } ).geometry;

    const deferred = new Material(
      objectVert,
      infoFrag,
      {
        initOptions: { geometry: geometryCore, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    deferred.addUniformTextures( 'samplerTexture', wallTextureTarget.texture );

    const depth = new Material(
      objectVert,
      depthFrag,
      {
        initOptions: { geometry: geometryCore, target: dummyRenderTarget },
      },
    );

    const mesh = new Mesh( {
      geometry: geometryCore,
      materials: { deferred, depth },
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
