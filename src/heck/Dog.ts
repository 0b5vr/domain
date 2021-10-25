import { Component } from './components/Component';
import { Entity } from './Entity';
import { MapOfSet } from '../utils/MapOfSet';
import { Transform } from './Transform';
import { clock } from '../globals/clock';

/**
 * And what a WONDERFUL Dog they are!!
 */
export class Dog {
  public root: Entity;
  public active: boolean;

  private __frameCount: number = 0;

  public constructor() {
    this.root = new Entity();
    this.active = true;

    if ( process.env.DEV ) {
      this.root.name = 'root';
    }

    const update = (): void => {
      if ( this.active ) {
        clock.update();
        this.root.update( {
          frameCount: this.__frameCount ++,
          time: clock.time,
          deltaTime: clock.deltaTime,
          globalTransform: new Transform(),
          entitiesByTag: new MapOfSet(),
          parent: null,
          path: process.env.DEV && '',
        } );
      }

      if ( process.env.DEV ) {
        Component.updateHaveReachedBreakpoint = false;
        Component.drawHaveReachedBreakpoint = false;
      }

      requestAnimationFrame( update );
    };
    update();
  }
}
