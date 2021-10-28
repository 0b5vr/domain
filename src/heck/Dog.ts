import { Component } from './components/Component';
import { MapOfSet } from '../utils/MapOfSet';
import { SceneNode } from './components/SceneNode';
import { Transform } from './Transform';
import { clock } from '../globals/clock';

/**
 * And what a WONDERFUL Dog they are!!
 */
export class Dog {
  public root: SceneNode;
  public active: boolean;

  private __frameCount: number = 0;

  public constructor() {
    this.root = new SceneNode();
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
          componentsByTag: new MapOfSet(),
          ancestors: [],
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
