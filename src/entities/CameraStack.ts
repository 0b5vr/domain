import { AO_RESOLUTION_RATIO } from '../config';
import { Bloom } from './Bloom';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { ComponentOptions } from '../heck/components/Component';
import { Floor } from './Floor';
import { FloorCamera } from './FloorCamera';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { Post } from './Post';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { SceneNode } from '../heck/components/SceneNode';
import { Swap, mat4Inverse, mat4Multiply } from '@0b5vr/experimental';
import { createLightUniformsLambda } from './utils/createLightUniformsLambda';
import { deferredShadeFrag } from '../shaders/deferredShadeFrag';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';
import { randomTexture } from '../globals/randomTexture';
import { ssaoFrag } from '../shaders/ssaoFrag';

export interface CameraStackOptions extends ComponentOptions {
  scenes: SceneNode[];
  target: RenderTarget;
  floor: Floor;
  textureIBLLUT: GLCatTexture;
  // textureEnv: GLCatTexture;
}

export class CameraStack extends SceneNode {
  public deferredCamera: PerspectiveCamera;
  public forwardCamera: PerspectiveCamera;

  public constructor( options: CameraStackOptions ) {
    super( options );

    const { target, scenes, textureIBLLUT, floor } = options;

    // -- swap -------------------------------------------------------------------------------------
    const swapOptions = {
      width: target.width,
      height: target.height,
    };

    const postSwap = new Swap(
      new BufferRenderTarget( {
        ...swapOptions,
        name: process.env.DEV && `${ this.name }/postSwap0`,
      } ),
      new BufferRenderTarget( {
        ...swapOptions,
        name: process.env.DEV && `${ this.name }/postSwap1`,
      } ),
    );

    // -- deferred g rendering ---------------------------------------------------------------------
    const deferredTarget = new BufferRenderTarget( {
      width: target.width,
      height: target.height,
      numBuffers: 4,
      name: process.env.DEV && 'DeferredCamera/cameraTarget',
      filter: gl.NEAREST,
    } );

    const deferredCamera = this.deferredCamera = new PerspectiveCamera( {
      scenes: scenes,
      renderTarget: deferredTarget,
      near: 0.1,
      far: 20.0,
      name: process.env.DEV && 'deferredCamera',
      materialTag: 'deferred',
    } );

    // -- ambient occlusion ------------------------------------------------------------------------
    const aoTarget = new BufferRenderTarget( {
      width: AO_RESOLUTION_RATIO * target.width,
      height: AO_RESOLUTION_RATIO * target.height,
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

    // -- deferred ---------------------------------------------------------------------------------
    const shadingMaterial = new Material(
      quadVert,
      deferredShadeFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );

    const lambdaDeferredCameraUniforms = new Lambda( {
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
          ...this.transform.position,
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

    shadingMaterial.addUniformTextures( 'samplerAo', aoTarget.texture );
    shadingMaterial.addUniformTextures( 'samplerIBLLUT', textureIBLLUT );
    // shadingMaterial.addUniformTextures( 'samplerEnv', textureEnv );
    shadingMaterial.addUniformTextures( 'samplerRandom', randomTexture.texture );

    const shadingQuad = new Quad( {
      material: shadingMaterial,
      target: postSwap.i,
      name: process.env.DEV && 'shadingQuad',
      clear: [],
    } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/deferredShadeFrag', () => {
          shadingMaterial.replaceShader( quadVert, deferredShadeFrag );
        } );
      }
    }

    // -- forward ----------------------------------------------------------------------------------
    const forwardCamera = this.forwardCamera = new PerspectiveCamera( {
      scenes: scenes,
      renderTarget: postSwap.i,
      near: 0.1,
      far: 20.0,
      clear: false,
      name: process.env.DEV && 'forwardCamera',
      materialTag: 'forward',
    } );

    // -- floor camera -----------------------------------------------------------------------------
    const floorCamera = new FloorCamera( this, forwardCamera, floor );

    // -- post -------------------------------------------------------------------------------------
    postSwap.swap();
    const bloom = new Bloom( {
      input: postSwap.o,
      target: postSwap.i,
    } );

    postSwap.swap();
    const post = new Post( {
      input: postSwap.o,
      target: target,
    } );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      floorCamera,
      deferredCamera,
      lambdaAoSetCameraUniforms,
      aoQuad,
      lambdaDeferredCameraUniforms,
      lambdaLightUniforms,
      shadingQuad,
      forwardCamera,
      bloom,
      post,
    ];
  }
}
