import { Bloom } from './entities/Bloom';
import { BufferRenderTarget } from './heck/BufferRenderTarget';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { DeferredCamera } from './entities/DeferredCamera';
import { Dog } from './heck/Dog';
import { EntityReplacer } from './utils/EntityReplacer';
import { Floor } from './entities/Floor';
import { Fluid } from './entities/Fluid';
import { ForwardCamera } from './entities/ForwardCamera';
import { IBLLUTCalc } from './entities/IBLLUTCalc';
import { Lambda } from './heck/components/Lambda';
import { MengerSponge } from './entities/MengerSponge';
import { Plane } from './entities/Plane';
import { PointLightEntity } from './entities/PointLightEntity';
import { Post } from './entities/Post';
import { RTInspector } from './entities/RTInspector';
import { SSSBox } from './entities/SSSBox';
import { Swap } from '@0b5vr/experimental';
import { automaton } from './globals/automaton';
import { clock } from './globals/clock';
import { promiseGui } from './globals/gui';
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

if ( process.env.DEV ) {
  promiseGui.then( ( gui ) => {
    gui.input( 'active', true )?.on( 'change', ( { value } ) => {
      dog.active = value;
    } );
  } );
}

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

const iblLutCalc = new IBLLUTCalc();

const light1 = new PointLightEntity( {
  scenes: [ dog.root ],
  shadowMapFov: 30.0,
  shadowMapNear: 1.0,
  shadowMapFar: 20.0,
  name: process.env.DEV && 'light1',
  brtNamePrefix: process.env.DEV && 'SceneBegin/light1',
} );
light1.color = [ 300.0, 300.0, 300.0 ];
light1.transform.lookAt( [ 4.0, 4.0, 4.0 ] );

const deferredCamera = new DeferredCamera( {
  scenes: [ dog.root ],
  target: swap.i,
  textureIBLLUT: iblLutCalc.texture,
} );
deferredCamera.transform.position = [ 0.0, 1.0, 5.0 ];

const forwardCamera = new ForwardCamera( {
  scenes: [ dog.root ],
  target: swap.i,
} );
forwardCamera.transform.position = [ 0.0, 1.0, 5.0 ];

const floor = new Floor(
  forwardCamera,
  forwardCamera.camera,
);
if ( process.env.DEV && module.hot ) {
  const replacer = new EntityReplacer( floor, () => new Floor(
    forwardCamera,
    forwardCamera.camera
  ) );
  module.hot.accept( './entities/Floor', () => {
    replacer.replace( dog.root );
  } );
}

const fluid = new Fluid();
if ( process.env.DEV && module.hot ) {
  const replacer = new EntityReplacer( fluid, () => new Fluid() );
  module.hot.accept( './entities/Fluid', () => {
    replacer.replace( dog.root );
  } );
}
fluid.transform.position = [ -2.0, 1.0, 0.0 ];

const plane = new Plane();
if ( process.env.DEV && module.hot ) {
  const replacer = new EntityReplacer( plane, () => new Plane() );
  module.hot.accept( './entities/Plane', () => {
    replacer.replace( dog.root );
  } );
}
plane.transform.position = [ 0.0, 1.0, 0.0 ];

const sssBox = new SSSBox();
if ( process.env.DEV && module.hot ) {
  const replacer = new EntityReplacer( sssBox, () => new SSSBox() );
  module.hot.accept( './entities/SSSBox', () => {
    replacer.replace( dog.root );
  } );
}
sssBox.transform.position = [ 0.0, 1.0, 0.0 ];

const mengerSponge = new MengerSponge();
if ( process.env.DEV && module.hot ) {
  const replacer = new EntityReplacer( mengerSponge, () => new MengerSponge() );
  module.hot.accept( './entities/MengerSponge', () => {
    replacer.replace( dog.root );
  } );
}
mengerSponge.transform.position = [ 2.0, 1.0, 0.0 ];

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
  light1,
  iblLutCalc,
  floor,
  fluid,
  // plane,
  sssBox,
  mengerSponge,
  deferredCamera,
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
