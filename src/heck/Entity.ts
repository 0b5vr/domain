import { Camera } from './components/Camera';
import { Component } from './components/Component';
import { MaterialTag } from './Material';
import { Matrix4 } from '@fms-cat/experimental';
import { RenderTarget } from './RenderTarget';
import { Transform } from './Transform';
import { guiMeasureDraw, guiMeasureUpdate } from '../globals/gui';

export interface EntityUpdateEvent {
  frameCount: number;
  time: number;
  deltaTime: number;
  globalTransform: Transform;
  parent: Entity | null;
  path?: string;
}

export interface EntityDrawEvent {
  frameCount: number;
  time: number;
  renderTarget: RenderTarget;
  globalTransform: Transform;
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
  camera: Camera;
  cameraTransform: Transform;
  materialTag: MaterialTag;
  path?: string;
}

export interface EntityOptions {
  active?: boolean;
  visible?: boolean;
  name?: string;
}

export class Entity {
  public transform: Transform;
  public globalTransformCache: Transform;

  public lastUpdateFrame;

  public active;
  public visible;

  public name?: string;

  public children: Entity[];
  public components: Component[];

  public constructor( options?: EntityOptions ) {
    this.transform = new Transform();
    this.globalTransformCache = new Transform();

    this.lastUpdateFrame = 0;

    this.active = options?.active ?? true;
    this.visible = options?.visible ?? true;

    if ( process.env.DEV ) {
      this.name = options?.name ?? ( this as any ).constructor.name;
    }

    this.children = [];
    this.components = [];
  }

  public update( event: EntityUpdateEvent ): void {
    if ( !this.active ) { return; }
    if ( this.lastUpdateFrame === event.frameCount ) { return; }
    this.lastUpdateFrame = event.frameCount;

    const measured = (): void => {
      const globalTransform = event.globalTransform.multiply( this.transform );

      this.components.forEach( ( component ) => {
        component.update( {
          frameCount: event.frameCount,
          time: event.time,
          deltaTime: event.deltaTime,
          globalTransform,
          entity: this,
        } );
      } );

      this.children.forEach( ( child ) => {
        child.update( {
          frameCount: event.frameCount,
          time: event.time,
          deltaTime: event.deltaTime,
          globalTransform,
          parent: this,
        } );
      } );
    };

    if ( process.env.DEV ) {
      guiMeasureUpdate( this.name ?? this.constructor.name, measured );
    } else {
      measured();
    }
  }

  public draw( event: EntityDrawEvent ): void {
    if ( !this.visible ) { return; }

    const measured = (): void => {
      this.globalTransformCache = event.globalTransform.multiply( this.transform );

      this.components.forEach( ( component ) => {
        component.draw( {
          frameCount: event.frameCount,
          time: event.time,
          renderTarget: event.renderTarget,
          globalTransform: this.globalTransformCache,
          camera: event.camera,
          cameraTransform: event.cameraTransform,
          viewMatrix: event.viewMatrix,
          projectionMatrix: event.projectionMatrix,
          entity: this,
          materialTag: event.materialTag,
        } );
      } );

      this.children.forEach( ( child ) => {
        child.draw( {
          frameCount: event.frameCount,
          time: event.time,
          renderTarget: event.renderTarget,
          globalTransform: this.globalTransformCache,
          viewMatrix: event.viewMatrix,
          projectionMatrix: event.projectionMatrix,
          camera: event.camera,
          cameraTransform: event.cameraTransform,
          materialTag: event.materialTag,
        } );
      } );
    };

    if ( process.env.DEV ) {
      guiMeasureDraw( this.name ?? this.constructor.name, measured );
    } else {
      measured();
    }
  }
}
