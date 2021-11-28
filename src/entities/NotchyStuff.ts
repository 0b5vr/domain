import { MTL_PBR_ROUGHNESS_METALLIC } from '../shaders/deferredShadeFrag';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode } from '../heck/components/SceneNode';
import { TransparentShell } from './TransparentShell';
import { depthFrag } from '../shaders/depthFrag';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { glCat } from '../globals/canvas';
import { notchyStuffFrag } from '../shaders/notchyStuffFrag';
import { notchyStuffVert } from '../shaders/notchyStuffVert';

const instances = 2048;

export class NotchyStuff extends SceneNode {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const { geometry } = genCube();

    const bufferInstanceId = glCat.createBuffer();
    bufferInstanceId.setVertexbuffer( ( () => {
      const ret = new Float32Array( instances );
      for ( let i = 0; i < instances; i ++ ) {
        ret[ i ] = i / instances;
      }
      return ret;
    } )() );

    geometry.vao.bindVertexbuffer( bufferInstanceId, 3, 1, 1 );

    geometry.primcount = instances;

    // -- material ---------------------------------------------------------------------------------
    const deferred = new Material(
      notchyStuffVert,
      notchyStuffFrag,
      {
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    deferred.addUniform( 'color', '4f', 1.0, 1.0, 1.0, 1.0 );
    deferred.addUniform( 'mtlKind', '1f', MTL_PBR_ROUGHNESS_METALLIC );
    deferred.addUniform( 'mtlParams', '4f', 1.0, 0.0, 0.0, 0.0 );

    const depth = new Material(
      notchyStuffVert,
      depthFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    if ( process.env.DEV ) {
      module.hot?.accept(
        [
          '../shaders/notchyStuffVert',
          '../shaders/notchyStuffFrag',
        ],
        () => {
          deferred.replaceShader( notchyStuffVert, notchyStuffFrag );
          depth.replaceShader( notchyStuffVert, depthFrag );
        },
      );
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials: { deferred: deferred, depth },
    } );

    // -- shell ------------------------------------------------------------------------------------
    const shell = new TransparentShell( {
      opacity: 0.03,
      roughness: 0.1,
      roughnessNoise: 0.1,
    } );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      mesh,
      shell,
    ];

    if ( process.env.DEV ) {
      mesh.name = 'mesh';
    }
  }
}
