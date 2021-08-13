import { Entity, EntityOptions } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh, MeshCull } from '../heck/components/Mesh';
import { Quaternion, TRIANGLE_STRIP_QUAD_3D, TRIANGLE_STRIP_QUAD_NORMAL, TRIANGLE_STRIP_QUAD_UV, Vector3 } from '@fms-cat/experimental';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl, glCat } from '../globals/canvas';
import objectVert from '../shaders/object.vert';
import uvFrag from '../shaders/uv.frag';

export class Plane extends Entity {
  public constructor( options?: EntityOptions ) {
    super( options );

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
    const forward = new Material(
      objectVert,
      uvFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );
    forward.addUniform( 'color', '4f', 1.0, 1.0, 1.0, 1.0 );

    const materials = { forward };

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( { geometry, materials } );
    mesh.cull = MeshCull.None;

    // -- speen ------------------------------------------------------------------------------------
    const speenAxis = new Vector3( [ 0.0, 1.0, 0.0 ] ).normalized;

    const lambdaSpeen = new Lambda( {
      onUpdate: ( { time } ) => {
        this.transform.rotation = Quaternion.fromAxisAngle( speenAxis, time );
      },
      name: process.env.DEV && 'speen',
    } );

    // -- components -------------------------------------------------------------------------------
    this.components = [ lambdaSpeen, mesh ];
  }
}
