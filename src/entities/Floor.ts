import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { HALF_SQRT_TWO } from '../utils/constants';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { RawMatrix4, TRIANGLE_STRIP_QUAD_3D, TRIANGLE_STRIP_QUAD_NORMAL } from '@0b5vr/experimental';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { floorFrag } from '../shaders/floorFrag';
import { gl, glCat } from '../globals/canvas';
import { objectVert } from '../shaders/objectVert';

export class Floor extends Entity {
  public mirrorCameraEntity: Entity;
  public primaryCameraEntity: Entity;
  public primaryCamera: PerspectiveCamera;
  public mirrorCamera: PerspectiveCamera;
  public mirrorTarget: BufferRenderTarget;

  public constructor( primaryCameraEntity: Entity, primaryCamera: PerspectiveCamera ) {
    super();

    // -- funky part -------------------------------------------------------------------------------
    this.mirrorCameraEntity = new Entity( {
      name: process.env.DEV && 'mirrorCameraEntity',
    } );
    this.children.push( this.mirrorCameraEntity );

    this.primaryCameraEntity = primaryCameraEntity;
    this.primaryCamera = primaryCamera;
    this.mirrorTarget = new BufferRenderTarget( {
      width: 1280,
      height: 720,
      name: process.env.DEV && 'Floor/mirrorTarget',
    } );

    this.mirrorCamera = new PerspectiveCamera( {
      materialTag: 'forward',
      renderTarget: this.mirrorTarget,
      near: this.primaryCamera.near,
      far: this.primaryCamera.far,
      fov: this.primaryCamera.fov,
      scenes: this.primaryCamera.scenes,
    } );
    this.mirrorCameraEntity.components.push( this.mirrorCamera );

    this.components.push( new Lambda( {
      onUpdate: () => {
        const camTrans = this.mirrorCameraEntity.transform;
        camTrans.matrix = this.primaryCameraEntity.transform.matrix.concat() as RawMatrix4;

        camTrans.matrix[ 0 ] *= -1.0;
        camTrans.matrix[ 4 ] *= -1.0;
        camTrans.matrix[ 8 ] *= -1.0;
        camTrans.matrix[ 1 ] *= -1.0;
        camTrans.matrix[ 5 ] *= -1.0;
        camTrans.matrix[ 9 ] *= -1.0;
        camTrans.matrix[ 13 ] *= -1.0;
      },
    } ) );

    // -- entity for mesh --------------------------------------------------------------------------
    const meshEntity = new Entity();
    this.children.push( meshEntity );

    meshEntity.transform.rotation = [ -HALF_SQRT_TWO, 0.0, 0.0, HALF_SQRT_TWO ];
    meshEntity.transform.scale = [ 5.0, 5.0, 5.0 ];

    // -- create buffers ---------------------------------------------------------------------------
    const bufferPos = glCat.createBuffer();
    bufferPos.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_3D ) );

    const bufferNor = glCat.createBuffer();
    bufferNor.setIndexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_NORMAL ) );

    // -- create geometry --------------------------------------------------------------------------
    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( bufferPos, 0, 3 );
    geometry.vao.bindVertexbuffer( bufferNor, 1, 3 );

    geometry.count = 4;
    geometry.mode = gl.TRIANGLE_STRIP;

    // -- create materials -------------------------------------------------------------------------
    const locations = {
      locationPosition: 0,
      locationNormal: 1,
      locationUv: 2,
    };

    const forward = new Material(
      objectVert( { ...locations } ),
      floorFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    forward.addUniformTextures( 'samplerMirror', this.mirrorTarget.texture );

    const materials = { forward };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/objectVert',
            '../shaders/floorFrag',
          ],
          () => {
            forward.replaceShader( objectVert( { ...locations } ), floorFrag );
          },
        );
      }
    }

    // -- create meshes ----------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'mesh',
    } );
    meshEntity.components.push( mesh );
  }
}
