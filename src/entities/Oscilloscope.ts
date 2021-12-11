import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode } from '../heck/components/SceneNode';
import { createCubemapUniformsLambda } from './utils/createCubemapUniformsLambda';
import { createLightUniformsLambda } from './utils/createLightUniformsLambda';
import { depthFrag } from '../shaders/depthFrag';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genCube } from '../geometries/genCube';
import { gl, glCat } from '../globals/canvas';
import { objectVert } from '../shaders/objectVert';
import { oscilloscopeFrag } from '../shaders/oscilloscopeFrag';
import { oscilloscopeFrontFrag } from '../shaders/oscilloscopeFrontFrag';
import { oscilloscopeMeasureFrag } from '../shaders/oscilloscopeMeasureFrag';
import { oscilloscopeVert } from '../shaders/oscilloscopeVert';

const points = 2048;

export class Oscilloscope extends SceneNode {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = new Geometry();

    const bufferInstanceId = glCat.createBuffer();
    bufferInstanceId.setVertexbuffer( ( () => {
      const ret = new Float32Array( points );
      for ( let i = 0; i < points; i ++ ) {
        ret[ i ] = i / points;
      }
      return ret;
    } )() );

    geometry.vao.bindVertexbuffer( bufferInstanceId, 0, 1 );

    geometry.count = points;
    geometry.mode = gl.POINTS;

    // -- material ---------------------------------------------------------------------------------
    const forward = new Material(
      oscilloscopeVert,
      oscilloscopeFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget },
        blend: [ gl.ONE, gl.ONE ],
      },
    );

    if ( process.env.DEV ) {
      module.hot?.accept(
        [
          '../shaders/oscilloscopeVert',
          '../shaders/oscilloscopeFrag',
        ],
        () => {
          forward.replaceShader( oscilloscopeVert, oscilloscopeFrag );
        },
      );
    }

    // -- mesh -------------------------------------------------------------------------------------
    const meshScope = new Mesh( {
      geometry,
      materials: { forward },
    } );
    meshScope.depthWrite = false;

    // -- measure ----------------------------------------------------------------------------------
    const geometryMeasure = genCube( { dimension: [ -0.5, -0.5, -0.5 ] } ).geometry;

    const deferredMeasure = new Material(
      objectVert,
      oscilloscopeMeasureFrag,
      {
        initOptions: { geometry: geometryMeasure, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    if ( process.env.DEV ) {
      module.hot?.accept(
        [
          '../shaders/oscilloscopeMeasureFrag',
        ],
        () => {
          deferredMeasure.replaceShader( objectVert, oscilloscopeMeasureFrag );
        },
      );
    }

    const meshMeasure = new Mesh( {
      geometry: geometryMeasure,
      materials: { deferred: deferredMeasure },
    } );

    // -- front ------------------------------------------------------------------------------------
    const geometryFront = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } ).geometry;

    const forwardFront = new Material(
      objectVert,
      oscilloscopeFrontFrag,
      {
        initOptions: { geometry: geometryFront, target: dummyRenderTarget },
        blend: [ gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA ],
      },
    );

    const depthFront = new Material(
      objectVert,
      depthFrag,
      {
        initOptions: { geometry: geometryFront, target: dummyRenderTarget },
      },
    );

    if ( process.env.DEV ) {
      module.hot?.accept(
        [
          '../shaders/oscilloscopeFrontFrag',
        ],
        () => {
          forwardFront.replaceShader( objectVert, oscilloscopeFrontFrag );
          depthFront.replaceShader( objectVert, depthFrag );
        },
      );
    }

    const meshFront = new Mesh( {
      geometry: geometryFront,
      materials: { forward: forwardFront, depth: depthFront },
    } );

    // -- receive stuff ----------------------------------------------------------------------------
    const lightUniformsLambda = createLightUniformsLambda( [ forwardFront ] );
    const lambdaCubemap = createCubemapUniformsLambda( [ forwardFront ] );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lightUniformsLambda,
      lambdaCubemap,
      meshMeasure,
      meshScope,
      meshFront,
    ];

    if ( process.env.DEV ) {
      meshMeasure.name = 'meshMeasure';
      meshScope.name = 'meshScope';
      meshFront.name = 'meshFront';
    }
  }
}
