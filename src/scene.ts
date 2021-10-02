import { Bloom } from './entities/Bloom';
import { BufferRenderTarget } from './heck/BufferRenderTarget';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { Dog } from './heck/Dog';
import { EntityReplacer } from './utils/EntityReplacer';
import { Fluid } from './entities/Fluid';
import { ForwardCamera } from './entities/ForwardCamera';
import { Lambda } from './heck/components/Lambda';
import { Post } from './entities/Post';
import { RTInspector } from './entities/RTInspector';
import { Swap, Vector3 } from '@fms-cat/experimental';
import { automaton } from './globals/automaton';
import { clock } from './globals/clock';
import { gui } from './globals/gui';
import { randomTexture } from './globals/randomTexture';

// == dog ==========================================================================================
export const dog = new Dog();

const canvasRenderTarget = new CanvasRenderTarget();

// Mr. Update Everything
dog.root.components.push( new Lambda( {
  onUpdate: () => {
    randomTexture.update();
    automaton.update( clock.time );
  },
  name: process.env.DEV && 'update-everything',
} ) );

gui.input( 'active', true )?.on( 'change', ( { value } ) => {
  dog.active = value;
} );

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
if ( process.env.DEV && module.hot ) {
  const replacer = new EntityReplacer( fluid, () => new Fluid() );
  module.hot.accept( './entities/Fluid', () => {
    replacer.replace( dog.root );
  } );
}

const forwardCamera = new ForwardCamera( {
  scenes: [ dog.root ],
  target: swap.i,
  clear: [ 0, 0, 0, 1 ],
} );
forwardCamera.transform.position = new Vector3( [ 0.0, 0.0, 5.0 ] );

swap.swap();

const bloom = new Bloom( {
  input: swap.o,
  target: swap.i,
} );

swap.swap();

const post = new Post( {
  input: swap.o,
  target: canvasRenderTarget
} );

dog.root.children.push(
  fluid,
  forwardCamera,
  bloom,
  post,
);

if ( process.env.DEV ) {
  const rtInspector = new RTInspector( {
    target: canvasRenderTarget
  } );
  dog.root.children.push( rtInspector );
}
