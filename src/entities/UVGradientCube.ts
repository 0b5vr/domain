import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode } from '../heck/components/SceneNode';
import { depthFrag } from '../shaders/depthFrag';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { objectVert } from '../shaders/objectVert';
import { randomTexture } from '../globals/randomTexture';
import { uvFrag } from '../shaders/uvFrag';

export class UVGradientCube extends SceneNode {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const { geometry } = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } );

    // -- materials --------------------------------------------------------------------------------
    const forward = new Material(
      objectVert,
      uvFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget },
      }
    );

    const depth = new Material(
      objectVert,
      depthFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget },
      }
    );

    forward.addUniformTextures( 'sampler0', randomTexture.texture );

    const materials = { forward, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/uvFrag',
          ],
          () => {
            forward.replaceShader(
              objectVert,
              uvFrag,
            );
          },
        );
      }
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'mesh',
    } );
    this.transform.scale = [ 1.0, 1.0, 1.0 ];

    // -- components -------------------------------------------------------------------------------
    this.children = [ mesh ];
  }
}
