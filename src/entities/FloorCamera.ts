import { Blit } from '../heck/components/Blit';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Floor } from './Floor';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { ONE_SUB_ONE_POINT_FIVE_POW_I } from '../utils/constants';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { Quad } from '../heck/components/Quad';
import { RESOLUTION } from '../config';
import { RawMatrix4, Swap, mat4Inverse, mat4Multiply } from '@0b5vr/experimental';
import { SceneNode } from '../heck/components/SceneNode';
import { bloomDownFrag } from '../shaders/bloomDownFrag';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';

export class FloorCamera extends SceneNode {
  public mirrorCameraNode: SceneNode;
  public primaryCameraNode: SceneNode;
  public primaryCamera: PerspectiveCamera;
  public mirrorCamera: PerspectiveCamera;
  public mirrorTarget: BufferRenderTarget;
  public mipmapMirrorTarget: BufferRenderTarget;

  public constructor(
    primaryCameraNode: SceneNode,
    primaryCamera: PerspectiveCamera,
    floor: Floor,
  ) {
    super();

    // -- https://www.nicovideo.jp/watch/sm21005672 ------------------------------------------------
    this.mirrorCameraNode = new SceneNode( {
      name: process.env.DEV && 'mirrorCameraNode',
    } );

    this.children.push( new Lambda( {
      onUpdate: () => {
        const transformYNeg = this.globalTransformCache.matrix.concat() as RawMatrix4;
        transformYNeg[ 1 ] *= -1.0;
        transformYNeg[ 5 ] *= -1.0;
        transformYNeg[ 9 ] *= -1.0;
        transformYNeg[ 13 ] *= -1.0;

        this.mirrorCameraNode.transform.matrix = mat4Multiply(
          mat4Inverse( this.globalTransformCache.matrix ),
          transformYNeg,
        );
      },
    } ) );
    this.children.push( this.mirrorCameraNode );

    this.primaryCameraNode = primaryCameraNode;
    this.primaryCamera = primaryCamera;
    this.mirrorTarget = new BufferRenderTarget( {
      width: primaryCamera.renderTarget!.width,
      height: primaryCamera.renderTarget!.height,
      name: process.env.DEV && `${ this.name }/mirrorTarget`,
    } );

    this.mirrorCamera = new PerspectiveCamera( {
      materialTag: 'cubemap',
      renderTarget: this.mirrorTarget,
      scenes: this.primaryCamera.scenes,
    } );
    this.mirrorCameraNode.children.push( this.mirrorCamera );

    this.children.push( new Lambda( {
      onUpdate: () => {
        this.mirrorCamera.projectionMatrix = (
          this.primaryCamera.projectionMatrix.concat() as RawMatrix4
        );
        this.mirrorCamera.projectionMatrix[ 5 ] *= -1.0;
      },
    } ) );

    // -- create mipmaps ---------------------------------------------------------------------------
    const swapMirrorDownsampleTarget = new Swap(
      new BufferRenderTarget( {
        width: RESOLUTION[ 0 ],
        height: RESOLUTION[ 1 ],
        name: process.env.DEV && `${ this.name }/mirrorDownsampleTarget/swap0`,
      } ),
      new BufferRenderTarget( {
        width: RESOLUTION[ 0 ],
        height: RESOLUTION[ 1 ],
        name: process.env.DEV && `${ this.name }/mirrorDownsampleTarget/swap1`,
      } ),
    );

    this.mipmapMirrorTarget = new BufferRenderTarget( {
      width: RESOLUTION[ 0 ] / 2,
      height: RESOLUTION[ 1 ] / 2,
      levels: 6,
      name: process.env.DEV && `${ this.name }/mipmapMirrorTarget`,
    } );

    const mipmapNode = new SceneNode( {
      name: process.env.DEV && 'mipmapNode',
    } );
    this.children.push( mipmapNode );

    let srcRange = [ -1.0, -1.0, 1.0, 1.0 ];

    this.mipmapMirrorTarget.mipmapTargets?.map( ( target, i ) => {
      const material = new Material(
        quadVert,
        bloomDownFrag( false ),
        { initOptions: { target: dummyRenderTarget, geometry: quadGeometry } },
      );

      material.addUniform( 'gain', '1f', 1.0 );
      material.addUniform( 'bias', '1f', 0.0 );
      material.addUniformVector( 'srcRange', '4fv', srcRange.map( ( v ) => 0.5 + 0.5 * v ) );
      material.addUniformTextures(
        'sampler0',
        ( i === 0 ) ? this.mirrorTarget.texture : swapMirrorDownsampleTarget.o.texture,
      );

      const range: [ number, number, number, number ] = [
        2.0 * ONE_SUB_ONE_POINT_FIVE_POW_I[ i ] - 1.0,
        2.0 * ONE_SUB_ONE_POINT_FIVE_POW_I[ i ] - 1.0,
        2.0 * ONE_SUB_ONE_POINT_FIVE_POW_I[ i + 1 ] - 1.0,
        2.0 * ONE_SUB_ONE_POINT_FIVE_POW_I[ i + 1 ] - 1.0,
      ];

      mipmapNode.children.push( new Quad( {
        target: swapMirrorDownsampleTarget.i,
        material,
        range,
        name: `quadDown${ i }`,
      } ) );

      swapMirrorDownsampleTarget.swap();
      srcRange = range;

      const srcRect: [ number, number, number, number ] = [
        RESOLUTION[ 0 ] * ONE_SUB_ONE_POINT_FIVE_POW_I[ i ],
        RESOLUTION[ 1 ] * ONE_SUB_ONE_POINT_FIVE_POW_I[ i ],
        RESOLUTION[ 0 ] * ONE_SUB_ONE_POINT_FIVE_POW_I[ i + 1 ],
        RESOLUTION[ 1 ] * ONE_SUB_ONE_POINT_FIVE_POW_I[ i + 1 ],
      ];

      mipmapNode.children.push( new Blit( {
        src: swapMirrorDownsampleTarget.o,
        dst: target,
        srcRect,
        name: `blitDown${ i }`,
      } ) );
    } );

    // -- update floor texture ---------------------------------------------------------------------
    this.children.push( new Lambda( {
      onUpdate: () => {
        floor.setMipmapMirrorTarget( this.mipmapMirrorTarget );
      },
    } ) );
  }
}
