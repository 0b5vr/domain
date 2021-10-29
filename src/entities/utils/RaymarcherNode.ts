import { BoundingBox } from '../BoundingBox';
import { Geometry } from '../../heck/Geometry';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { RawVector3, quatFromAxisAngle, vecNormalize } from '@0b5vr/experimental';
import { SceneNode } from '../../heck/components/SceneNode';
import { createLightUniformsLambda } from './createLightUniformsLambda';
import { createRaymarchCameraUniformsLambda } from './createRaymarchCameraUniformsLambda';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../../globals/dummyRenderTarget';
import { genCube } from '../../geometries/genCube';
import { objectVert } from '../../shaders/objectVert';
import { randomTexture } from '../../globals/randomTexture';

export class RaymarcherNode extends SceneNode {
  public materials: {
    cubemap: Material,
    deferred: Material,
    depth: Material,
  };

  public vert: string;

  public constructor(
    builder: ( tag: 'forward' | 'deferred' | 'depth' ) => string,
  ) {
    super();

    // -- render -----------------------------------------------------------------------------------
    const cube = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = cube.indexType;

    const vert = this.vert = objectVert( {
      locationPosition: 0,
    } );

    const cubemap = new Material(
      vert,
      builder( 'forward' ),
      {
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    cubemap.addUniformTextures( 'samplerRandom', randomTexture.texture );

    const deferred = new Material(
      vert,
      builder( 'deferred' ),
      {
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    deferred.addUniformTextures( 'samplerRandom', randomTexture.texture );

    const depth = new Material(
      vert,
      builder( 'depth' ),
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );
    depth.addUniformTextures( 'samplerRandom', randomTexture.texture );

    const lambdaLightUniforms = createLightUniformsLambda( [
      cubemap,
      deferred,
    ] );

    const lambdaRaymarchCameraUniforms = createRaymarchCameraUniformsLambda( [
      cubemap,
      deferred,
      depth,
    ] );

    const materials = this.materials = { depth, deferred, cubemap };

    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'mesh',
    } );
    this.transform.scale = [ 1.0, 1.0, 1.0 ];

    // -- speen ------------------------------------------------------------------------------------
    const speenAxis = vecNormalize( [ 1.0, 1.0, 1.0 ] ) as RawVector3;

    const lambdaSpeen = new Lambda( {
      onUpdate: ( { time } ) => {
        this.transform.rotation = quatFromAxisAngle( speenAxis, 0.1 * time );
      },
      name: process.env.DEV && 'speen',
    } );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lambdaSpeen,
      lambdaLightUniforms,
      lambdaRaymarchCameraUniforms,
      mesh,
    ];

    // -- bounding box -----------------------------------------------------------------------------
    const boundingBox = new BoundingBox();
    boundingBox.transform.scale = [ 0.5, 0.5, 0.5 ];
    this.children.push( boundingBox );

    // -- done ---------------------------------------------------------------------------------------
    return this;
  }

  public forEachMaterials( fn: ( material: Material ) => void ): void {
    Object.values( this.materials ).map( ( material ) => fn( material ) );
  }
}
