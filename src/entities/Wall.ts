import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode, SceneNodeOptions } from '../heck/components/SceneNode';
import { TRIANGLE_STRIP_QUAD_3D, TRIANGLE_STRIP_QUAD_NORMAL, TRIANGLE_STRIP_QUAD_UV } from '@0b5vr/experimental';
import { depthFrag } from '../shaders/depthFrag';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { gl, glCat } from '../globals/canvas';
import { objectVert } from '../shaders/objectVert';
import { wallFrag } from '../shaders/wallFrag';

export class Wall extends SceneNode {
  public constructor( options?: SceneNodeOptions ) {
    super( options );

    this.transform.scale = [ 8.0, 8.0, 8.0 ];

    // -- geometry ---------------------------------------------------------------------------------
    const bufferPos = glCat.createBuffer();
    bufferPos.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_3D ) );

    const bufferNormal = glCat.createBuffer();
    bufferNormal.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_NORMAL ) );

    const bufferUv = glCat.createBuffer();
    bufferUv.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_UV ) );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( bufferPos, 0, 3 );
    geometry.vao.bindVertexbuffer( bufferNormal, 1, 3 );
    geometry.vao.bindVertexbuffer( bufferUv, 2, 2 );

    geometry.count = 4;
    geometry.mode = gl.TRIANGLE_STRIP;

    // -- material ---------------------------------------------------------------------------------
    const deferred = new Material(
      objectVert,
      wallFrag,
      {
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const depth = new Material(
      objectVert,
      depthFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    const materials = { deferred, depth };

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( { geometry, materials } );

    // -- components -------------------------------------------------------------------------------
    this.children = [ mesh ];
  }
}
