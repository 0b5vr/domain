import { Bloom } from './entities/Bloom';
import { BufferRenderTarget } from './heck/BufferRenderTarget';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { Component } from './heck/components/Component';
import { Dog } from './heck/Dog';
import { Fluid } from './entities/Fluid';
import { ForwardCamera } from './entities/ForwardCamera';
import { Lambda } from './heck/components/Lambda';
import { Plane } from './entities/Plane';
import { Post } from './entities/Post';
import { RTInspector } from './entities/RTInspector';
import { Swap, Vector3 } from '@fms-cat/experimental';
import { automaton } from './globals/automaton';
import { clock } from './globals/clock';
import { randomTexture } from './globals/randomTexture';

// == dog ==========================================================================================
export const dog = new Dog();

const canvasRenderTarget = new CanvasRenderTarget();

// Mr. Update Everything
dog.root.components.push( new Lambda( {
  onUpdate: () => {
    if ( process.env.DEV ) {
      Component.gpuTimer!.update();
    }

    randomTexture.update();
    automaton.update( clock.time );
  },
  name: process.env.DEV && 'update-everything',
} ) );

// == render buffer ================================================================================
const swapOptions = {
  width: canvasRenderTarget.width,
  height: canvasRenderTarget.height
};

const swap = new Swap(
  new BufferRenderTarget( {
    ...swapOptions,
    name: process.env.DEV && 'main/postSwap0',
  } ),
  new BufferRenderTarget( {
    ...swapOptions,
    name: process.env.DEV && 'main/postSwap1',
  } ),
);

// == entities =====================================================================================
// const plane = new Plane();
// dog.root.children.push( plane );

const fluid = new Fluid();
dog.root.children.push( fluid );

const forwardCamera = new ForwardCamera( {
  scenes: [ dog.root ],
  target: swap.i,
  clear: [ 0, 0, 0, 1 ],
  // lights: [],
} );
forwardCamera.transform.position = new Vector3( [ 0.0, 0.0, 5.0 ] );
dog.root.children.push( forwardCamera );

swap.swap();

const bloom = new Bloom( {
  input: swap.o,
  target: swap.i,
} );
dog.root.children.push( bloom );

swap.swap();

const post = new Post( {
  input: swap.o,
  target: canvasRenderTarget
} );
dog.root.children.push( post );

if ( process.env.DEV ) {
  const rtInspector = new RTInspector( {
    target: canvasRenderTarget
  } );
  dog.root.children.push( rtInspector );
}
