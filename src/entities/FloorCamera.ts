import { Blit } from '../heck/components/Blit';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { CameraStack } from './CameraStack';
import { Floor } from './Floor';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { ONE_SUB_ONE_POINT_FIVE_POW_I } from '../utils/constants';
import { Quad } from '../heck/components/Quad';
import { RawMatrix4, Swap, mat4Inverse, mat4Multiply } from '@0b5vr/experimental';
import { SceneNode, SceneNodeOptions } from '../heck/components/SceneNode';
import { bloomDownFrag } from '../shaders/bloomDownFrag';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';

export interface FloorCameraOptions extends SceneNodeOptions {
  width: number;
  height: number;
  primaryCamera: CameraStack;
  floor: Floor;
}

export class FloorCamera extends SceneNode {
  public mirrorCamera: CameraStack;
  public mirrorTarget: BufferRenderTarget;
  public mipmapMirrorTarget: BufferRenderTarget;

  public constructor( { width, height, primaryCamera, floor }: FloorCameraOptions ) {
    super();

    // -- https://www.nicovideo.jp/watch/sm21005672 ------------------------------------------------
    this.mirrorTarget = new BufferRenderTarget( {
      width: 0.5 * primaryCamera.deferredCamera.renderTarget!.width,
      height: 0.5 * primaryCamera.deferredCamera.renderTarget!.height,
      name: process.env.DEV && `${ this.name }/mirrorTarget`,
    } );

    if ( process.env.DEV ) { this.mirrorTarget.name = `${ this.name }/mirrorTarget`; }

    const mirrorCamera = this.mirrorCamera = new CameraStack( {
      width,
      height,
      scene: primaryCamera.deferredCamera.scene!,
      target: this.mirrorTarget,
      name: process.env.DEV && 'floorCameraStack',
    } );

    this.children.push( new Lambda( {
      onUpdate: () => {
        const transformYNeg = this.globalTransformCache.matrix.concat() as RawMatrix4;
        transformYNeg[ 1 ] *= -1.0;
        transformYNeg[ 5 ] *= -1.0;
        transformYNeg[ 9 ] *= -1.0;
        transformYNeg[ 13 ] *= -1.0;

        mirrorCamera.transform.matrix = mat4Multiply(
          mat4Inverse( this.globalTransformCache.matrix ),
          transformYNeg,
        );

        mirrorCamera.deferredCamera.projectionMatrix = (
          primaryCamera.deferredCamera.projectionMatrix.concat() as RawMatrix4
        );
        mirrorCamera.deferredCamera.projectionMatrix[ 5 ] *= -1.0;
        mirrorCamera.deferredCamera.projectionMatrix[ 9 ] *= -1.0;
        mirrorCamera.forwardCamera.projectionMatrix = mirrorCamera.deferredCamera.projectionMatrix;
      },
    } ) );
    this.children.push( mirrorCamera );

    // -- create mipmaps ---------------------------------------------------------------------------
    const swapMirrorDownsampleTarget = new Swap(
      new BufferRenderTarget( {
        width,
        height,
        name: process.env.DEV && `${ this.name }/mirrorDownsampleTarget/swap0`,
      } ),
      new BufferRenderTarget( {
        width,
        height,
        name: process.env.DEV && `${ this.name }/mirrorDownsampleTarget/swap1`,
      } ),
    );

    this.mipmapMirrorTarget = new BufferRenderTarget( {
      width: width / 2,
      height: height / 2,
      levels: 6,
      name: process.env.DEV && `${ this.name }/mipmapMirrorTarget`,
    } );

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

      this.children.push( new Quad( {
        target: swapMirrorDownsampleTarget.i,
        material,
        range,
        name: `quadDown${ i }`,
      } ) );

      swapMirrorDownsampleTarget.swap();
      srcRange = range;

      const srcRect: [ number, number, number, number ] = [
        width * ONE_SUB_ONE_POINT_FIVE_POW_I[ i ],
        height * ONE_SUB_ONE_POINT_FIVE_POW_I[ i ],
        width * ONE_SUB_ONE_POINT_FIVE_POW_I[ i + 1 ],
        height * ONE_SUB_ONE_POINT_FIVE_POW_I[ i + 1 ],
      ];

      this.children.push( new Blit( {
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
