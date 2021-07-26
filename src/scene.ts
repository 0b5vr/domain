import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { Component } from './heck/components/Component';
import { Dog } from './heck/Dog';
import { ForwardCamera } from './entities/ForwardCamera';
import { Lambda } from './heck/components/Lambda';
import { Plane } from './entities/Plane';
import { Vector3 } from '@fms-cat/experimental';
import { automaton } from './globals/automaton';
import { clock } from './globals/clock';

// == dog ==========================================================================================
export const dog = new Dog();

const canvasRenderTarget = new CanvasRenderTarget();

// Mr. Update Everything
dog.root.components.push( new Lambda( {
  onUpdate: () => {
    if ( process.env.DEV ) {
      Component.gpuTimer!.update();
    }

    automaton.update( clock.time );
  },
  name: process.env.DEV && 'update-everything',
} ) );

// == entities =====================================================================================
const plane = new Plane();
dog.root.children.push( plane );

const forwardCamera = new ForwardCamera( {
  scenes: [ dog.root ],
  target: canvasRenderTarget,
  // lights: [],
} );
forwardCamera.transform.position = new Vector3( [ 0.0, 0.0, 5.0 ] );
dog.root.children.push( forwardCamera );
