import { GLCatTexture } from '@0b5vr/glcat-ts';
import { glCat } from '../../globals/canvas';

export class CanvasTexture {
  public width: number;
  public height: number;
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public texture: GLCatTexture;

  public constructor( width: number, height: number ) {
    this.canvas = document.createElement( 'canvas' );
    this.canvas.width = this.width = width;
    this.canvas.height = this.height = height;

    this.context = this.canvas.getContext( '2d' )!;
    this.texture = glCat.createTexture();
  }

  public clear(): void {
    this.context.clearRect( 0, 0, this.width, this.height );
  }

  public updateTexture(): void {
    this.texture.setTexture( this.canvas );
  }
}
