import { RaymarcherNode } from './utils/RaymarcherNode';
import { ShaderRenderTarget } from './utils/ShaderRenderTarget';
import { auto } from '../globals/automaton';
import { cubeRootFrag } from '../shaders/cubeRootFrag';
import { cubeRootTextureFrag } from '../shaders/cubeRootTextureFrag';
import { objectVert } from '../shaders/objectVert';
import { quadVert } from '../shaders/quadVert';

const cubeRootTextureTarget = new ShaderRenderTarget(
  1024,
  1024,
  cubeRootTextureFrag,
  process.env.DEV && 'CubeRoot/texture',
);

if ( process.env.DEV ) {
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/cubeRootTextureFrag',
      ],
      () => {
        cubeRootTextureTarget.material.replaceShader(
          quadVert,
          cubeRootTextureFrag,
        ).then( () => {
          cubeRootTextureTarget.quad.drawImmediate();
        } );
      },
    );
  }
}

export class CubeRoot extends RaymarcherNode {
  public constructor() {
    super( cubeRootFrag );

    this.forEachMaterials( ( material ) => {
      material.addUniformTextures( 'samplerSurface', cubeRootTextureTarget.texture );
    } );

    auto( 'cubeRoot/level', ( { value } ) => {
      this.materials.deferred.addUniform( 'level', '1f', value );
      this.materials.depth.addUniform( 'level', '1f', value );
    } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/cubeRootFrag',
          ],
          () => {
            const { deferred, depth } = this.materials;

            deferred.replaceShader( objectVert, cubeRootFrag( 'deferred' ) );
            depth.replaceShader( objectVert, cubeRootFrag( 'depth' ) );
          },
        );
      }
    }
  }
}
