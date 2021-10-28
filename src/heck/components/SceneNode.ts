import { Component, ComponentDrawEvent, ComponentOptions, ComponentUpdateEvent } from './Component';
import { Transform } from '../Transform';

export interface SceneNodeOptions extends ComponentOptions {
  transform?: Transform;
  children?: Component[];
}

export class SceneNode extends Component {
  public transform: Transform;
  public globalTransformCache: Transform;

  public children: Component[];

  public constructor( options?: SceneNodeOptions ) {
    super( options );

    this.transform = options?.transform ?? new Transform();
    this.globalTransformCache = new Transform();

    this.children = options?.children ?? [];
  }

  public __updateImpl( event: ComponentUpdateEvent ): void {
    this.globalTransformCache = event.globalTransform.multiply( this.transform );
    const ancestors = [ this, ...event.ancestors ];

    let path: string;
    if ( process.env.DEV ) {
      path = `${ event.path }/${ this.name }`;
    }

    this.children.forEach( ( child ) => {
      child.update( {
        ...event,
        globalTransform: this.globalTransformCache,
        ancestors,
        path,
      } );
    } );
  }

  public __drawImpl( event: ComponentDrawEvent ): void {
    const ancestors = [ this, ...event.ancestors ];

    let path: string;
    if ( process.env.DEV ) {
      path = `${ event.path }/${ this.name }`;
    }

    this.children.forEach( ( child ) => {
      child.draw( {
        ...event,
        globalTransform: this.globalTransformCache,
        ancestors,
        path,
      } );
    } );
  }
}
