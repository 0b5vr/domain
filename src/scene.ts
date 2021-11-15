import { CameraStack } from './entities/CameraStack';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { Dog } from './heck/Dog';
import { FUI } from './entities/FUI';
import { Floor } from './entities/Floor';
import { IBLLUTCalc } from './entities/IBLLUTCalc';
import { Lambda } from './heck/components/Lambda';
import { LightShaft } from './entities/LightShaft';
import { NodeReplacer } from './utils/NodeReplacer';
import { Plane } from './entities/Plane';
import { PointLightNode } from './entities/PointLightNode';
import { RawVector3, vecAdd } from '@0b5vr/experimental';
import { Stuff } from './entities/Stuff';
import { VRCameraStack } from './entities/VRCameraStack';
import { automaton } from './globals/automaton';
import { createVRSesh } from './globals/createVRSesh';
import { music } from './globals/music';
import { promiseGui } from './globals/gui';
import { randomTexture } from './globals/randomTexture';

// == dog ==========================================================================================
export const dog = new Dog();

const canvasRenderTarget = new CanvasRenderTarget();

// Mr. Update Everything
dog.root.children.push( new Lambda( {
  onUpdate: () => {
    randomTexture.update();
    automaton.update( music.time );
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
  shadowMapFov: 50.0,
  shadowMapNear: 0.1,
  shadowMapFar: 20.0,
  name: process.env.DEV && 'light1',
  brtNamePrefix: process.env.DEV && 'SceneBegin/light1',
} );
light1.color = [ 100.0, 100.0, 100.0 ];
light1.spotness = 1.0;
light1.transform.lookAt( [ 3.0, 0.2, 3.0 ], [ 0.0, 3.0, 0.0 ] );

const shaft1 = new LightShaft( {
  light: light1,
  intensity: 0.01,
} );
light1.children.push( shaft1 );

const light2 = new PointLightNode( {
  scenes: [ dog.root ],
  shadowMapFov: 50.0,
  shadowMapNear: 1.0,
  shadowMapFar: 20.0,
  name: process.env.DEV && 'light2',
  brtNamePrefix: process.env.DEV && 'SceneBegin/light2',
} );
light2.color = [ 100.0, 150.0, 190.0 ];
light2.spotness = 1.0;
light2.transform.lookAt( [ 0.01, 9.0, 0.01 ], [ 0.0, 3.0, 0.0 ] );

const shaft2 = new LightShaft( {
  light: light2,
  intensity: 0.01,
} );
light2.children.push( shaft2 );

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
cameraStack.transform.lookAt( [ 0.0, 1.6, 10.0 ], [ 0.0, 3.0, 0.0 ] );

cameraStack.children.push( new Lambda( {
  onUpdate: ( { time } ) => {
    const pos = vecAdd(
      [ 0.0, 1.6, 10.0 ],
      [
        0.04 * Math.sin( time * 2.4 ) - 0.02,
        0.04 * Math.sin( time * 3.4 ) - 0.02,
        0.04 * Math.sin( time * 2.7 ) - 0.02,
      ],
    ) as RawVector3;
    const tar = vecAdd(
      [ 0.0, 3.0, 0.0 ],
      [
        0.04 * Math.sin( time * 2.8 ) - 0.02,
        0.04 * Math.sin( time * 2.5 ) - 0.02,
        0.04 * Math.sin( time * 3.1 ) - 0.02,
      ],
    ) as RawVector3;
    const roll = 0.02 * Math.sin( time * 1.1 );
    cameraStack.transform.lookAt( pos, tar, [ 0.0, 1.0, 0.0 ], roll );
  },
} ) );

if ( process.env.DEV ) {
  cameraStack.name = 'cameraStack';
}

const plane = new Plane();
if ( process.env.DEV && module.hot ) {
  const replacer = new NodeReplacer( plane, () => new Plane() );
  module.hot.accept( './entities/Plane', () => {
    replacer.replace( dog.root );
  } );
}
plane.transform.position = [ 0.0, 3.0, 0.0 ];
plane.transform.scale = [ 3.0, 3.0, 3.0 ];

const fui = new FUI();
if ( process.env.DEV && module.hot ) {
  const replacer = new NodeReplacer( fui, () => new FUI() );
  module.hot.accept( './entities/FUI', () => {
    replacer.replace( dog.root );
  } );
}

const stuff = new Stuff();
if ( process.env.DEV && module.hot ) {
  const replacer = new NodeReplacer( stuff, () => new Stuff() );
  module.hot.accept( './entities/Stuff', () => {
    replacer.replace( dog.root );
  } );
}

dog.root.children.push(
  iblLutCalc,
  floor,
  light1,
  light2,
  light3,
  // plane,
  fui,
  stuff,
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
