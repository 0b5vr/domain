import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode } from '../heck/components/SceneNode';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { genCylinder } from '../geometries/genCylinder';
import { gl } from '../globals/canvas';
import { objectVert } from '../shaders/objectVert';
import { simpleDeferredFrag } from '../shaders/simpleDeferredFrag';

export class GeometryTestbed extends SceneNode {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const geomSource = genCylinder();

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( geomSource.position, 0, 3 );
    geometry.vao.bindVertexbuffer( geomSource.normal, 1, 3 );
    geometry.vao.bindVertexbuffer( geomSource.uv, 2, 2 );
    geometry.vao.bindIndexbuffer( geomSource.index );

    geometry.count = geomSource.count;
    geometry.mode = geomSource.mode;
    geometry.indexType = geomSource.indexType;

    // -- materials --------------------------------------------------------------------------------
    const locations = {
      locationPosition: 0,
      locationNormal: 1,
      locationUv: 2,
    };

    const deferred = new Material(
      objectVert( { ...locations } ),
      simpleDeferredFrag( 'deferred' ),
      {
        initOptions: { geometry: geometry, target: dummyRenderTarget },
        blend: [ gl.ONE, gl.ONE ],
      },
    );

    const depth = new Material(
      objectVert( { ...locations } ),
      simpleDeferredFrag( 'depth' ),
      {
        initOptions: { geometry: geometry, target: dummyRenderTarget },
        blend: [ gl.ONE, gl.ONE ],
      },
    );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/objectVert',
            '../shaders/simpleDeferredFrag',
          ],
          () => {
            deferred.replaceShader(
              objectVert( { ...locations } ),
              simpleDeferredFrag( 'deferred' ),
            );

            depth.replaceShader(
              objectVert( { ...locations } ),
              simpleDeferredFrag( 'depth' ),
            );
          },
        );
      }
    }

    const materials = { deferred };

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'mesh',
    } );

    if ( process.env.DEV ) {
      mesh.name = 'mesh';
    }

    // -- components -------------------------------------------------------------------------------
    this.children = [
      mesh,
    ];
  }
}
