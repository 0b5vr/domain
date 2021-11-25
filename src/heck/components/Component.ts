import { Camera } from './Camera';
import { MapOfSet } from '../../utils/MapOfSet';
import { MaterialTag } from '../Material';
import { RawMatrix4 } from '@0b5vr/experimental';
import { RenderTarget } from '../RenderTarget';
import { SceneNode } from './SceneNode';
import { Transform } from '../Transform';
import { arraySetIntersects } from '../../utils/arraySetIntersects';
import { gui, guiMeasureDraw, guiMeasureUpdate } from '../../globals/gui';

export interface ComponentUpdateEvent {
  frameCount: number;
  time: number;
  deltaTime: number;
  globalTransform: Transform;
  ancestors: SceneNode[];
  componentsByTag: MapOfSet<symbol, Component>;
  path?: string;
}

export interface ComponentDrawEvent {
  frameCount: number;
  time: number;
  camera: Camera;
  cameraTransform: Transform;
  materialTag: MaterialTag;
  renderTarget: RenderTarget;
  globalTransform: Transform;
  viewMatrix: RawMatrix4;
  projectionMatrix: RawMatrix4;
  ancestors: SceneNode[];
  componentsByTag: MapOfSet<symbol, Component>;
  path?: string;
}

export interface ComponentOptions {
  active?: boolean;
  visible?: boolean;
  name?: string;
  ignoreBreakpoints?: boolean;
}

export class Component {
  public static updateHaveReachedBreakpoint = false;
  public static drawHaveReachedBreakpoint = false;

  public lastUpdateFrame: number;

  public active: boolean;
  public visible: boolean;

  public tags: symbol[];

  public name?: string;
  public ignoreBreakpoints?: boolean;

  public constructor( options?: ComponentOptions ) {
    this.lastUpdateFrame = 0;

    this.active = options?.active ?? true;
    this.visible = options?.visible ?? true;

    this.tags = [];

    if ( process.env.DEV ) {
      this.name = options?.name ?? ( this as any ).constructor.name;
      this.ignoreBreakpoints = options?.ignoreBreakpoints;
    }
  }

  public update( event: ComponentUpdateEvent ): void {
    if ( !this.active ) { return; }
    if ( this.lastUpdateFrame === event.frameCount ) { return; }
    this.lastUpdateFrame = event.frameCount;

    this.tags.map( ( tag ) => (
      event.componentsByTag.add( tag, this )
    ) );

    if ( process.env.DEV ) {
      if ( Component.updateHaveReachedBreakpoint && !this.ignoreBreakpoints ) { return; }

      if ( this.name != null ) {
        guiMeasureUpdate( this.name!, () => {
          this.__updateImpl( event );
        } );
      } else {
        this.__updateImpl( event );
      }

      if ( this.name != null ) {
        const path = `${ event.path }/${ this.name }`;

        const ha = gui;
        const breakpoint = ha?.value( 'breakpoint/update', '' ) ?? '';
        if ( breakpoint !== '' && new RegExp( breakpoint ).test( path ) ) {
          Component.updateHaveReachedBreakpoint = true;
        }
      }
    } else {
      this.__updateImpl( event );
    }
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void { // eslint-disable-line
    // do nothing
  }

  public draw( event: ComponentDrawEvent ): void {
    if ( !this.visible ) { return; }
    if ( arraySetIntersects( event.camera.exclusionTags, this.tags ) ) {
      return;
    }

    if ( process.env.DEV ) {
      if ( Component.drawHaveReachedBreakpoint && !this.ignoreBreakpoints ) { return; }

      if ( this.name != null ) {
        guiMeasureDraw( this.name, () => {
          this.__drawImpl( event );
        } );
      } else {
        this.__drawImpl( event );
      }

      if ( this.name != null ) {
        const path = `${ event.path }/${ this.name }`;

        const ha = gui;
        const breakpoint = ha?.value( 'breakpoint/draw', '' ) ?? '';
        if ( breakpoint !== '' && new RegExp( breakpoint ).test( path ) ) {
          Component.drawHaveReachedBreakpoint = true;
        }
      }
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
