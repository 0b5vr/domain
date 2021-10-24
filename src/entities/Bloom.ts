import { Blit } from '../heck/components/Blit';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Material } from '../heck/Material';
import { ONE_SUB_ONE_POINT_FIVE_POW_I } from '../utils/constants';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { Swap } from '@0b5vr/experimental';
import { bloomDownFrag } from '../shaders/bloomDownFrag';
import { bloomUpFrag } from '../shaders/bloomUpFrag';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl } from '../globals/canvas';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';

export interface BloomOptions {
  input: BufferRenderTarget;
  target: RenderTarget;
}

export class Bloom extends Entity {
  public constructor( options: BloomOptions ) {
    super();

    const { width, height } = options.target;

    const swap = new Swap(
      new BufferRenderTarget( {
        width,
        height,
        name: process.env.DEV && 'Bloom/swap0',
      } ),
      new BufferRenderTarget( {
        width,
        height,
        name: process.env.DEV && 'Bloom/swap1',
      } ),
    );

    // -- dry --------------------------------------------------------------------------------------
    this.components.push( new Blit( {
      src: options.input,
      dst: options.target,
      name: process.env.DEV && 'blitDry',
    } ) );

    // -- down -------------------------------------------------------------------------------------
    let srcRange = [ -1.0, -1.0, 1.0, 1.0 ];

    for ( let i = 0; i < 6; i ++ ) {
      const material = new Material(
        quadVert,
        bloomDownFrag( 0 === 0 ),
        { initOptions: { target: dummyRenderTarget, geometry: quadGeometry } },
      );

      material.addUniform( 'bias', '1f', -0.3 );
      material.addUniform( 'gain', '1f', 2.0 );
      material.addUniformVector( 'srcRange', '4fv', srcRange.map( ( v ) => 0.5 + 0.5 * v ) );
      material.addUniformTextures(
        'sampler0',
        ( i === 0 ) ? options.input.texture : swap.i.texture,
      );

      const rangeMin = 2.0 * ONE_SUB_ONE_POINT_FIVE_POW_I[ i ] - 1.0;
      const rangeMax = 2.0 * ONE_SUB_ONE_POINT_FIVE_POW_I[ i + 1 ] - 1.0;
      const range: [ number, number, number, number ] = (
        [ rangeMin, rangeMin, rangeMax, rangeMax ]
      );

      this.components.push( new Quad( {
        target: swap.o,
        material,
        range,
        name: `quadDown${ i }`,
      } ) );

      swap.swap();
      srcRange = range;
    }

    // -- up ---------------------------------------------------------------------------------------
    for ( let i = 5; i >= 0; i -- ) {
      const isLast = i === 0;

      const material = new Material(
        quadVert,
        bloomUpFrag,
        {
          initOptions: { target: dummyRenderTarget, geometry: quadGeometry },
          blend: [ gl.ONE, gl.ONE ],
        },
      );

      material.addUniformVector( 'srcRange', '4fv', srcRange.map( ( v ) => 0.5 + 0.5 * v ) );
      material.addUniformTextures(
        'sampler0',
        swap.i.texture,
      );

      const rangeMin = 2.0 * ONE_SUB_ONE_POINT_FIVE_POW_I[ i - 1 ] - 1.0;
      const rangeMax = isLast ? 1.0 : 2.0 * ONE_SUB_ONE_POINT_FIVE_POW_I[ i ] - 1.0;
      const range: [ number, number, number, number ] = isLast
        ? [ -1.0, -1.0, 1.0, 1.0 ]
        : [ rangeMin, rangeMin, rangeMax, rangeMax ];

      this.components.push( new Quad( {
        target: isLast ? options.target : swap.o,
        material,
        range,
        name: `quadUp${ i }`,
      } ) );

      swap.swap();
      srcRange = range;
    }
  }
}
