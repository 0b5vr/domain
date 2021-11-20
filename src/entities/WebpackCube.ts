import { BoundingBox } from './BoundingBox';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../shaders/deferredShadeFrag';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode } from '../heck/components/SceneNode';
import { createLightUniformsLambda } from './utils/createLightUniformsLambda';
import { deferredColorFrag } from '../shaders/deferredColorFrag';
import { depthFrag } from '../shaders/depthFrag';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { forwardPBRColor } from '../shaders/forwardPBRColor';
import { genCube } from '../geometries/genCube';
import { gl } from '../globals/canvas';
import { objectVert } from '../shaders/objectVert';

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
    const geometryShellFront = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } ).geometry;
    const geometryShellBack = genCube( { dimension: [ -0.5, -0.5, -0.5 ] } ).geometry;

    const forwardShell = new Material(
      objectVert,
      forwardPBRColor,
      {
        initOptions: { geometry: geometryShellFront, target: dummyRenderTarget },
        blend: [ gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA ],
      },
    );
    forwardShell.addUniform( 'baseColor', '3f', 0.272, 0.680, 0.949 );
    forwardShell.addUniform( 'roughness', '1f', 0.5 );
    forwardShell.addUniform( 'metallic', '1f', 0.0 );
    forwardShell.addUniform( 'opacity', '1f', 0.1 );

    const meshShellFront = new Mesh( {
      geometry: geometryShellFront,
      materials: { forward: forwardShell },
    } );
    meshShellFront.depthWrite = false;

    const meshShellBack = new Mesh( {
      geometry: geometryShellBack,
      materials: { forward: forwardShell },
    } );
    meshShellBack.depthWrite = false;

    const lightUniformsLambda = createLightUniformsLambda( [ forwardShell ] );

    // -- strokes ----------------------------------------------------------------------------------
    const strokeCore = new BoundingBox( { dashRatio: 0.0 } );
    strokeCore.transform.scale = [ 0.255, 0.255, 0.255 ];

    const strokeShell = new BoundingBox( { dashRatio: 0.0 } );
    strokeShell.transform.scale = [ 0.5, 0.5, 0.5 ];

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lightUniformsLambda,
      meshCore,
      meshShellBack,
      meshShellFront,
      strokeCore,
      strokeShell,
    ];

    if ( process.env.DEV ) {
      lightUniformsLambda.name = 'lightUniformsLambda';
      meshCore.name = 'meshCore';
      meshShellBack.name = 'meshShellBack';
      meshShellFront.name = 'meshShellFront';
      strokeCore.name = 'strokeCore';
      strokeShell.name = 'strokeShell';
    }
  }
}
