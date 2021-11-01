import { Asphalt } from './entities/Asphalt';
import { CameraStack } from './entities/CameraStack';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { Dog } from './heck/Dog';
import { Floor } from './entities/Floor';
import { Fluid } from './entities/Fluid';
import { IBLLUTCalc } from './entities/IBLLUTCalc';
import { Lambda } from './heck/components/Lambda';
import { MengerSponge } from './entities/MengerSponge';
import { NodeReplacer } from './utils/NodeReplacer';
import { Plane } from './entities/Plane';
import { PointLightNode } from './entities/PointLightNode';
import { SSSBox } from './entities/SSSBox';
import { Sp4ghet } from './entities/Sp4ghet';
import { VRCameraStack } from './entities/VRCameraStack';
import { automaton } from './globals/automaton';
import { clock } from './globals/clock';
import { createVRSesh } from './globals/createVRSesh';
import { promiseGui } from './globals/gui';
import { randomTexture } from './globals/randomTexture';

// == dog ==========================================================================================
export const dog = new Dog();

const canvasRenderTarget = new CanvasRenderTarget();

// Mr. Update Everything
dog.root.children.push( new Lambda( {
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

// == entities =====================================================================================
// const plane = new Plane();
// dog.root.children.push( plane );

const iblLutCalc = new IBLLUTCalc();

const light1 = new PointLightNode( {
  scenes: [ dog.root ],
  shadowMapFov: 35.0,
  shadowMapNear: 1.0,
  shadowMapFar: 20.0,
  name: process.env.DEV && 'light1',
  brtNamePrefix: process.env.DEV && 'SceneBegin/light1',
} );
light1.color = [ 1500.0, 1500.0, 1500.0 ];
light1.spotness = 1.0;
light1.transform.lookAt( [ 5.0, 1.0, 8.0 ], [ 0.0, 3.0, 0.0 ] );

const light2 = new PointLightNode( {
  scenes: [ dog.root ],
  shadowMapFov: 50.0,
  shadowMapNear: 1.0,
  shadowMapFar: 20.0,
  name: process.env.DEV && 'light2',
  brtNamePrefix: process.env.DEV && 'SceneBegin/light2',
} );
light2.color = [ 500.0, 550.0, 590.0 ];
light2.spotness = 1.0;
light2.transform.lookAt( [ 0.01, 9.0, 0.01 ], [ 0.0, 3.0, 0.0 ] );

const light3 = new PointLightNode( {
  scenes: [ dog.root ],
  shadowMapFov: 50.0,
  shadowMapNear: 1.0,
  shadowMapFar: 20.0,
  name: process.env.DEV && 'light3',
  brtNamePrefix: process.env.DEV && 'SceneBegin/light3',
} );
light3.color = [ 300.0, 30.0, 70.0 ];
light3.transform.lookAt( [ -8.0, 2.0, -4.0 ], [ 0.0, 2.0, 0.0 ] );

const floor = new Floor();
if ( process.env.DEV && module.hot ) {
  const replacer = new NodeReplacer( floor, () => new Floor() );
  module.hot.accept( './entities/Floor', () => {
    replacer.replace( dog.root );
  } );
}

const cameraStackOptions = {
  scenes: [ dog.root ],
  textureIBLLUT: iblLutCalc.texture,
  floor,
};

const cameraStack = new CameraStack( {
  ...cameraStackOptions,
  target: canvasRenderTarget,
} );
cameraStack.transform.lookAt( [ 0.0, 1.6, 5.0 ], [ 0.0, 1.6, 0.0 ] );

cameraStack.children.push( new Lambda( {
  onUpdate: ( { time } ) => {
    const x = 10.0 * Math.cos( time );
    const z = 10.0 * Math.sin( time );
    cameraStack.transform.lookAt( [ x, 1.6, z ], [ 0.0, 1.6, 0.0 ] );
  },
} ) );

if ( process.env.DEV ) {
  cameraStack.name = 'cameraStack';
}

const fluid = new Fluid();
if ( process.env.DEV && module.hot ) {
  const replacer = new NodeReplacer( fluid, () => new Fluid() );
  module.hot.accept( './entities/Fluid', () => {
    replacer.replace( dog.root );
  } );
}
fluid.transform.position = [ 0.0, 3.0, 0.0 ];
fluid.transform.scale = [ 3.0, 3.0, 3.0 ];

const plane = new Plane();
if ( process.env.DEV && module.hot ) {
  const replacer = new NodeReplacer( plane, () => new Plane() );
  module.hot.accept( './entities/Plane', () => {
    replacer.replace( dog.root );
  } );
}
plane.transform.position = [ 0.0, 3.0, 0.0 ];
plane.transform.scale = [ 3.0, 3.0, 3.0 ];

const sssBox = new SSSBox();
if ( process.env.DEV && module.hot ) {
  const replacer = new NodeReplacer( sssBox, () => new SSSBox() );
  module.hot.accept( './entities/SSSBox', () => {
    replacer.replace( dog.root );
  } );
}
sssBox.transform.position = [ 0.0, 3.0, 0.0 ];
sssBox.transform.scale = [ 3.0, 3.0, 3.0 ];

const sp4ghet = new Sp4ghet();
if ( process.env.DEV && module.hot ) {
  const replacer = new NodeReplacer( sp4ghet, () => new Sp4ghet() );
  module.hot.accept( './entities/Sp4ghet', () => {
    replacer.replace( dog.root );
  } );
}
sp4ghet.transform.position = [ 0.0, 3.0, 0.0 ];
sp4ghet.transform.scale = [ 3.0, 3.0, 3.0 ];

const asphalt = new Asphalt();
if ( process.env.DEV && module.hot ) {
  const replacer = new NodeReplacer( asphalt, () => new Asphalt() );
  module.hot.accept( './entities/Asphalt', () => {
    replacer.replace( dog.root );
  } );
}
asphalt.transform.position = [ 0.0, 3.0, 0.0 ];
asphalt.transform.scale = [ 3.0, 3.0, 3.0 ];

const mengerSponge = new MengerSponge();
if ( process.env.DEV && module.hot ) {
  const replacer = new NodeReplacer( mengerSponge, () => new MengerSponge() );
  module.hot.accept( './entities/MengerSponge', () => {
    replacer.replace( dog.root );
  } );
}
mengerSponge.transform.position = [ 0.0, 3.0, 0.0 ];
mengerSponge.transform.scale = [ 3.0, 3.0, 3.0 ];

dog.root.children.push(
  light1,
  light2,
  light3,
  iblLutCalc,
  floor,
  // fluid,
  // plane,
  sssBox,
  // sp4ghet,
  // asphalt,
  // mengerSponge,
  cameraStack,
);

if ( process.env.DEV ) {
  import( './entities/RTInspector' ).then( ( { RTInspector } ) => {
    const rtInspector = new RTInspector( {
      target: canvasRenderTarget,
    } );
    dog.root.children.push( rtInspector );
  } );
}

// -- desktop --------------------------------------------------------------------------------------
function update(): void {
  if ( cameraStack.active ) {
    dog.update();
  }

  requestAnimationFrame( update );
}
update();

// -- vr -------------------------------------------------------------------------------------------
promiseGui.then( ( gui ) => {
  gui.button( 'vr (what)' ).on( 'click', async () => {
    const vrSesh = await createVRSesh();

    const vrCameraStack = new VRCameraStack( {
      ...cameraStackOptions,
      vrSesh,
      dog,
    } );
    vrCameraStack.transform.position = [ 0.0, 0.0, 5.0 ];

    dog.root.children.push( vrCameraStack );

    cameraStack.active = false;
  } );
} );
