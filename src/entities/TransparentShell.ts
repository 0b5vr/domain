import { Component } from '../heck/components/Component';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { SceneNode, SceneNodeOptions } from '../heck/components/SceneNode';
import { createCubemapUniformsLambda } from './utils/createCubemapUniformsLambda';
import { createLightUniformsLambda } from './utils/createLightUniformsLambda';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { forwardPBRColorFrag } from '../shaders/forwardPBRColorFrag';
import { genCube } from '../geometries/genCube';
import { gl } from '../globals/canvas';
import { objectVert } from '../shaders/objectVert';

export interface TransparentShellOptions extends SceneNodeOptions {
  baseColor?: [ number, number, number ];
  roughness?: number;
  roughnessNoise?: number;
  metallic?: number;
  opacity?: number;
  insideChildren?: Component[];
}

export class TransparentShell extends SceneNode {
  public constructor( options: TransparentShellOptions ) {
    super( options );

    const { baseColor, roughness, roughnessNoise, metallic, opacity, insideChildren } = options;

    // -- shell ------------------------------------------------------------------------------------
    const geometryShellFront = genCube( { dimension: [ 0.5, 0.5, 0.5 ] } ).geometry;
    const geometryShellBack = genCube( { dimension: [ -0.5, -0.5, -0.5 ] } ).geometry;

    const forwardShell = new Material(
      objectVert,
      forwardPBRColorFrag,
      {
        initOptions: { geometry: geometryShellFront, target: dummyRenderTarget },
        blend: [ gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA ],
      },
    );
    forwardShell.addUniform( 'baseColor', '3f', ...( baseColor ?? [ 1.0, 1.0, 1.0 ] ) );
    forwardShell.addUniform( 'roughness', '1f', roughness ?? 0.0 );
    forwardShell.addUniform( 'roughnessNoise', '1f', roughnessNoise ?? 0.0 );
    forwardShell.addUniform( 'metallic', '1f', metallic ?? 0.0 );
    forwardShell.addUniform( 'opacity', '1f', opacity ?? 0.01 );

    const meshShellFront = new Mesh( {
      geometry: geometryShellFront,
      materials: { forward: forwardShell },
    } );
    meshShellFront.depthWrite = false;

    const meshShellBack = new Mesh( {
      geometry: geometryShellBack,
      materials: { forward: forwardShell },
    } );
    meshShellBack.depthWrite = false;

    // -- receive stuff ----------------------------------------------------------------------------
    const lightUniformsLambda = createLightUniformsLambda( [ forwardShell ] );
    const lambdaCubemap = createCubemapUniformsLambda( [ forwardShell ] );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lightUniformsLambda,
      lambdaCubemap,
      meshShellBack,
      ...( insideChildren ?? [] ),
      meshShellFront,
    ];

    if ( process.env.DEV ) {
      lightUniformsLambda.name = 'lightUniformsLambda';
      lambdaCubemap.name = 'lambdaCubemap';
      meshShellBack.name = 'meshShellBack';
      meshShellFront.name = 'meshShellFront';
    }
  }
}
