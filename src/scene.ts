import { CameraStack } from './entities/CameraStack';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { CubemapNode } from './entities/CubemapNode';
import { Dog } from './heck/Dog';
import { FAR, NEAR } from './config';
import { FUI } from './entities/FUI';
import { Fence } from './entities/Fence';
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
import { Walls } from './entities/Walls';
import { automaton } from './globals/automaton';
import { createVRSesh } from './globals/createVRSesh';
import { music } from './globals/music';
import { promiseGui } from './globals/gui';
import { randomTexture } from './globals/randomTexture';

// == dog ==========================================================================================
export const dog = new Dog();

const canvasRenderTarget = new CanvasRenderTarget();

// Mr. Update Everything
if ( process.env.DEV ) {
  dog.root.children.push( new Lambda( {
    onUpdate: () => {
      randomTexture.update();
    },
    name: 'randomTexture',
  } ) );

  dog.root.children.push( new Lambda( {
    onUpdate: () => {
      music.update();
    },
    name: 'music',
  } ) );

  dog.root.children.push( new Lambda( {
    onUpdate: () => {
      automaton.update( music.time );
    },
    name: 'automaton',
  } ) );
} else {
  dog.root.children.push( new Lambda( {
    onUpdate: () => {
      randomTexture.update();
      music.update();
      automaton.update( music.time );
    },
  } ) );
}

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

const lightRight = new PointLightNode( {
  scenes: [ dog.root ],
  shadowMapFov: 60.0,
  shadowMapNear: NEAR,
  shadowMapFar: FAR,
  name: process.env.DEV && 'lightRight',
  brtNamePrefix: process.env.DEV && 'SceneBegin/lightRight',
} );
lightRight.color = [ 100.0, 100.0, 100.0 ];
lightRight.spotness = 0.9;
lightRight.transform.lookAt( [ 4.0, 0.2, 2.5 ], [ 0.0, 3.0, 0.0 ] );

const shaftRight = new LightShaft( {
  light: lightRight,
  intensity: 0.02,
} );
lightRight.children.push( shaftRight );

const lightLeft = new PointLightNode( {
  scenes: [ dog.root ],
  shadowMapFov: 60.0,
  shadowMapNear: NEAR,
  shadowMapFar: FAR,
  name: process.env.DEV && 'lightLeft',
  brtNamePrefix: process.env.DEV && 'SceneBegin/lightLeft',
} );
lightLeft.color = [ 80.0, 60.0, 40.0 ];
lightLeft.spotness = 0.9;
lightLeft.transform.lookAt( [ -5.0, 0.2, 0.0 ], [ 0.0, 3.0, 0.0 ] );

const shaftLeft = new LightShaft( {
  light: lightLeft,
  intensity: 0.02,
} );
lightLeft.children.push( shaftLeft );

const lightTop = new PointLightNode( {
  scenes: [ dog.root ],
  shadowMapFov: 60.0,
  shadowMapNear: NEAR,
  shadowMapFar: FAR,
  name: process.env.DEV && 'lightTop',
  brtNamePrefix: process.env.DEV && 'SceneBegin/lightTop',
} );
lightTop.color = [ 100.0, 150.0, 190.0 ];
lightTop.spotness = 0.9;
lightTop.transform.lookAt( [ 0.01, 9.0, 0.01 ], [ 0.0, 3.0, 0.0 ] );

const shaftTop = new LightShaft( {
  light: lightTop,
  intensity: 0.02,
} );
lightTop.children.push( shaftTop );

const floor = new Floor();
if ( process.env.DEV && module.hot ) {
  const replacer = new NodeReplacer( floor, () => new Floor() );
  module.hot.accept( './entities/Floor', () => {
    replacer.replace( dog.root );
  } );
}

const walls = new Walls();
if ( process.env.DEV && module.hot ) {
  const replacer = new NodeReplacer( walls, () => new Walls() );
  module.hot.accept( './entities/Walls', () => {
    replacer.replace( dog.root );
  } );
}

const fence = new Fence();
if ( process.env.DEV && module.hot ) {
  const replacer = new NodeReplacer( fence, () => new Fence() );
  module.hot.accept( './entities/Fence', () => {
    replacer.replace( dog.root );
  } );
}

const cubemapNode = new CubemapNode( {
  scenes: [ dog.root ],
  textureIBLLUT: iblLutCalc.texture,
} );

if ( process.env.DEV ) {
  cubemapNode.name = 'cubemapNode';
}

const cameraStackOptions = {
  scenes: [ dog.root ],
  floor,
  withAO: true,
  withPost: true,
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
      [ 0.0, 1.6, 0.0 ],
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
plane.transform.position = [ 0.0, 3.0, 5.0 ];
plane.transform.scale = [ 1.0, 1.0, 1.0 ];

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
  fui,
  walls,
  fence,
  floor,
  stuff,
  lightRight,
  lightLeft,
  lightTop,
  cubemapNode,
  // plane,
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
