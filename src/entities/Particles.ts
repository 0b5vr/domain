import { GPUParticles } from './utils/GPUParticles';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../shaders/deferredShadeFrag';
import { Material } from '../heck/Material';
import { TransparentShell } from './TransparentShell';
import { depthFrag } from '../shaders/depthFrag';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers, dummyRenderTargetTwoDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { glCat } from '../globals/canvas';
import { particlesComputeFrag } from '../shaders/particlesComputeFrag';
import { particlesRenderFrag } from '../shaders/particlesRenderFrag';
import { particlesRenderVert } from '../shaders/particlesRenderVert';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';
import { randomTexture, randomTextureStatic } from '../globals/randomTexture';

const particlesSqrt = 256;
const particles = particlesSqrt * particlesSqrt;

const particleSpawnLength = 4.0;

const materialOptions = { particlesSqrt, particleSpawnLength };

export class Particles extends GPUParticles {
  public constructor() {
    // -- material compute -------------------------------------------------------------------------
    const materialCompute = new Material(
      quadVert,
      particlesComputeFrag( materialOptions ),
      { initOptions: { geometry: quadGeometry, target: dummyRenderTargetTwoDrawBuffers } },
    );

    materialCompute.addUniformTextures( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/particlesComputeFrag', () => {
          materialCompute.replaceShader(
            quadVert,
            particlesComputeFrag( materialOptions ),
          );
        } );
      }
    }

    // -- geometry render --------------------------------------------------------------------------
    const { geometry } = genCube();

    const bufferComputeUV = glCat.createBuffer();
    bufferComputeUV.setVertexbuffer( ( () => {
      const ret = new Float32Array( 2 * particles );
      for ( let iy = 0; iy < particlesSqrt; iy ++ ) {
        for ( let ix = 0; ix < particlesSqrt; ix ++ ) {
          const i = ix + iy * particlesSqrt;
          const s = ( ix + 0.5 ) / particlesSqrt;
          const t = ( iy + 0.5 ) / particlesSqrt;
          ret[ i * 2 + 0 ] = s;
          ret[ i * 2 + 1 ] = t;
        }
      }
      return ret;
    } )() );

    geometry.vao.bindVertexbuffer( bufferComputeUV, 3, 2, 1 );

    geometry.primcount = particles;

    // -- material render --------------------------------------------------------------------------
    const deferred = new Material(
      particlesRenderVert,
      particlesRenderFrag,
      {
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    deferred.addUniform( 'color', '4f', 0.6, 0.7, 0.8, 1.0 );
    deferred.addUniform( 'mtlKind', '1f', MTL_PBR_ROUGHNESS_METALLIC );
    deferred.addUniform( 'mtlParams', '4f', 0.8, 1.0, 0.0, 0.0 );

    const depth = new Material(
      particlesRenderVert,
      depthFrag,
      { initOptions: { geometry, target: dummyRenderTarget } },
    );

    deferred.addUniformTextures( 'samplerRandomStatic', randomTextureStatic.texture );
    depth.addUniformTextures( 'samplerRandomStatic', randomTextureStatic.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/particlesRenderVert',
            '../shaders/particlesRenderFrag',
          ],
          () => {
            deferred.replaceShader( particlesRenderVert, particlesRenderFrag );
            depth.replaceShader( particlesRenderVert, depthFrag );
          },
        );
      }
    }

    // -- gpu particles ----------------------------------------------------------------------------
    super( {
      materialCompute,
      geometryRender: geometry,
      materialsRender: { deferred, depth },
      computeWidth: particlesSqrt,
      computeHeight: particlesSqrt,
      computeNumBuffers: 2,
    } );

    // -- shell ------------------------------------------------------------------------------------
    this.children.push( new TransparentShell( {
      roughness: 0.1,
      roughnessNoise: 0.1,
    } ) );
  }
}
