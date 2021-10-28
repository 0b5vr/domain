import { Component, ComponentOptions, ComponentUpdateEvent } from './Component';
import { MaterialTag } from '../Material';
import { RawMatrix4, mat4Inverse } from '@0b5vr/experimental';
import { RenderTarget } from '../RenderTarget';
import { SceneNode } from './SceneNode';
import { Transform } from '../Transform';
import { glCat } from '../../globals/canvas';

export interface CameraOptions extends ComponentOptions {
  renderTarget?: RenderTarget;
  projectionMatrix: RawMatrix4;
  materialTag: MaterialTag;
  scenes?: SceneNode[];
  clear?: Array<number | undefined> | false;
}

export abstract class Camera extends Component {
  public projectionMatrix: RawMatrix4;

  public renderTarget?: RenderTarget;

  public scenes?: SceneNode[];

  public clear: Array<number | undefined> | false;

  public materialTag: MaterialTag;

  public abstract get near(): number;

  public abstract get far(): number;

  public constructor( options: CameraOptions ) {
    super( options );

    this.visible = false;

    this.renderTarget = options.renderTarget;
    this.scenes = options.scenes;
    this.projectionMatrix = options.projectionMatrix;
    this.materialTag = options.materialTag;
    this.clear = options.clear ?? [];
  }

  protected __updateImpl( {
    componentsByTag,
    frameCount,
    globalTransform,
    time,
  }: ComponentUpdateEvent ): void {
    const { renderTarget, scenes } = this;

    if ( !renderTarget ) {
      throw process.env.DEV && new Error( 'You must assign a renderTarget to the Camera' );
    }

    if ( !scenes ) {
      throw process.env.DEV && new Error( 'You must assign scenes to the Camera' );
    }

    const viewMatrix = mat4Inverse( globalTransform.matrix );

    renderTarget.bind();

    if ( this.clear ) {
      glCat.clear( ...this.clear );
    }

    scenes.map( ( scene ) => {
      scene.draw( {
        frameCount,
        time: time,
        renderTarget,
        cameraTransform: globalTransform,
        globalTransform: new Transform(),
        componentsByTag,
        viewMatrix,
        projectionMatrix: this.projectionMatrix,
        camera: this,
        ancestors: [],
        materialTag: this.materialTag,
        path: process.env.DEV && `(${ this.materialTag }) `,
      } );
    } );
  }
}
