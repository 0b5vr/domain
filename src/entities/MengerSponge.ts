import { BoundingBox } from './BoundingBox';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { RawVector3, quatFromAxisAngle, vecNormalize } from '@0b5vr/experimental';
import { createLightUniformsLambda } from './utils/createLightUniformsLambda';
import { createRaymarchCameraUniformsLambda } from './utils/createRaymarchCameraUniformsLambda';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { mengerSpongeFrag } from '../shaders/mengerSpongeFrag';
import { objectVert } from '../shaders/objectVert';
import { randomTexture } from '../globals/randomTexture';

export class MengerSponge extends Entity {
  public constructor() {
    super();

    // -- render -----------------------------------------------------------------------------------
    const cube = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = cube.indexType;

    const locations = {
      locationPosition: 0,
    };

    const cubemap = new Material(
      objectVert( { ...locations } ),
      mengerSpongeFrag( 'forward' ),
      {
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    cubemap.addUniformTextures( 'samplerRandom', randomTexture.texture );

    const deferred = new Material(
      objectVert( { ...locations } ),
      mengerSpongeFrag( 'deferred' ),
      {
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    deferred.addUniformTextures( 'samplerRandom', randomTexture.texture );

    const depth = new Material(
      objectVert( { ...locations } ),
      mengerSpongeFrag( 'depth' ),
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );
    depth.addUniformTextures( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/objectVert',
            '../shaders/mengerSpongeFrag',
          ],
          () => {
            cubemap.replaceShader( objectVert( { ...locations } ), mengerSpongeFrag( 'forward' ) );
            deferred.replaceShader( objectVert( { ...locations } ), mengerSpongeFrag( 'deferred' ) );
            depth.replaceShader( objectVert( { ...locations } ), mengerSpongeFrag( 'depth' ) );
          },
        );
      }
    }

    const lambdaLightUniforms = createLightUniformsLambda( [
      cubemap,
      deferred,
    ] );

    const lambdaRaymarchCameraUniforms = createRaymarchCameraUniformsLambda( [
      cubemap,
      deferred,
      depth,
    ] );

    const mesh = new Mesh( {
      geometry,
      materials: { depth, deferred, cubemap },
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
    this.components = [
      lambdaSpeen,
      lambdaLightUniforms,
      lambdaRaymarchCameraUniforms,
      mesh,
    ];

    // -- bounding box -----------------------------------------------------------------------------
    const boundingBox = new BoundingBox();
    boundingBox.transform.scale = [ 0.5, 0.5, 0.5 ];
    this.children.push( boundingBox );
  }
}
