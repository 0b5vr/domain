import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Geometry } from '../heck/Geometry';
import { HALF_SQRT_TWO } from '../utils/constants';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode } from '../heck/components/SceneNode';
import { ShaderRenderTarget } from './utils/ShaderRenderTarget';
import { TRIANGLE_STRIP_QUAD_3D, TRIANGLE_STRIP_QUAD_NORMAL, TRIANGLE_STRIP_QUAD_UV } from '@0b5vr/experimental';
import { createLightUniformsLambda } from './utils/createLightUniformsLambda';
import { depthFrag } from '../shaders/depthFrag';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { floorFrag } from '../shaders/floorFrag';
import { floorRoughnessFrag } from '../shaders/floorRoughnessFrag';
import { gl, glCat } from '../globals/canvas';
import { objectVert } from '../shaders/objectVert';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';

export class Floor extends SceneNode {
  public forward: Material;

  public constructor() {
    super();

    // -- entity for mesh --------------------------------------------------------------------------
    const meshNode = new SceneNode();
    this.children.push( meshNode );

    meshNode.transform.rotation = [ -HALF_SQRT_TWO, 0.0, 0.0, HALF_SQRT_TWO ];
    meshNode.transform.scale = [ 20.0, 20.0, 20.0 ];

    // -- create buffers ---------------------------------------------------------------------------
    const bufferPos = glCat.createBuffer();
    bufferPos.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_3D ) );

    const bufferNor = glCat.createBuffer();
    bufferNor.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_NORMAL ) );

    const bufferUv = glCat.createBuffer();
    bufferUv.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_UV ) );

    // -- create geometry --------------------------------------------------------------------------
    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( bufferPos, 0, 3 );
    geometry.vao.bindVertexbuffer( bufferNor, 1, 3 );
    geometry.vao.bindVertexbuffer( bufferUv, 2, 2 );

    geometry.count = 4;
    geometry.mode = gl.TRIANGLE_STRIP;

    // -- generate roughness map -------------------------------------------------------------------
    const targetRoughness = new ShaderRenderTarget( {
      width: 2048,
      height: 2048,
      filter: gl.LINEAR,
      material: new Material(
        quadVert,
        floorRoughnessFrag,
        { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
      ),
      name: process.env.DEV && 'Floor/roughness',
    } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/floorRoughnessFrag',
          ],
          () => {
            targetRoughness.material.replaceShader( quadVert, floorRoughnessFrag ).then( () => {
              targetRoughness.quad.drawImmediate();
            } );
          },
        );
      }
    }

    // -- create materials -------------------------------------------------------------------------
    const forward = this.forward = new Material(
      objectVert,
      floorFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );
    forward.addUniformTextures( 'samplerRoughness', targetRoughness.texture );

    const depth = new Material(
      objectVert,
      depthFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    this.children.push( createLightUniformsLambda( [ forward ] ) );

    const materials = { forward, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/objectVert',
            '../shaders/floorFrag',
          ],
          () => {
            forward.replaceShader( objectVert, floorFrag );
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
    meshNode.children.push( mesh );
  }

  public setMipmapMirrorTarget( mipmapMirrorTarget: BufferRenderTarget ): void {
    this.forward.addUniformTextures( 'samplerMirror', mipmapMirrorTarget.texture );
  }
}
