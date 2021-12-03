import { BoundingBox } from './BoundingBox';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../shaders/deferredShadeFrag';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode } from '../heck/components/SceneNode';
import { TAU } from '../utils/constants';
import { TransparentShell } from './TransparentShell';
import { auto } from '../globals/automaton';
import { deferredColorFrag } from '../shaders/deferredColorFrag';
import { depthFrag } from '../shaders/depthFrag';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { objectVert } from '../shaders/objectVert';
import { quatFromAxisAngle } from '@0b5vr/experimental';

export class WebpackCube extends SceneNode {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const geometryCore = genCube( { dimension: [ 0.25, 0.25, 0.25 ] } ).geometry;

    const deferredCore = new Material(
      objectVert,
      deferredColorFrag,
      {
        initOptions: { geometry: geometryCore, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    deferredCore.addUniform( 'color', '4f', 0.005, 0.109, 0.311, 1.0 );
    deferredCore.addUniform( 'mtlKind', '1f', MTL_PBR_ROUGHNESS_METALLIC );
    deferredCore.addUniform( 'mtlParams', '4f', 0.8, 0.0, 0.0, 0.0 );

    const depth = new Material(
      objectVert,
      depthFrag,
      {
        initOptions: { geometry: geometryCore, target: dummyRenderTarget },
      },
    );

    const meshCore = new Mesh( {
      geometry: geometryCore,
      materials: { deferred: deferredCore, depth },
    } );

    // -- shell ------------------------------------------------------------------------------------
    const shell = new TransparentShell( {
      baseColor: [ 0.272, 0.680, 0.949 ],
      roughness: 0.2,
      roughnessNoise: 0.0,
      opacity: 0.1,
    } );

    // -- strokes ----------------------------------------------------------------------------------
    const strokeCore = new BoundingBox( { dashRatio: 0.0 } );
    strokeCore.transform.scale = [ 0.255, 0.255, 0.255 ];

    const strokeShell = new BoundingBox( { dashRatio: 0.0 } );
    strokeShell.transform.scale = [ 0.5, 0.5, 0.5 ];

    // -- components -------------------------------------------------------------------------------
    const nodeCore = new SceneNode();
    nodeCore.children = [ meshCore, strokeCore ];

    auto( 'webpackCube/coreRot', ( { value } ) => {
      nodeCore.transform.rotation = quatFromAxisAngle( [ 0, 1, 0 ], TAU * value );
    } );

    this.children = [
      nodeCore,
      shell,
      strokeShell,
    ];

    if ( process.env.DEV ) {
      meshCore.name = 'meshCore';
      nodeCore.name = 'nodeCore';
      shell.name = 'shell';
      strokeCore.name = 'strokeCore';
      strokeShell.name = 'strokeShell';
    }
  }
}
