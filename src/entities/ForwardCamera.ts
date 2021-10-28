import { PerspectiveCamera } from '../heck/components/PerspectiveCamera';
import { RenderTarget } from '../heck/RenderTarget';
import { SceneNode, SceneNodeOptions } from '../heck/components/SceneNode';

export interface ForwardCameraOptions extends SceneNodeOptions {
  scenes: SceneNode[];
  target: RenderTarget;
  clear?: Array<number | undefined> | false;
}

export class ForwardCamera extends SceneNode {
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

    this.children.push( this.camera );
  }
}
