import { BoundingBox } from './BoundingBox';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { Quad } from '../heck/components/Quad';
import { Quaternion, Swap, Vector3 } from '@fms-cat/experimental';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { gl } from '../globals/canvas';
import { gui } from '../globals/gui';
import { quadGeometry } from '../globals/quadGeometry';
import { randomTexture } from '../globals/randomTexture';
import colorFrag from '../shaders/color.frag';
import fluidAdvectionFrag from '../shaders/fluid-advection.frag';
import fluidCurlFrag from '../shaders/fluid-curl.frag';
import fluidDivergenceFrag from '../shaders/fluid-divergence.frag';
import fluidPokeDensityFrag from '../shaders/fluid-poke-density.frag';
import fluidPressureFrag from '../shaders/fluid-pressure.frag';
import fluidRenderFrag from '../shaders/fluid-render.frag';
import fluidResolvePressureFrag from '../shaders/fluid-resolve-pressure.frag';
import quadVert from '../shaders/quad.vert';
import raymarchObjectVert from '../shaders/raymarch-object.vert';

const GRID_RESO_SQRT = 8;
const GRID_RESO = GRID_RESO_SQRT * GRID_RESO_SQRT;
const BUFFER_RESO = GRID_RESO * GRID_RESO_SQRT;

export class Fluid extends Entity {
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
      fluidPokeDensityFrag,
      {
        defines: [ `GRID_RESO ${ GRID_RESO }`, `GRID_RESO_SQRT ${ GRID_RESO_SQRT }` ],
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
      fluidCurlFrag,
      {
        defines: [ `GRID_RESO ${ GRID_RESO }`, `GRID_RESO_SQRT ${ GRID_RESO_SQRT }` ],
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
      fluidDivergenceFrag,
      {
        defines: [ `GRID_RESO ${ GRID_RESO }`, `GRID_RESO_SQRT ${ GRID_RESO_SQRT }` ],
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
        defines: [ `GRID_RESO ${ GRID_RESO }`, `GRID_RESO_SQRT ${ GRID_RESO_SQRT }` ],
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );
    materialPressureInit.addUniform( 'color', '4f', 0.5, 0.0, 0.0, 1.0 );

    gui.folder( 'Fluid' ).input( 'pressure', 0.5 ).on( 'change', ( { value } ) => {
      materialPressureInit.addUniform( 'color', '4f', value, 0.0, 0.0, 1.0 );
    } );

    const quadPressureInit = new Quad( {
      target: swapPressure.i,
      material: materialPressureInit,
      name: process.env.DEV && 'quadPressureInit',
    } );

    swapPressure.swap();

    const quadPressures = [ ...Array( 20 ) ].map( ( _, i ) => {
      const material = new Material(
        quadVert,
        fluidPressureFrag,
        {
          defines: [ `GRID_RESO ${ GRID_RESO }`, `GRID_RESO_SQRT ${ GRID_RESO_SQRT }` ],
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
      fluidResolvePressureFrag,
      {
        defines: [ `GRID_RESO ${ GRID_RESO }`, `GRID_RESO_SQRT ${ GRID_RESO_SQRT }` ],
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );
    materialResolvePressure.addUniform( 'curl', '1f', 5.0 );
    materialResolvePressure.addUniformTextures( 'samplerCurl', bufferCurl.texture );
    materialResolvePressure.addUniformTextures( 'samplerPressure', swapPressure.o.texture );
    materialResolvePressure.addUniformTextures( 'samplerVelocity', swapVelocity.o.texture );

    gui.folder( 'Fluid' ).input( 'curl', 5.0 ).on( 'change', ( { value } ) => {
      materialResolvePressure.addUniform( 'curl', '1f', value );
    } );

    const quadResolvePressure = new Quad( {
      target: swapVelocity.i,
      material: materialResolvePressure,
      name: process.env.DEV && 'quadResolvePressure',
    } );

    swapVelocity.swap();

    // -- advection --------------------------------------------------------------------------------
    const materialAdvectionVelocity = new Material(
      quadVert,
      fluidAdvectionFrag,
      {
        defines: [ `GRID_RESO ${ GRID_RESO }`, `GRID_RESO_SQRT ${ GRID_RESO_SQRT }` ],
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );
    materialAdvectionVelocity.addUniform( 'dissipation', '1f', 0.1 );
    materialAdvectionVelocity.addUniformTextures( 'samplerVelocity', swapVelocity.o.texture );
    materialAdvectionVelocity.addUniformTextures( 'samplerSource', swapVelocity.o.texture );

    gui.folder( 'Fluid' ).input( 'velocity dissipation', 0.1 ).on( 'change', ( { value } ) => {
      materialAdvectionVelocity.addUniform( 'dissipation', '1f', value );
    } );

    const quadAdvectionVelocity = new Quad( {
      target: swapVelocity.i,
      material: materialAdvectionVelocity,
      name: process.env.DEV && 'quadAdvectionVelocity',
    } );

    swapVelocity.swap();

    const materialAdvectionDensity = new Material(
      quadVert,
      fluidAdvectionFrag,
      {
        defines: [ `GRID_RESO ${ GRID_RESO }`, `GRID_RESO_SQRT ${ GRID_RESO_SQRT }` ],
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget },
      },
    );
    materialAdvectionDensity.addUniform( 'dissipation', '1f', 1.0 );
    materialAdvectionDensity.addUniformTextures( 'samplerVelocity', swapVelocity.o.texture );
    materialAdvectionDensity.addUniformTextures( 'samplerSource', swapDensity.o.texture );

    gui.folder( 'Fluid' ).input( 'density dissipation', 0.1 ).on( 'change', ( { value } ) => {
      materialAdvectionDensity.addUniform( 'dissipation', '1f', value );
    } );

    const quadAdvectionDensity = new Quad( {
      target: swapDensity.i,
      material: materialAdvectionDensity,
      name: process.env.DEV && 'quadAdvectionDensity',
    } );

    swapDensity.swap();

    // -- render -----------------------------------------------------------------------------------
    const cube = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( cube.position, 0, 3 );
    geometry.vao.bindIndexbuffer( cube.index );

    geometry.count = cube.count;
    geometry.mode = cube.mode;
    geometry.indexType = cube.indexType;

    const forward = new Material(
      raymarchObjectVert,
      fluidRenderFrag,
      {
        defines: [ `GRID_RESO ${ GRID_RESO }`, `GRID_RESO_SQRT ${ GRID_RESO_SQRT }` ],
        initOptions: { geometry, target: dummyRenderTarget },
        blend: [ gl.ONE, gl.ONE ],
      },
    );
    forward.addUniformTextures( 'samplerRandom', randomTexture.texture );
    forward.addUniformTextures( 'samplerDensity', swapDensity.o.texture );
    forward.addUniformTextures( 'samplerVelocity', swapVelocity.o.texture );

    const lambdaSetCameraUniforms = new Lambda( {
      onDraw: ( event ) => {
        forward.addUniform(
          'cameraNearFar',
          '2f',
          event.camera.near,
          event.camera.far
        );

        forward.addUniformMatrixVector(
          'inversePVM',
          'Matrix4fv',
          event.projectionMatrix
            .multiply( event.viewMatrix )
            .multiply( event.globalTransform.matrix )
            .inverse!
            .elements
        );
      },
      name: process.env.DEV && 'lambdaSetCameraUniforms',
    } );

    const mesh = new Mesh( {
      geometry,
      materials: { forward },
      name: process.env.DEV && 'mesh',
    } );
    this.transform.scale = Vector3.one.scale( 3.0 );
    mesh.depthTest = false;
    mesh.depthWrite = false;

    // -- speen ------------------------------------------------------------------------------------
    const speenAxis = new Vector3( [ 1.0, 1.0, 1.0 ] ).normalized;

    const lambdaSpeen = new Lambda( {
      onUpdate: ( { time } ) => {
        this.transform.rotation = Quaternion.fromAxisAngle( speenAxis, 0.1 * time );
      },
      name: process.env.DEV && 'speen',
    } );

    // -- components -------------------------------------------------------------------------------
    this.components = [
      lambdaSpeen,
      quadPokeDensity,
      quadCurl,
      quadDivergence,
      quadPressureInit,
      ...quadPressures,
      quadResolvePressure,
      quadAdvectionVelocity,
      quadAdvectionDensity,
      lambdaSetCameraUniforms,
      mesh,
    ];

    // -- bounding box -----------------------------------------------------------------------------
    const boundingBox = new BoundingBox();
    boundingBox.transform.scale = Vector3.one.scale( 0.5 );
    this.children.push( boundingBox );
  }
}
