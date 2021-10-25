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

    // Esc = panic button
    window.addEventListener( 'keydown', ( event ) => {
      if ( event.code === 'Escape' ) {
        const input = (
          gui.input( 'active', true )?.controller_.valueController.view as any
        ).inputElement;

        if ( input.checked ) {
          input.click();
        }
      }
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
light1.color = [ 2500.0, 2500.0, 2500.0 ];
light1.transform.lookAt( [ 8.0, 4.0, 8.0 ], [ 0.0, 1.0, 0.0 ] );

const light2 = new PointLightEntity( {
  scenes: [ dog.root ],
  shadowMapFov: 30.0,
  shadowMapNear: 1.0,
  shadowMapFar: 20.0,
  name: process.env.DEV && 'light2',
  brtNamePrefix: process.env.DEV && 'SceneBegin/light2',
} );
light2.color = [ 200.0, 230.0, 260.0 ];
light2.transform.lookAt( [ 0.01, 9.0, 0.01 ], [ 0.0, 1.0, 0.0 ] );

const light3 = new PointLightEntity( {
  scenes: [ dog.root ],
  shadowMapFov: 30.0,
  shadowMapNear: 1.0,
  shadowMapFar: 20.0,
  name: process.env.DEV && 'light3',
  brtNamePrefix: process.env.DEV && 'SceneBegin/light3',
} );
light3.color = [ 300.0, 30.0, 70.0 ];
light3.transform.lookAt( [ -8.0, 0.0, -4.0 ], [ 0.0, 1.0, 0.0 ] );

const deferredCamera = new DeferredCamera( {
  scenes: [ dog.root ],
  target: swap.i,
  textureIBLLUT: iblLutCalc.texture,
} );
deferredCamera.transform.position = [ 0.0, 1.6, 10.0 ];

const forwardCamera = new ForwardCamera( {
  scenes: [ dog.root ],
  target: swap.i,
} );
forwardCamera.transform = deferredCamera.transform;

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
fluid.transform.position = [ -4.0, 3.0, 0.0 ];
fluid.transform.scale = [ 3.0, 3.0, 3.0 ];

const plane = new Plane();
if ( process.env.DEV && module.hot ) {
  const replacer = new EntityReplacer( plane, () => new Plane() );
  module.hot.accept( './entities/Plane', () => {
    replacer.replace( dog.root );
  } );
}
plane.transform.position = [ 0.0, 3.0, 0.0 ];
plane.transform.scale = [ 3.0, 3.0, 3.0 ];

const sssBox = new SSSBox();
if ( process.env.DEV && module.hot ) {
  const replacer = new EntityReplacer( sssBox, () => new SSSBox() );
  module.hot.accept( './entities/SSSBox', () => {
    replacer.replace( dog.root );
  } );
}
sssBox.transform.position = [ 0.0, 3.0, 0.0 ];
sssBox.transform.scale = [ 3.0, 3.0, 3.0 ];

const mengerSponge = new MengerSponge();
if ( process.env.DEV && module.hot ) {
  const replacer = new EntityReplacer( mengerSponge, () => new MengerSponge() );
  module.hot.accept( './entities/MengerSponge', () => {
    replacer.replace( dog.root );
  } );
}
mengerSponge.transform.position = [ 4.0, 3.0, 0.0 ];
mengerSponge.transform.scale = [ 3.0, 3.0, 3.0 ];

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
  light2,
  light3,
  iblLutCalc,
  floor,
  // fluid,
  // plane,
  sssBox,
  // mengerSponge,
  deferredCamera,
  forwardCamera,
  bloom,
  post,
);

if ( process.env.DEV ) {
  import( './entities/RTInspector' ).then( ( { RTInspector } ) => {
    const rtInspector = new RTInspector( {
      target: canvasRenderTarget
    } );
    dog.root.children.push( rtInspector );
  } );
}
