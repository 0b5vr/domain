import { AO_RESOLUTION_RATIO } from '../config';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
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

export interface DeferredCameraOptions {
  scenes: SceneNode[];
  target: RenderTarget;
  textureIBLLUT: GLCatTexture;
  // textureEnv: GLCatTexture;
}

export class DeferredCamera extends SceneNode {
  public cameraTarget: BufferRenderTarget;
  public camera: PerspectiveCamera;

  public constructor( options: DeferredCameraOptions ) {
    super();

    // -- camera -----------------------------------------------------------------------------------
    this.cameraTarget = new BufferRenderTarget( {
      width: options.target.width,
      height: options.target.height,
      numBuffers: 4,
      name: process.env.DEV && 'DeferredCamera/cameraTarget',
      filter: gl.NEAREST,
    } );

    this.camera = new PerspectiveCamera( {
      scenes: options.scenes,
      renderTarget: this.cameraTarget,
      near: 0.1,
      far: 20.0,
      name: process.env.DEV && 'camera',
      materialTag: 'deferred',
    } );

    // -- ao ---------------------------------------------------------------------------------------
    const aoTarget = new BufferRenderTarget( {
      width: AO_RESOLUTION_RATIO * options.target.width,
      height: AO_RESOLUTION_RATIO * options.target.height,
      name: process.env.DEV && 'DeferredCamera/aoTarget',
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
          mat4Multiply( this.camera.projectionMatrix, cameraView ),
        );
      },
      name: process.env.DEV && 'aoSetCameraUniforms',
    } );

    for ( let i = 1; i < 3; i ++ ) { // it doesn't need 0 and 3
      aoMaterial.addUniformTextures(
        'sampler' + i,
        this.cameraTarget.getTexture( gl.COLOR_ATTACHMENT0 + i )!,
      );
    }

    aoMaterial.addUniformTextures( 'samplerRandom', randomTexture.texture );

    const aoQuad = new Quad( {
      material: aoMaterial,
      target: aoTarget,
      name: process.env.DEV && 'aoQuad',
    } );

    // -- deferred ---------------------------------------------------------------------------------
    const shadingMaterial = new Material(
      quadVert,
      deferredShadeFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );

    const shadingQuad = new Quad( {
      material: shadingMaterial,
      target: options.target,
      name: process.env.DEV && 'shadingQuad',
    } );
    shadingQuad.clear = [];

    const lambda = new Lambda( {
      onUpdate: () => {
        const cameraView = mat4Inverse( this.transform.matrix );

        shadingMaterial.addUniformMatrixVector(
          'cameraView',
          'Matrix4fv',
          cameraView
        );

        shadingMaterial.addUniformMatrixVector(
          'cameraPV',
          'Matrix4fv',
          mat4Multiply( this.camera.projectionMatrix, cameraView ),
        );

        shadingMaterial.addUniform(
          'cameraNearFar',
          '2f',
          this.camera.near,
          this.camera.far
        );

        shadingMaterial.addUniform(
          'cameraPos',
          '3f',
          ...this.transform.position,
        );
      },
      name: process.env.DEV && 'shadingSetCameraUniforms',
    } );

    const lambdaLightUniforms = createLightUniformsLambda( [ shadingMaterial ] );

    for ( let i = 0; i < 4; i ++ ) {
      shadingMaterial.addUniformTextures(
        'sampler' + i,
        this.cameraTarget.getTexture( gl.COLOR_ATTACHMENT0 + i )!,
      );
    }

    shadingMaterial.addUniformTextures( 'samplerAo', aoTarget.texture );
    shadingMaterial.addUniformTextures( 'samplerIBLLUT', options.textureIBLLUT );
    // shadingMaterial.addUniformTextures( 'samplerEnv', options.textureEnv );
    shadingMaterial.addUniformTextures( 'samplerRandom', randomTexture.texture );

    this.children.push(
      this.camera,
      lambdaAoSetCameraUniforms,
      aoQuad,
      lambda,
      lambdaLightUniforms,
      shadingQuad,
    );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/deferredShadeFrag', () => {
          shadingMaterial.replaceShader( quadVert, deferredShadeFrag );
        } );
      }
    }
  }
}
