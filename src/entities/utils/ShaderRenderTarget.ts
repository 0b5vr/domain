import { BufferRenderTarget, BufferRenderTargetOptions } from '../../heck/BufferRenderTarget';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';

export class ShaderRenderTarget extends BufferRenderTarget {
  public material: Material;
  public quad: Quad;

  public constructor(
    options: BufferRenderTargetOptions & {
      material: Material,
    },
  ) {
    super( options );

    const material = this.material = options.material;

    const quad = this.quad = new Quad( {
      material,
      target: this,
    } );
    quad.drawImmediate();
  }
}
