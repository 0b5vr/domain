import { BoundingBox } from './BoundingBox';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { RawVector3, quatFromAxisAngle, vecNormalize } from '@0b5vr/experimental';
import { createRaymarchCameraUniformsLambda } from './utils/createRaymarchCameraUniformsLambda';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { gl } from '../globals/canvas';
import { objectVert } from '../shaders/objectVert';
import { randomTexture } from '../globals/randomTexture';
import { sssBoxFrag } from '../shaders/sssBoxFrag';

export class SSSBox extends Entity {
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

    const forward = new Material(
      objectVert( { ...locations } ),
      sssBoxFrag( 'forward' ),
      {
        initOptions: { geometry, target: dummyRenderTarget },
        blend: [ gl.ONE, gl.ONE ],
      },
    );
    forward.addUniformTextures( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/objectVert',
            '../shaders/sssBoxFrag',
          ],
          () => {
            forward.replaceShader( objectVert( { ...locations } ), sssBoxFrag( 'forward' ) );
          },
        );
      }
    }

    const lambdaRaymarchCameraUniforms = createRaymarchCameraUniformsLambda( [ forward ] );

    const mesh = new Mesh( {
      geometry,
      materials: { forward },
      name: process.env.DEV && 'mesh',
    } );
    this.transform.scale = [ 1.0, 1.0, 1.0 ];
    mesh.depthTest = false;
    mesh.depthWrite = false;

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
      lambdaRaymarchCameraUniforms,
      mesh,
    ];

    // -- bounding box -----------------------------------------------------------------------------
    const boundingBox = new BoundingBox();
    boundingBox.transform.scale = [ 0.5, 0.5, 0.5 ];
    this.children.push( boundingBox );
  }
}
