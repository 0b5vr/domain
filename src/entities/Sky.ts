import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode } from '../heck/components/SceneNode';
import { TransparentShell } from './TransparentShell';
import { createLightUniformsLambda } from './utils/createLightUniformsLambda';
import { createRaymarchCameraUniformsLambda } from './utils/createRaymarchCameraUniformsLambda';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { objectVert } from '../shaders/objectVert';
import { randomTexture } from '../globals/randomTexture';
import { skyFrag } from '../shaders/skyFrag';

export class Sky extends SceneNode {
  public constructor() {
    super();

    const { geometry } = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } );

    const forward = new Material(
      objectVert,
      skyFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );
    forward.addUniformTextures( 'samplerRandom', randomTexture.texture );

    const lambdaLightUniforms = createLightUniformsLambda( [ forward ] );

    const lambdaRaymarchCameraUniforms = createRaymarchCameraUniformsLambda( [ forward ] );

    const mesh = new Mesh( {
      geometry,
      materials: { forward },
      name: process.env.DEV && 'mesh',
    } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/skyFrag',
          ],
          () => {
            forward.replaceShader( objectVert, skyFrag );
          },
        );
      }
    }

    const meshNode = new SceneNode();
    meshNode.transform.scale = [ 0.98, 0.98, 0.98 ];
    meshNode.children = [ mesh ];

    // -- shell ------------------------------------------------------------------------------------
    const shell = new TransparentShell( {
      opacity: 0.04,
      insideChildren: [ meshNode ],
    } );
    shell.transform.scale = [ 1.0, 1.0, 1.0 ];

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lambdaLightUniforms,
      lambdaRaymarchCameraUniforms,
      shell,
    ];
  }
}
