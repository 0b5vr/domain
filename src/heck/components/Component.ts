import { Camera } from './Camera';
import { Entity } from '../Entity';
import { MapOfSet } from '../../utils/MapOfSet';
import { MaterialTag } from '../Material';
import { Matrix4 } from '@0b5vr/experimental';
import { RenderTarget } from '../RenderTarget';
import { Transform } from '../Transform';
import { guiMeasureDraw, guiMeasureUpdate } from '../../globals/gui';

export interface ComponentUpdateEvent {
  frameCount: number;
  time: number;
  deltaTime: number;
  globalTransform: Transform;
  entity: Entity;
  entitiesByComponent: MapOfSet<string, Entity>;
}

export interface ComponentDrawEvent {
  frameCount: number;
  time: number;
  camera: Camera;
  cameraTransform: Transform;
  materialTag: MaterialTag;
  renderTarget: RenderTarget;
  globalTransform: Transform;
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
  entity: Entity;
  entitiesByComponent: MapOfSet<string, Entity>;
}

export interface ComponentOptions {
  active?: boolean;
  visible?: boolean;
  name?: string;
  ignoreBreakpoints?: boolean;
}

export class Component {
  public lastUpdateFrame = 0;

  public active: boolean;
  public visible: boolean;

  public name?: string;

  public constructor( options?: ComponentOptions ) {
    this.active = options?.active ?? true;
    this.visible = options?.visible ?? true;

    if ( process.env.DEV ) {
      this.name = options?.name ?? ( this as any ).constructor.name;
    }
  }

  public update( event: ComponentUpdateEvent ): void {
    if ( !this.active ) { return; }
    if ( this.lastUpdateFrame === event.frameCount ) { return; }
    this.lastUpdateFrame = event.frameCount;

    if ( process.env.DEV ) {
      guiMeasureUpdate( this.name ?? this.constructor.name, () => {
        this.__updateImpl( event );
      } );
    } else {
      this.__updateImpl( event );
    }
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void { // eslint-disable-line
    // do nothing
  }

  public draw( event: ComponentDrawEvent ): void {
    if ( !this.visible ) { return; }

    if ( process.env.DEV ) {
      guiMeasureDraw( this.name ?? this.constructor.name, () => {
        this.__drawImpl( event );
      } );
    } else {
      this.__drawImpl( event );
    }
  }

  protected __drawImpl( event: ComponentDrawEvent ): void { // eslint-disable-line
    // do nothing
  }
}

if ( process.env.DEV ) {
  if ( module.hot ) {
    module.hot.accept( '../../config-hot', () => {
      // do nothing, just want to update breakpoints, and measures
    } );
  }
}
