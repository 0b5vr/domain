import { Camera } from './components/Camera';
import { Component } from './components/Component';
import { MapOfSet } from '../utils/MapOfSet';
import { MaterialTag } from './Material';
import { RawMatrix4 } from '@0b5vr/experimental';
import { RenderTarget } from './RenderTarget';
import { Transform } from './Transform';
import { guiMeasureDraw, guiMeasureUpdate } from '../globals/gui';

export interface EntityUpdateEvent {
  frameCount: number;
  time: number;
  deltaTime: number;
  globalTransform: Transform;
  entitiesByTag: MapOfSet<symbol, Entity>;
  parent: Entity | null;
  path?: string;
}

export interface EntityDrawEvent {
  frameCount: number;
  time: number;
  renderTarget: RenderTarget;
  globalTransform: Transform;
  viewMatrix: RawMatrix4;
  projectionMatrix: RawMatrix4;
  entitiesByTag: MapOfSet<symbol, Entity>;
  camera: Camera;
  cameraTransform: Transform;
  materialTag: MaterialTag;
  path?: string;
}

export interface EntityOptions {
  active?: boolean;
  visible?: boolean;
  name?: string;
  tags?: symbol[];
}

export class Entity {
  public transform: Transform;
  public globalTransformCache: Transform;

  public lastUpdateFrame;

  public active;
  public visible;

  public name?: string;
  public tags: symbol[];

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
    this.tags = options?.tags ?? [];

    this.children = [];
    this.components = [];
  }

  public update( {
    deltaTime,
    entitiesByTag,
    frameCount,
    globalTransform,
    time,
    path: eventPath,
  }: EntityUpdateEvent ): void {
    if ( !this.active ) { return; }
    if ( this.lastUpdateFrame === frameCount ) { return; }
    this.lastUpdateFrame = frameCount;

    const measured = (): void => {
      const nextGlobalTransform = globalTransform.multiply( this.transform );

      let path: string;
      if ( process.env.DEV ) {
        path = `${ eventPath }/${ this.name }`;
      }

      this.components.forEach( ( component ) => {
        this.tags.map( ( tag ) => (
          entitiesByTag.add( tag, this )
        ) );

        component.update( {
          frameCount,
          time,
          deltaTime,
          globalTransform: nextGlobalTransform,
          entitiesByTag,
          entity: this,
          path,
        } );
      } );

      this.children.forEach( ( child ) => {
        child.update( {
          frameCount,
          time,
          deltaTime,
          globalTransform: nextGlobalTransform,
          entitiesByTag,
          parent: this,
          path,
        } );
      } );
    };

    if ( process.env.DEV ) {
      guiMeasureUpdate( this.name ?? this.constructor.name, measured );
    } else {
      measured();
    }
  }

  public draw( {
    camera,
    cameraTransform,
    entitiesByTag,
    frameCount,
    globalTransform,
    materialTag,
    projectionMatrix,
    renderTarget,
    time,
    viewMatrix,
    path: eventPath,
  }: EntityDrawEvent ): void {
    if ( !this.visible ) { return; }
    const measured = (): void => {
      this.globalTransformCache = globalTransform.multiply( this.transform );

      let path: string;
      if ( process.env.DEV ) {
        path = `${ eventPath }/${ this.name }`;
      }

      this.components.forEach( ( component ) => {
        component.draw( {
          frameCount,
          time,
          renderTarget,
          globalTransform: this.globalTransformCache,
          camera,
          cameraTransform,
          viewMatrix,
          projectionMatrix,
          entity: this,
          entitiesByTag,
          materialTag,
          path,
        } );
      } );

      this.children.forEach( ( child ) => {
        child.draw( {
          frameCount,
          time: time,
          renderTarget,
          globalTransform: this.globalTransformCache,
          viewMatrix,
          projectionMatrix,
          entitiesByTag,
          camera,
          cameraTransform,
          materialTag,
          path,
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
