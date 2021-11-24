import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { SceneNode } from '../../heck/components/SceneNode';
import { createLightUniformsLambda } from './createLightUniformsLambda';
import { createRaymarchCameraUniformsLambda } from './createRaymarchCameraUniformsLambda';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../../globals/dummyRenderTarget';
import { genCube } from '../../geometries/genCube';
import { objectVert } from '../../shaders/objectVert';
import { randomTexture } from '../../globals/randomTexture';

export class RaymarcherNode extends SceneNode {
  public materials: {
    deferred: Material,
    depth: Material,
  };

  public constructor(
    builder: ( tag: 'deferred' | 'depth' ) => string,
  ) {
    super();

    // -- render -----------------------------------------------------------------------------------
    const { geometry } = genCube( { dimension: [ 0.55, 0.55, 0.55 ] } );

    const deferred = new Material(
      objectVert,
      builder( 'deferred' ),
      {
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    deferred.addUniformTextures( 'samplerRandom', randomTexture.texture );

    const depth = new Material(
      objectVert,
      builder( 'depth' ),
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );
    depth.addUniformTextures( 'samplerRandom', randomTexture.texture );

    const lambdaLightUniforms = createLightUniformsLambda( [
      deferred,
    ] );

    const lambdaRaymarchCameraUniforms = createRaymarchCameraUniformsLambda( [
      deferred,
      depth,
    ] );

    const materials = this.materials = { depth, deferred };

    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'mesh',
    } );
    this.transform.scale = [ 1.0, 1.0, 1.0 ];

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lambdaLightUniforms,
      lambdaRaymarchCameraUniforms,
      mesh,
    ];

    // -- done ---------------------------------------------------------------------------------------
    return this;
  }

  public forEachMaterials( fn: ( material: Material ) => void ): void {
    Object.values( this.materials ).map( ( material ) => fn( material ) );
  }
}
