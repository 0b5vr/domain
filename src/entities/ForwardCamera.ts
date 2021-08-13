import { Entity, EntityOptions } from '../heck/Entity';
// import { LightEntity } from './LightEntity';
import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { RenderTarget } from '../heck/RenderTarget';

export interface ForwardCameraOptions extends EntityOptions {
  scenes: Entity[];
  target: RenderTarget;
  clear?: Array<number | undefined> | false;
  // lights: LightEntity[];
}

export class ForwardCamera extends Entity {
  public camera: PerspectiveCamera;

  public constructor( options: ForwardCameraOptions ) {
    super( options );

    this.camera = new PerspectiveCamera( {
      scenes: options.scenes,
      renderTarget: options.target,
      near: 0.1,
      far: 20.0,
      clear: options.clear ?? false,
      name: process.env.DEV && 'camera',
      materialTag: 'forward',
    } );

    this.components.push( this.camera );
  }
}
