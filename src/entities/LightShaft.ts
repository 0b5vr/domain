import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../shaders/deferredShadeFrag';
import { Material } from '../heck/Material';
import { Mesh, MeshCull } from '../heck/components/Mesh';
import { PointLightNode } from './PointLightNode';
import { SceneNode, SceneNodeOptions } from '../heck/components/SceneNode';
import { deferredColorFrag } from '../shaders/deferredColorFrag';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCylinder } from '../geometries/genCylinder';
import { gl } from '../globals/canvas';
import { lightShaftFrag } from '../shaders/lightShaftFrag';
import { lightShaftVert } from '../shaders/lightShaftVert';
import { mat4Inverse, mat4Multiply } from '@0b5vr/experimental';
import { objectVert } from '../shaders/objectVert';
import { randomTexture } from '../globals/randomTexture';

export const LightShaftTag = Symbol();

interface LightShaftOptions extends SceneNodeOptions {
  light: PointLightNode;
  intensity?: number;
}

export class LightShaft extends SceneNode {
  private __forward: Material;

  public constructor( options: LightShaftOptions ) {
    super( options );

    this.tags.push( LightShaftTag );

    const { light, intensity } = options;

    // -- geometry ---------------------------------------------------------------------------------
    const cylinder = genCylinder( {
      radialSegs: 64,
    } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( cylinder.position, 0, 3 );
    geometry.vao.bindIndexbuffer( cylinder.index );

    geometry.count = cylinder.count;
    geometry.mode = cylinder.mode;
    geometry.indexType = cylinder.indexType;

    // -- materials --------------------------------------------------------------------------------
    const forward = this.__forward = new Material(
      lightShaftVert,
      lightShaftFrag,
      {
        initOptions: { geometry: geometry, target: dummyRenderTarget },
        blend: [ gl.ONE, gl.ONE ],
      },
    );

    forward.addUniform( 'intensity', '1f', intensity ?? 0.01 );

    forward.addUniformTextures( 'samplerRandom', randomTexture.texture );
    forward.addUniformTextures( 'samplerShadow', light.shadowMap.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/lightShaftVert',
            '../shaders/lightShaftFrag',
          ],
          () => {
            forward.replaceShader( lightShaftVert, lightShaftFrag );
          },
        );
      }
    }

    const materials = { forward, cubemap: forward };

    // -- updater ----------------------------------------------------------------------------------
    const lambdaUniforms = new Lambda( {
      onDraw: ( event ) => {
        forward.addUniform( 'lightFov', '1f', light.shadowMapFov );
        forward.addUniform( 'lightNearFar', '2f', light.shadowMapNear, light.shadowMapFar );
        forward.addUniform( 'lightPos', '3f', ...light.globalTransformCache.position );
        forward.addUniform( 'lightColor', '3f', ...light.color );
        forward.addUniform( 'lightParams', '4f', light.spotness, light.spotSharpness, 0.0, 0.0 );

        forward.addUniformMatrixVector(
          'lightPV',
          'Matrix4fv',
          mat4Multiply(
            light.camera.projectionMatrix,
            mat4Inverse( light.globalTransformCache.matrix ),
          ),
        );

        forward.addUniform(
          'cameraNearFar',
          '2f',
          event.camera.near,
          event.camera.far
        );
      },
    } );

    if ( process.env.DEV ) {
      lambdaUniforms.name = 'lambdaUniforms';
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'mesh',
    } );
    mesh.cull = MeshCull.None;
    mesh.depthTest = false;
    mesh.depthWrite = false;

    if ( process.env.DEV ) {
      mesh.name = 'mesh';
    }

    // -- """light body""" -------------------------------------------------------------------------
    const nodeBody = new SceneNode( {
      name: process.env.DEV && 'nodeBody',
    } );
    nodeBody.transform.scale = [ 0.2, 0.2, 0.2 ];

    const materialBody = new Material(
      objectVert,
      deferredColorFrag,
      {
        initOptions: { geometry: geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    materialBody.addUniform( 'color', '4f', 0.04, 0.04, 0.04, 1.0 );
    materialBody.addUniform( 'mtlKind', '1f', MTL_PBR_ROUGHNESS_METALLIC );
    materialBody.addUniform( 'mtlParams', '4f', 0.7, 1.0, 0.0, 0.0 );

    const meshBody = new Mesh( {
      geometry,
      materials: { deferred: materialBody },
    } );
    nodeBody.children = [ meshBody ];

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lambdaUniforms,
      mesh,
      nodeBody,
    ];
  }

  /**
   * どうやってフレームバッファのデプスを取るかわかりませんでした 許してほしい
   */
  public setDefferedCameraTarget( deferredCameraTarget: BufferRenderTarget ): void {
    const texture = deferredCameraTarget.getTexture( gl.COLOR_ATTACHMENT1 )!;
    this.__forward.addUniformTextures( 'samplerDeferred1', texture );
  }
}
