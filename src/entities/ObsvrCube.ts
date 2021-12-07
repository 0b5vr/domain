import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode } from '../heck/components/SceneNode';
import { auto } from '../globals/automaton';
import { depthFrag } from '../shaders/depthFrag';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { glCat } from '../globals/canvas';
import { obsvrCubeFrag } from '../shaders/obsvrCubeFrag';
import { obsvrCubeVert } from '../shaders/obsvrCubeVert';

export class ObsvrCube extends SceneNode {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const { geometry } = genCube();

    const bufferInstanceId = glCat.createBuffer();
    let i = 0;

    bufferInstanceId.setVertexbuffer( ( () => {
      const ret = new Float32Array( 16 * 16 * 6 * 3 );
      for ( let iface = 0; iface < 6; iface ++ ) {
        for ( let iy = 0; iy < 16; iy ++ ) {
          for ( let ix = 0; ix < 16; ix ++ ) {
            ret[ i ++ ] = ( ix + 0.5 ) / 16.0 - 0.5;
            ret[ i ++ ] = ( iy + 0.5 ) / 16.0 - 0.5;
            ret[ i ++ ] = iface;
          }
        }
      }
      return ret;
    } )() );

    geometry.vao.bindVertexbuffer( bufferInstanceId, 3, 3, 1 );

    geometry.primcount = 16 * 16 * 6;

    // -- material ---------------------------------------------------------------------------------
    const deferred = new Material(
      obsvrCubeVert,
      obsvrCubeFrag,
      {
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const depth = new Material(
      obsvrCubeVert,
      depthFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    auto( '0b5vr/glow', ( { value } ) => (
      deferred.addUniform( 'glow', '1f', value )
    ) );

    if ( process.env.DEV ) {
      module.hot?.accept(
        [
          '../shaders/obsvrCubeVert',
          '../shaders/obsvrCubeFrag',
        ],
        () => {
          deferred.replaceShader( obsvrCubeVert, obsvrCubeFrag );
          depth.replaceShader( obsvrCubeVert, depthFrag );
        },
      );
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials: { deferred: deferred, depth },
    } );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      mesh,
    ];

    if ( process.env.DEV ) {
      mesh.name = 'mesh';
    }
  }
}
