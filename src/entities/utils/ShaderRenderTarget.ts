import { BufferRenderTarget } from '../../heck/BufferRenderTarget';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { dummyRenderTarget } from '../../globals/dummyRenderTarget';
import { gl } from '../../globals/canvas';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/quadVert';

export class ShaderRenderTarget extends BufferRenderTarget {
  public material: Material;
  public quad: Quad;

  public constructor( resolution: number, frag: string, name?: string ) {
    super( {
      width: resolution,
      height: resolution,
      filter: gl.LINEAR,
      name,
    } );

    const material = this.material = new Material(
      quadVert,
      frag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );

    const quad = this.quad = new Quad( {
      material,
      target: this,
    } );
    quad.drawImmediate();
  }
}
