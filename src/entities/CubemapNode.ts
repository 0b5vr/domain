import { Blit } from '../heck/components/Blit';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { CameraStack } from './CameraStack';
import { ComponentOptions } from '../heck/components/Component';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RawQuaternion, Swap } from '@0b5vr/experimental';
import { SceneNode } from '../heck/components/SceneNode';
import { cubemapBlurFrag } from '../shaders/cubemapBlurFrag';
import { cubemapMergeFrag } from '../shaders/cubemapMergeFrag';
import { cubemapSampleFrag } from '../shaders/cubemapSampleFrag';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';

export const CubemapNodeTag = Symbol();

const INV_SQRT2 = 1.0 / Math.sqrt( 2.0 );

const CUBEMAP_ROTATIONS: RawQuaternion[] = [ // 🔥
  [ 0.0, -INV_SQRT2, 0.0, INV_SQRT2 ], // PX
  [ 0.0, INV_SQRT2, 0.0, INV_SQRT2 ], // NX
  [ 0.0, INV_SQRT2, -INV_SQRT2, 0.0 ], // PY
  [ 0.0, INV_SQRT2, INV_SQRT2, 0.0 ], // NY
  [ 0.0, 1.0, 0.0, 0.0 ], // PZ
  [ 0.0, 0.0, 0.0, 1.0 ], // NZ
];

export interface CubemapNodeOptions extends ComponentOptions {
  scenes: SceneNode[];
  textureIBLLUT: GLCatTexture;
}

export class CubemapNode extends SceneNode {
  public targetDry: BufferRenderTarget;
  public targetWet: BufferRenderTarget;

  public constructor( options: CubemapNodeOptions ) {
    super( options );

    this.tags.push( CubemapNodeTag );

    this.transform.position = [ 0.0, 3.0, 0.0 ];

    const { scenes } = options;

    // -- cubemap ----------------------------------------------------------------------------------
    const targets = [ ...Array( 6 ) ].map( ( _, i ) => new BufferRenderTarget( {
      width: 256,
      height: 256,
      name: process.env.DEV && `cubemapTarget${ i }`,
    } ) );

    // -- cameras ----------------------------------------------------------------------------------
    const cameras = targets.map( ( target, i ) => {
      const cameraStack = new CameraStack( {
        scenes,
        target,
        near: 2.9,
        fov: 90.0,
        name: process.env.DEV && `cubemapCameraStack${ i }`,
      } );

      cameraStack.transform.rotation = CUBEMAP_ROTATIONS[ i ];

      return cameraStack;
    } );

    // -- compiler ---------------------------------------------------------------------------------
    const targetCompiled = this.targetDry = new BufferRenderTarget( {
      width: 768,
      height: 512,
      name: process.env.DEV && 'cubemapCompiled',
    } );

    const blitsCompile = targets.map( ( src, i ) => {
      const x = 256 * Math.floor( i / 2 );
      const y = 256 * ( i % 2 );
      return new Blit( {
        src,
        dst: targetCompiled,
        dstRect: [
          x,
          y,
          x + 256,
          y + 256,
        ],
      } );
    } );

    // -- sample ggx -------------------------------------------------------------------------------
    const swapTargetSample = new Swap(
      new BufferRenderTarget( {
        width: 768,
        height: 512,
        name: process.env.DEV && 'cubemapSample/swap0',
      } ),
      new BufferRenderTarget( {
        width: 768,
        height: 512,
        name: process.env.DEV && 'cubemapSample/swap1',
      } ),
    );

    const materialSample = new Material(
      quadVert,
      cubemapSampleFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    materialSample.addUniformTextures( 'samplerCubemap', targetCompiled.texture );

    if ( process.env.DEV ) {
      module.hot?.accept( '../shaders/cubemapSampleFrag', () => {
        materialSample.replaceShader( quadVert, cubemapSampleFrag );
      } );
    }

    const quadSample = new Quad( {
      material: materialSample,
      name: process.env.DEV && 'quadSample',
    } );

    // -- merge accumulated ------------------------------------------------------------------------
    const targetMerge = new BufferRenderTarget( {
      width: 768,
      height: 512,
      name: process.env.DEV && 'cubemapMerge',
    } );

    const materialMerge = new Material(
      quadVert,
      cubemapMergeFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );

    if ( process.env.DEV ) {
      module.hot?.accept( '../shaders/cubemapMergeFrag', () => {
        materialMerge.replaceShader( quadVert, cubemapMergeFrag );
      } );
    }

    const quadMerge = new Quad( {
      material: materialMerge,
      target: targetMerge,
      name: process.env.DEV && 'quadMerge',
    } );

    // -- swapper ----------------------------------------------------------------------------------
    const lambdaSwapTargetSample = new Lambda( {
      onUpdate: () => {
        swapTargetSample.swap();

        materialSample.addUniformTextures( 'samplerPrev', swapTargetSample.o.texture );
        quadSample.target = swapTargetSample.i;
        materialMerge.addUniformTextures( 'samplerCubemap', swapTargetSample.o.texture );
      },
    } );

    // -- blur -------------------------------------------------------------------------------------
    const targetBlurH = new BufferRenderTarget( {
      width: 768,
      height: 512,
      name: process.env.DEV && 'cubemapBlurH',
    } );

    const targetBlurV = this.targetWet = new BufferRenderTarget( {
      width: 768,
      height: 512,
      name: process.env.DEV && 'cubemapBlurV',
    } );

    const materialBlurH = new Material(
      quadVert,
      cubemapBlurFrag( 0 ),
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    materialBlurH.addUniformTextures( 'samplerCubemap', targetMerge.texture );

    const materialBlurV = new Material(
      quadVert,
      cubemapBlurFrag( 1 ),
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );
    materialBlurV.addUniformTextures( 'samplerCubemap', targetBlurH.texture );

    if ( process.env.DEV ) {
      module.hot?.accept( '../shaders/cubemapBlurFrag', () => {
        materialBlurH.replaceShader( quadVert, cubemapBlurFrag( 0 ) );
        materialBlurV.replaceShader( quadVert, cubemapBlurFrag( 1 ) );
      } );
    }

    const quadBlurH = new Quad( {
      material: materialBlurH,
      target: targetBlurH,
      name: process.env.DEV && 'quadBlurH',
    } );

    const quadBlurV = new Quad( {
      material: materialBlurV,
      target: targetBlurV,
      name: process.env.DEV && 'quadBlurV',
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      lambdaSwapTargetSample,
      ...cameras,
      ...blitsCompile,
      quadSample,
      quadMerge,
      quadBlurH,
      quadBlurV,
    ];
  }
}
