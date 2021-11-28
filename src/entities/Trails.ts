import { GPUParticles } from './utils/GPUParticles';
import { Lambda } from '../heck/components/Lambda';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../shaders/deferredShadeFrag';
import { Material } from '../heck/Material';
import { TransparentShell } from './TransparentShell';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers, dummyRenderTargetTwoDrawBuffers } from '../globals/dummyRenderTarget';
import { genCylinder } from '../geometries/genCylinder';
import { glCat } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';
import { randomTexture, randomTextureStatic } from '../globals/randomTexture';
import { trailsComputeFrag } from '../shaders/trailsComputeFrag';
import { trailsRenderFrag } from '../shaders/trailsRenderFrag';
import { trailsRenderVert } from '../shaders/trailsRenderVert';

const trails = 512;
const trailLength = 512;

const trailSpawnLength = 4.0;

const materialOptions = { trails, trailLength, trailSpawnLength };

export class Trails extends GPUParticles {
  public constructor() {
    // -- material compute -------------------------------------------------------------------------
    const materialCompute = new Material(
      quadVert,
      trailsComputeFrag( materialOptions ),
      { initOptions: { geometry: quadGeometry, target: dummyRenderTargetTwoDrawBuffers } },
    );

    const shouldUpdate = 1;

    materialCompute.addUniform( 'shouldUpdate', '1i', shouldUpdate );
    materialCompute.addUniformTextures( 'samplerRandom', randomTexture.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/trailsComputeFrag', () => {
          materialCompute.replaceShader(
            quadVert,
            trailsComputeFrag( materialOptions ),
          );
        } );
      }
    }

    // -- geometry render --------------------------------------------------------------------------
    const { geometry } = genCylinder( {
      heightSegs: trailLength,
      radialSegs: 16,
    } );

    const bufferComputeV = glCat.createBuffer();
    bufferComputeV.setVertexbuffer( ( () => {
      const ret = new Float32Array( trails );
      for ( let i = 0; i < trails; i ++ ) {
        const s = ( i + 0.5 ) / trails;
        ret[ i ] = s;
      }
      return ret;
    } )() );

    geometry.vao.bindVertexbuffer( bufferComputeV, 3, 1, 1 );

    geometry.primcount = trails;

    // -- material render --------------------------------------------------------------------------
    const deferred = new Material(
      trailsRenderVert( trailLength ),
      trailsRenderFrag( 'deferred' ),
      {
        initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );
    deferred.addUniform( 'color', '4f', 0.6, 0.7, 0.8, 1.0 );
    deferred.addUniform( 'mtlKind', '1f', MTL_PBR_ROUGHNESS_METALLIC );
    deferred.addUniform( 'mtlParams', '4f', 0.8, 1.0, 0.0, 0.0 );

    const depth = new Material(
      trailsRenderVert( trailLength ),
      trailsRenderFrag( 'depth' ),
      { initOptions: { geometry, target: dummyRenderTarget } },
    );

    deferred.addUniformTextures( 'samplerRandomStatic', randomTextureStatic.texture );
    depth.addUniformTextures( 'samplerRandomStatic', randomTextureStatic.texture );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/trailsRenderVert',
            '../shaders/trailsRenderFrag',
          ],
          () => {
            deferred.replaceShader(
              trailsRenderVert( trailLength ),
              trailsRenderFrag( 'deferred' ),
            );
            depth.replaceShader(
              trailsRenderVert( trailLength ),
              trailsRenderFrag( 'depth' ),
            );
          },
        );
      }
    }

    // -- gpu particles ----------------------------------------------------------------------------
    super( {
      materialCompute,
      geometryRender: geometry,
      materialsRender: { deferred, depth },
      computeWidth: trailLength,
      computeHeight: trails,
      computeNumBuffers: 2,
    } );

    // -- lambda to say update ---------------------------------------------------------------------
    this.children.push( new Lambda( {
      onUpdate: ( { time, deltaTime } ) => {
        const shouldUpdate
          = Math.floor( 60.0 * time ) !== Math.floor( 60.0 * ( time - deltaTime ) );
        materialCompute.addUniform( 'shouldUpdate', '1i', shouldUpdate ? 1 : 0 );
      },
      name: process.env.DEV && 'updateShouldUpdate',
    } ) );

    // -- shell ------------------------------------------------------------------------------------
    this.children.push( new TransparentShell( {
      roughness: 0.1,
      roughnessNoise: 0.1,
    } ) );
  }
}
