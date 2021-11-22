import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode, SceneNodeOptions } from '../heck/components/SceneNode';
import { ShaderRenderTarget } from './utils/ShaderRenderTarget';
import { TRIANGLE_STRIP_QUAD_3D, TRIANGLE_STRIP_QUAD_NORMAL, TRIANGLE_STRIP_QUAD_UV } from '@0b5vr/experimental';
import { createRaymarchCameraUniformsLambda } from './utils/createRaymarchCameraUniformsLambda';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { gl, glCat } from '../globals/canvas';
import { objectVert } from '../shaders/objectVert';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';
import { wallFrag } from '../shaders/wallFrag';
import { wallTextureFrag } from '../shaders/wallTextureFrag';

// -- geometry -------------------------------------------------------------------------------------
const bufferPos = glCat.createBuffer();
bufferPos.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_3D ) );

const bufferNormal = glCat.createBuffer();
bufferNormal.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_NORMAL ) );

const bufferUv = glCat.createBuffer();
bufferUv.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_UV ) );

const geometry = new Geometry();

geometry.vao.bindVertexbuffer( bufferPos, 0, 3 );
geometry.vao.bindVertexbuffer( bufferNormal, 1, 3 );
geometry.vao.bindVertexbuffer( bufferUv, 2, 2 );

geometry.count = 4;
geometry.mode = gl.TRIANGLE_STRIP;

// -- generate texture -----------------------------------------------------------------------------
export const wallTexture = new ShaderRenderTarget( {
  width: 4096,
  height: 4096,
  filter: gl.LINEAR,
  material: new Material(
    quadVert,
    wallTextureFrag,
    { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
  ),
  name: process.env.DEV && 'Wall/roughness',
} );

if ( process.env.DEV ) {
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/wallTextureFrag',
      ],
      () => {
        wallTexture.material.replaceShader( quadVert, wallTextureFrag ).then( () => {
          wallTexture.quad.drawImmediate();
        } );
      },
    );
  }
}

// -- material -------------------------------------------------------------------------------------
const deferred = new Material(
  objectVert,
  wallFrag( 'deferred' ),
  {
    initOptions: { geometry, target: dummyRenderTargetFourDrawBuffers },
  },
);
deferred.addUniformTextures( 'samplerTexture', wallTexture.texture );

const depth = new Material(
  objectVert,
  wallFrag( 'depth' ),
  {
    initOptions: { geometry, target: dummyRenderTarget },
  },
);

const materials = { deferred, depth };

if ( process.env.DEV ) {
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/wallFrag',
      ],
      () => {
        deferred.replaceShader( objectVert, wallFrag( 'deferred' ) );
        depth.replaceShader( objectVert, wallFrag( 'depth' ) );
      },
    );
  }
}

export class Wall extends SceneNode {
  public constructor( options?: SceneNodeOptions ) {
    super( options );

    this.transform.scale = [ 8.1, 8.1, 8.1 ];

    // -- lambda -----------------------------------------------------------------------------------
    const lambdaRaymarchCameraUniforms = createRaymarchCameraUniformsLambda( [
      deferred,
      depth,
    ] );

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( { geometry, materials } );

    // -- components -------------------------------------------------------------------------------
    this.children = [ lambdaRaymarchCameraUniforms, mesh ];
  }
}
