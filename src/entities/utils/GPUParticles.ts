import { BufferRenderTarget, BufferRenderTargetOptions } from '../../heck/BufferRenderTarget';
import { Geometry } from '../../heck/Geometry';
import { Lambda } from '../../heck/components/Lambda';
import { Material, MaterialMap } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { Quad } from '../../heck/components/Quad';
import { SceneNode, SceneNodeOptions } from '../../heck/components/SceneNode';
import { Swap } from '@0b5vr/experimental';
import { gl } from '../../globals/canvas';

export interface GPUParticlesOptions extends SceneNodeOptions {
  materialCompute: Material;
  geometryRender: Geometry;
  materialsRender: MaterialMap;
  computeWidth: number;
  computeHeight: number;
  computeNumBuffers: number;
}

export class GPUParticles extends SceneNode {
  public meshRender: Mesh;

  public constructor( options: GPUParticlesOptions ) {
    super( options );

    const {
      materialCompute,
      geometryRender,
      materialsRender,
      computeWidth,
      computeHeight,
      computeNumBuffers,
    } = options;

    const brtOptions: BufferRenderTargetOptions = {
      width: computeWidth,
      height: computeHeight,
      numBuffers: computeNumBuffers,
    };

    const swapCompute = new Swap(
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && `${ this.name }/swap0`,
        filter: gl.NEAREST,
      } ),
      new BufferRenderTarget( {
        ...brtOptions,
        name: process.env.DEV && `${ this.name }/swap1`,
        filter: gl.NEAREST,
      } ),
    );

    // -- compute ----------------------------------------------------------------------------------
    const quadCompute = new Quad( {
      target: swapCompute.o,
      material: materialCompute,
      name: process.env.DEV && 'quadCompute',
    } );

    // -- render -----------------------------------------------------------------------------------
    this.meshRender = new Mesh( {
      geometry: geometryRender,
      materials: materialsRender,
      name: process.env.DEV && 'meshRender',
    } );

    Object.values( materialsRender ).map( ( material ) => {
      material?.addUniform(
        'resolutionCompute',
        '2f',
        computeWidth,
        computeHeight
      );
    } );

    // -- swapper ----------------------------------------------------------------------------------
    this.children.push( new Lambda( {
      onUpdate: () => {
        swapCompute.swap();

        for ( let i = 0; i < computeNumBuffers; i ++ ) {
          const attachment = gl.COLOR_ATTACHMENT0 + i;

          materialCompute.addUniformTextures(
            `samplerCompute${ i }`,
            swapCompute.i.getTexture( attachment )!
          );

          Object.values( materialsRender ).map( ( material ) => {
            material?.addUniformTextures(
              `samplerCompute${ i }`,
              swapCompute.o.getTexture( attachment )!
            );
          } );
        }

        quadCompute.target = swapCompute.o;
      },
      name: process.env.DEV && 'swapper',
    } ) );

    // -- rest of components -----------------------------------------------------------------------
    this.children.push(
      quadCompute,
      this.meshRender,
    );
  }
}
