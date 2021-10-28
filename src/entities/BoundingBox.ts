import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode } from '../heck/components/SceneNode';
import { boundingBoxFrag } from '../shaders/boundingBoxFrag';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl, glCat } from '../globals/canvas';
import { objectVert } from '../shaders/objectVert';

export class BoundingBox extends SceneNode {
  public constructor() {
    super();

    // -- create buffers ---------------------------------------------------------------------------
    const arrayPos = [
      -1, -1, -1,
      1, -1, -1,
      -1, 1, -1,
      1, 1, -1,
      -1, -1, 1,
      1, -1, 1,
      -1, 1, 1,
      1, 1, 1,
    ];
    const arrayInd = [
      0, 1,
      0, 2,
      0, 4,
      1, 3,
      1, 5,
      2, 3,
      2, 6,
      3, 7,
      4, 5,
      4, 6,
      5, 7,
      6, 7,
    ];

    const bufferPos = glCat.createBuffer();
    bufferPos.setVertexbuffer( new Float32Array( arrayPos ) );

    const bufferInd = glCat.createBuffer();
    bufferInd.setIndexbuffer( new Uint16Array( arrayInd ) );

    // -- create geometry --------------------------------------------------------------------------
    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( bufferPos, 0, 3 );
    geometry.vao.bindIndexbuffer( bufferInd );

    geometry.count = 24;
    geometry.mode = gl.LINES;
    geometry.indexType = gl.UNSIGNED_SHORT;

    // -- create materials -------------------------------------------------------------------------
    const locations = {
      locationPosition: 0,
    };

    const forward = new Material(
      objectVert( { ...locations } ),
      boundingBoxFrag( 'forward' ),
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    const depth = new Material(
      objectVert( { ...locations } ),
      boundingBoxFrag( 'shadow' ),
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    const materials = { forward, cubemap: forward, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/objectVert',
            '../shaders/boundingBoxFrag',
          ],
          () => {
            forward.replaceShader( objectVert( { ...locations } ), boundingBoxFrag( 'forward' ) );
            depth.replaceShader( objectVert( { ...locations } ), boundingBoxFrag( 'shadow' ) );
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
    this.children.push( mesh );
  }
}
