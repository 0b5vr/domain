import { GPUParticles } from './utils/GPUParticles';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { createLightUniformsLambda } from './utils/createLightUniformsLambda';
import { dummyRenderTarget, dummyRenderTargetTwoDrawBuffers } from '../globals/dummyRenderTarget';
import { dustComputeFrag } from '../shaders/dustComputeFrag';
import { dustRenderFrag } from '../shaders/dustRenderFrag';
import { dustRenderVert } from '../shaders/dustRenderVert';
import { gl, glCat } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';
import { randomTexture } from '../globals/randomTexture';

const particlesSqrt = 256;
const particles = particlesSqrt * particlesSqrt;

const particleSpawnLength = 4.0;

const materialOptions = { particlesSqrt, particleSpawnLength };

export class Dust extends GPUParticles {
  public constructor() {
    // -- material compute -------------------------------------------------------------------------
    const materialCompute = new Material(
      quadVert,
      dustComputeFrag( materialOptions ),
      { initOptions: { geometry: quadGeometry, target: dummyRenderTargetTwoDrawBuffers } },
    );

    materialCompute.addUniformTextures( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/dustComputeFrag', () => {
          materialCompute.replaceShader(
            quadVert,
            dustComputeFrag( materialOptions ),
          );
        } );
      }
    }

    // -- geometry render --------------------------------------------------------------------------
    const geometry = new Geometry();

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

    geometry.vao.bindVertexbuffer( bufferComputeUV, 0, 2 );

    geometry.count = particles;
    geometry.mode = gl.POINTS;

    // -- material render --------------------------------------------------------------------------
    const forward = new Material(
      dustRenderVert,
      dustRenderFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget },
        blend: [ gl.ONE, gl.ONE ],
      },
    );

    const lambdaLightUniforms = createLightUniformsLambda( [ forward ] );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/dustRenderVert',
            '../shaders/dustRenderFrag',
          ],
          () => {
            forward.replaceShader( dustRenderVert, dustRenderFrag );
          },
        );
      }
    }

    // -- gpu particles ----------------------------------------------------------------------------
    super( {
      materialCompute,
      geometryRender: geometry,
      materialsRender: { forward },
      computeWidth: particlesSqrt,
      computeHeight: particlesSqrt,
      computeNumBuffers: 2,
    } );

    this.children.unshift( lambdaLightUniforms );
    this.meshRender.depthWrite = false;
  }
}
