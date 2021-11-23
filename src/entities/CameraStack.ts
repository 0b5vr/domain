import { AO_RESOLUTION_RATIO, FAR, NEAR } from '../config';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Component, ComponentOptions } from '../heck/components/Component';
import { CubemapNode } from './CubemapNode';
import { Floor } from './Floor';
import { FloorCamera } from './FloorCamera';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Lambda } from '../heck/components/Lambda';
import { LightShaft, LightShaftTag } from './LightShaft';
import { Material } from '../heck/Material';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { PostStack } from './PostStack';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { SceneNode } from '../heck/components/SceneNode';
import { createLightUniformsLambda } from './utils/createLightUniformsLambda';
import { deferredShadeFrag } from '../shaders/deferredShadeFrag';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl } from '../globals/canvas';
import { mat4Inverse, mat4Multiply } from '@0b5vr/experimental';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';
import { randomTexture } from '../globals/randomTexture';
import { ssaoFrag } from '../shaders/ssaoFrag';

export interface CameraStackOptions extends ComponentOptions {
  scenes: SceneNode[];
  target: RenderTarget;
  textureIBLLUT: GLCatTexture;
  floor?: Floor;
  cubemapNode?: CubemapNode;
  near?: number;
  far?: number;
  // textureEnv: GLCatTexture;
  withPost?: boolean;
  withAO?: boolean;
}

export class CameraStack extends SceneNode {
  public deferredCamera: PerspectiveCamera;
  public forwardCamera: PerspectiveCamera;
  public cubemapNode?: CubemapNode;
  public textureIBLLUT: GLCatTexture;

  public constructor( options: CameraStackOptions ) {
    super( options );

    const near = options.near ?? NEAR;
    const far = options.far ?? FAR;
    const withAO = options.withAO ?? false;

    const { target, scenes, textureIBLLUT, floor, cubemapNode, withPost } = options;
    this.cubemapNode = cubemapNode;
    this.textureIBLLUT = textureIBLLUT;

    const cameraTarget = withPost ? new BufferRenderTarget( {
      width: target.width,
      height: target.height,
      name: process.env.DEV && `${ this.name }/cameraTarget`,
    } ) : target;

    // -- deferred g rendering ---------------------------------------------------------------------
    const deferredTarget = new BufferRenderTarget( {
      width: target.width,
      height: target.height,
      numBuffers: 4,
      name: process.env.DEV && `${ this.name }/deferredTarget`,
      filter: gl.NEAREST,
    } );

    const deferredCamera = this.deferredCamera = new PerspectiveCamera( {
      scenes: scenes,
      renderTarget: deferredTarget,
      near,
      far,
      name: process.env.DEV && 'deferredCamera',
      materialTag: 'deferred',
    } );

    // -- ambient occlusion ------------------------------------------------------------------------
    let aoComponents: Component[] = [];
    let aoTarget: BufferRenderTarget | undefined;

    if ( withAO ) {
      aoTarget = new BufferRenderTarget( {
        width: AO_RESOLUTION_RATIO * target.width,
        height: AO_RESOLUTION_RATIO * target.height,
        name: process.env.DEV && `${ this.name }/aoTarget`,
      } );

      const aoMaterial = new Material(
        quadVert,
        ssaoFrag,
        { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
      );

      const lambdaAoSetCameraUniforms = new Lambda( {
        onUpdate: () => {
          const cameraView = mat4Inverse( this.transform.matrix );

          shadingMaterial.addUniformMatrixVector(
            'cameraPV',
            'Matrix4fv',
            mat4Multiply( deferredCamera.projectionMatrix, cameraView ),
          );
        },
        name: process.env.DEV && 'aoSetCameraUniforms',
      } );

      for ( let i = 1; i < 3; i ++ ) { // it doesn't need 0 and 3
        aoMaterial.addUniformTextures(
          'sampler' + i,
          deferredTarget.getTexture( gl.COLOR_ATTACHMENT0 + i )!,
        );
      }

      aoMaterial.addUniformTextures( 'samplerRandom', randomTexture.texture );

      const aoQuad = new Quad( {
        material: aoMaterial,
        target: aoTarget,
        name: process.env.DEV && 'aoQuad',
      } );

      aoComponents = [
        lambdaAoSetCameraUniforms,
        aoQuad,
      ];
    }

    // -- deferred ---------------------------------------------------------------------------------
    const shadingMaterial = new Material(
      quadVert,
      deferredShadeFrag( { withAO } ),
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );

    const lambdaDeferredCameraUniforms = new Lambda( {
      onUpdate: ( { globalTransform } ) => {
        const cameraView = mat4Inverse( this.transform.matrix );

        shadingMaterial.addUniformMatrixVector(
          'cameraView',
          'Matrix4fv',
          cameraView
        );

        shadingMaterial.addUniformMatrixVector(
          'cameraPV',
          'Matrix4fv',
          mat4Multiply( deferredCamera.projectionMatrix, cameraView ),
        );

        shadingMaterial.addUniform(
          'cameraNearFar',
          '2f',
          deferredCamera.near,
          deferredCamera.far
        );

        shadingMaterial.addUniform(
          'cameraPos',
          '3f',
          ...globalTransform.position,
        );
      },
      name: process.env.DEV && 'lambdaCameraUniforms',
    } );

    const lambdaLightUniforms = createLightUniformsLambda( [ shadingMaterial ] );

    for ( let i = 0; i < 4; i ++ ) {
      shadingMaterial.addUniformTextures(
        'sampler' + i,
        deferredTarget.getTexture( gl.COLOR_ATTACHMENT0 + i )!,
      );
    }

    aoTarget && shadingMaterial.addUniformTextures( 'samplerAo', aoTarget.texture );
    shadingMaterial.addUniformTextures( 'samplerIBLLUT', textureIBLLUT );
    cubemapNode && shadingMaterial.addUniformTextures(
      'samplerEnvDry',
      cubemapNode.targetCompiled.texture
    );
    cubemapNode && shadingMaterial.addUniformTextures(
      'samplerEnvWet',
      cubemapNode.targetMerged.texture
    );
    // shadingMaterial.addUniformTextures( 'samplerEnv', textureEnv );
    shadingMaterial.addUniformTextures( 'samplerRandom', randomTexture.texture );

    const shadingQuad = new Quad( {
      material: shadingMaterial,
      target: cameraTarget,
      name: process.env.DEV && 'shadingQuad',
      clear: [],
    } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/deferredShadeFrag', () => {
          shadingMaterial.replaceShader( quadVert, deferredShadeFrag( { withAO } ) );
        } );
      }
    }

    // -- forward ----------------------------------------------------------------------------------
    const lambdaUpdateLightShaftDeferredRenderTarget = new Lambda( {
      onUpdate: ( { componentsByTag } ) => {
        Array.from( componentsByTag.get( LightShaftTag ) ).map( ( lightShaft ) => {
          ( lightShaft as LightShaft ).setDefferedCameraTarget( deferredTarget );
        } );
      },
    } );

    const forwardCamera = this.forwardCamera = new PerspectiveCamera( {
      scenes: scenes,
      renderTarget: cameraTarget,
      near,
      far,
      clear: false,
      name: process.env.DEV && 'forwardCamera',
      materialTag: 'forward',
    } );

    // -- floor camera -----------------------------------------------------------------------------
    const floorComponents = floor ? [ new FloorCamera( this, floor ) ] : [];

    // -- post -------------------------------------------------------------------------------------
    const postStack = withPost ? [ new PostStack( {
      input: cameraTarget as BufferRenderTarget,
      target,
    } ) ] : [];

    // -- components -------------------------------------------------------------------------------
    this.children = [
      ...floorComponents,
      deferredCamera,
      ...aoComponents,
      lambdaDeferredCameraUniforms,
      lambdaLightUniforms,
      shadingQuad,
      lambdaUpdateLightShaftDeferredRenderTarget,
      forwardCamera,
      ...postStack,
    ];
  }
}
