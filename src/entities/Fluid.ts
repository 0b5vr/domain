import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { Quad } from '../heck/components/Quad';
import { SceneNode } from '../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';
import { TransparentShell } from './TransparentShell';
import { colorFrag } from '../shaders/colorFrag';
import { createLightUniformsLambda } from './utils/createLightUniformsLambda';
import { createRaymarchCameraUniformsLambda } from './utils/createRaymarchCameraUniformsLambda';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { fluidAdvectionFrag } from '../shaders/fluidAdvectionFrag';
import { fluidCurlFrag } from '../shaders/fluidCurlFrag';
import { fluidDivergenceFrag } from '../shaders/fluidDivergenceFrag';
import { fluidPokeDensityFrag } from '../shaders/fluidPokeDensityFrag';
import { fluidPressureFrag } from '../shaders/fluidPressureFrag';
import { fluidRenderFrag } from '../shaders/fluidRenderFrag';
import { fluidResolvePressureFrag } from '../shaders/fluidResolvePressureFrag';
import { genCube } from '../geometries/genCube';
import { gl } from '../globals/canvas';
import { objectVert } from '../shaders/objectVert';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';
import { randomTexture } from '../globals/randomTexture';

const GRID_RESO_SQRT = 8;
const GRID_RESO = GRID_RESO_SQRT * GRID_RESO_SQRT;
const BUFFER_RESO = GRID_RESO * GRID_RESO_SQRT;

export class Fluid extends SceneNode {
  public constructor() {
    super();

    // -- render targets ---------------------------------------------------------------------------
    const brtOptions = {
      width: BUFFER_RESO,
      height: BUFFER_RESO,
    };

    const bufferCurl = new BufferRenderTarget( {
      ...brtOptions,
      name: process.env.DEV && 'Fluid/bufferCurl',
      filter: gl.NEAREST,
    } );

    const bufferDivergence = new BufferRenderTarget( {
      ...brtOptions,
      name: process.env.DEV && 'Fluid/bufferDivergence',
      filter: gl.NEAREST,
    } );

    const swapPressure = new Swap(
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && 'Fluid/swapPressure0',
        filter: gl.LINEAR,
      } ),
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && 'Fluid/swapPressure1',
        filter: gl.LINEAR,
      } ),
    );

    const swapVelocity = new Swap(
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && 'Fluid/swapVelocity0',
        filter: gl.LINEAR,
      } ),
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && 'Fluid/swapVelocity1',
        filter: gl.LINEAR,
      } ),
    );

    const swapDensity = new Swap(
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && 'Fluid/swapDensity0',
        filter: gl.LINEAR,
      } ),
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && 'Fluid/swapDensity1',
        filter: gl.LINEAR,
      } ),
    );

    // -- density ----------------------------------------------------------------------------------
    const materialPokeDensity = new Material(
      quadVert,
      fluidPokeDensityFrag( GRID_RESO_SQRT, GRID_RESO ),
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );
    materialPokeDensity.addUniformTextures( 'samplerDensity', swapDensity.o.texture );

    const quadPokeDensity = new Quad( {
      target: swapDensity.i,
      material: materialPokeDensity,
      name: process.env.DEV && 'quadPokeDensity',
    } );

    swapDensity.swap();

    // -- curl -------------------------------------------------------------------------------------
    const materialCurl = new Material(
      quadVert,
      fluidCurlFrag( GRID_RESO_SQRT, GRID_RESO ),
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );
    materialCurl.addUniformTextures( 'samplerVelocity', swapVelocity.o.texture );

    const quadCurl = new Quad( {
      target: bufferCurl,
      material: materialCurl,
      name: process.env.DEV && 'quadCurl',
    } );

    // -- divergence -------------------------------------------------------------------------------
    const materialDivergence = new Material(
      quadVert,
      fluidDivergenceFrag( GRID_RESO_SQRT, GRID_RESO ),
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );
    materialDivergence.addUniformTextures( 'samplerVelocity', swapVelocity.o.texture );

    const quadDivergence = new Quad( {
      target: bufferDivergence,
      material: materialDivergence,
      name: process.env.DEV && 'quadDivergence',
    } );

    // -- pressure ---------------------------------------------------------------------------------
    const materialPressureInit = new Material(
      quadVert,
      colorFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );
    materialPressureInit.addUniform( 'color', '4f', 0.5, 0.0, 0.0, 1.0 );

    const quadPressureInit = new Quad( {
      target: swapPressure.i,
      material: materialPressureInit,
      name: process.env.DEV && 'quadPressureInit',
    } );

    swapPressure.swap();

    const quadPressures = [ ...Array( 20 ) ].map( ( _, i ) => {
      const material = new Material(
        quadVert,
        fluidPressureFrag( GRID_RESO_SQRT, GRID_RESO ),
        {
          initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
        },
      );
      material.addUniformTextures( 'samplerDivergence', bufferDivergence.texture );
      material.addUniformTextures( 'samplerPressure', swapPressure.o.texture );

      const quad = new Quad( {
        target: swapPressure.i,
        material,
        name: process.env.DEV && `quadPressure${ i }`,
      } );

      swapPressure.swap();

      return quad;
    } );

    // -- resolve pressure -------------------------------------------------------------------------
    const materialResolvePressure = new Material(
      quadVert,
      fluidResolvePressureFrag( GRID_RESO_SQRT, GRID_RESO ),
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );
    materialResolvePressure.addUniform( 'curl', '1f', 5.0 );
    materialResolvePressure.addUniformTextures( 'samplerCurl', bufferCurl.texture );
    materialResolvePressure.addUniformTextures( 'samplerPressure', swapPressure.o.texture );
    materialResolvePressure.addUniformTextures( 'samplerVelocity', swapVelocity.o.texture );

    const quadResolvePressure = new Quad( {
      target: swapVelocity.i,
      material: materialResolvePressure,
      name: process.env.DEV && 'quadResolvePressure',
    } );

    swapVelocity.swap();

    // -- advection --------------------------------------------------------------------------------
    const materialAdvectionVelocity = new Material(
      quadVert,
      fluidAdvectionFrag( GRID_RESO_SQRT, GRID_RESO ),
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );
    materialAdvectionVelocity.addUniform( 'dissipation', '1f', 0.1 );
    materialAdvectionVelocity.addUniformTextures( 'samplerVelocity', swapVelocity.o.texture );
    materialAdvectionVelocity.addUniformTextures( 'samplerSource', swapVelocity.o.texture );

    const quadAdvectionVelocity = new Quad( {
      target: swapVelocity.i,
      material: materialAdvectionVelocity,
      name: process.env.DEV && 'quadAdvectionVelocity',
    } );

    swapVelocity.swap();

    const materialAdvectionDensity = new Material(
      quadVert,
      fluidAdvectionFrag( GRID_RESO_SQRT, GRID_RESO ),
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );
    materialAdvectionDensity.addUniform( 'dissipation', '1f', 1.0 );
    materialAdvectionDensity.addUniformTextures( 'samplerVelocity', swapVelocity.o.texture );
    materialAdvectionDensity.addUniformTextures( 'samplerSource', swapDensity.o.texture );

    const quadAdvectionDensity = new Quad( {
      target: swapDensity.i,
      material: materialAdvectionDensity,
      name: process.env.DEV && 'quadAdvectionDensity',
    } );

    swapDensity.swap();

    // -- render -----------------------------------------------------------------------------------
    const { geometry } = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } );

    const forward = new Material(
      objectVert,
      fluidRenderFrag( GRID_RESO_SQRT, GRID_RESO ),
      {
        initOptions: { geometry, target: dummyRenderTarget },
        blend: [ gl.ONE, gl.ONE ],
      },
    );
    forward.addUniformTextures( 'samplerRandom', randomTexture.texture );
    forward.addUniformTextures( 'samplerDensity', swapDensity.o.texture );
    forward.addUniformTextures( 'samplerVelocity', swapVelocity.o.texture );

    const lambdaLightUniforms = createLightUniformsLambda( [ forward ] );

    const lambdaRaymarchCameraUniforms = createRaymarchCameraUniformsLambda( [ forward ] );

    const mesh = new Mesh( {
      geometry,
      materials: { forward, cubemap: forward },
      name: process.env.DEV && 'mesh',
    } );
    this.transform.scale = [ 1.0, 1.0, 1.0 ];
    mesh.depthTest = false;
    mesh.depthWrite = false;

    // -- shell ------------------------------------------------------------------------------------
    const shell = new TransparentShell( {
      insideChildren: [ mesh ],
    } );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      quadPokeDensity,
      quadCurl,
      quadDivergence,
      quadPressureInit,
      ...quadPressures,
      quadResolvePressure,
      quadAdvectionVelocity,
      quadAdvectionDensity,
      lambdaLightUniforms,
      lambdaRaymarchCameraUniforms,
      shell,
    ];
  }
}
