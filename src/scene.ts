import { CRT, tagCRT } from './entities/CRT';
import { CameraStack } from './entities/CameraStack';
import { CanvasRenderTarget } from './heck/CanvasRenderTarget';
import { CubemapNode } from './entities/CubemapNode';
import { Dog } from './heck/Dog';
import { FUI } from './entities/FUI';
import { Fence } from './entities/Fence';
import { Floor } from './entities/Floor';
import { IBLLUTCalc } from './entities/IBLLUTCalc';
import { Lambda } from './heck/components/Lambda';
import { Lights } from './entities/Lights';
import { NodeReplacer } from './utils/NodeReplacer';
// import { Plane } from './entities/Plane';
import { RawVector3, vecAdd } from '@0b5vr/experimental';
import { Stuff } from './entities/Stuff';
import { VRCameraStack } from './entities/VRCameraStack';
import { Walls } from './entities/Walls';
import { auto, automaton } from './globals/automaton';
import { createVRSesh } from './globals/createVRSesh';
import { gl } from './globals/canvas';
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

  promiseGui.then( ( gui ) => {
    const webglMemory = gl.getExtension( 'GMAN_webgl_memory' );

    if ( webglMemory ) {
      gui.input( 'webgl-memory/enabled', false );

      dog.root.children.push( new Lambda( {
        onUpdate: () => {
          if ( gui.value( 'webgl-memory/enabled' ) ) {
            const info = webglMemory.getMemoryInfo();

            gui.monitor(
              'webgl-memory/buffer',
              `${ info.resources.buffer } / ${ ( info.memory.buffer * 1E-6 ).toFixed( 3 ) } MB`,
            );
            gui.monitor(
              'webgl-memory/texture',
              `${ info.resources.texture } / ${ ( info.memory.texture * 1E-6 ).toFixed( 3 ) } MB`,
            );
            gui.monitor(
              'webgl-memory/renderbuffer',
              `${ info.resources.renderbuffer } / ${ ( info.memory.renderbuffer * 1E-6 ).toFixed( 3 ) } MB`,
            );
            gui.monitor(
              'webgl-memory/program',
              info.resources.program,
            );
            gui.monitor(
              'webgl-memory/shader',
              info.resources.shader,
            );
            gui.monitor(
              'webgl-memory/drawingbuffer',
              `${ ( info.memory.drawingbuffer * 1E-6 ).toFixed( 3 ) } MB`,
            );
            gui.monitor(
              'webgl-memory/total',
              `${ ( info.memory.total * 1E-6 ).toFixed( 3 ) } MB`,
            );
          }
        },
      } ) );
    }
  } );
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

export const tagMainCamera = Symbol();

const iblLutCalc = new IBLLUTCalc();

const lights = new Lights( dog.root );

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
  scene: dog.root,
  textureIBLLUT: iblLutCalc.texture,
} );

if ( process.env.DEV ) {
  cubemapNode.name = 'cubemapNode';
}

const cameraStackOptions = {
  scene: dog.root,
  floor,
  withAO: true,
  withPost: true,
  tags: [ tagMainCamera ],
};

const cameraStack = new CameraStack( {
  ...cameraStackOptions,
  target: canvasRenderTarget,
} );

const cameraLambda = new Lambda( {
  onUpdate: ( { time } ) => {
    const shake = auto( 'camera/shake' );

    const posR = auto( 'camera/pos/r' );
    const posP = auto( 'camera/pos/p' );
    const posT = auto( 'camera/pos/t' );
    const pos = vecAdd(
      [
        auto( 'camera/pos/x' ),
        auto( 'camera/pos/y' ),
        auto( 'camera/pos/z' ),
      ],
      [
        posR * Math.cos( posT ) * Math.sin( posP ),
        posR * Math.sin( posT ),
        posR * Math.cos( posT ) * Math.cos( posP ),
      ],
      [
        0.04 * shake * Math.sin( time * 2.4 ),
        0.04 * shake * Math.sin( time * 3.4 ),
        0.04 * shake * Math.sin( time * 2.7 ),
      ],
    ) as RawVector3;

    const tar = vecAdd(
      [
        auto( 'camera/tar/x' ),
        auto( 'camera/tar/y' ),
        auto( 'camera/tar/z' ),
      ],
      [
        0.04 * shake * Math.sin( time * 2.8 ),
        0.04 * shake * Math.sin( time * 2.5 ),
        0.04 * shake * Math.sin( time * 3.1 ),
      ],
    ) as RawVector3;

    const roll = auto( 'camera/roll' ) + 0.01 * shake * Math.sin( time * 1.1 );

    cameraStack.fov = auto( 'camera/fov' );
    cameraStack.transform.lookAt( pos, tar, [ 0.0, 1.0, 0.0 ], roll );
  },
} );

if ( process.env.DEV ) {
  cameraStack.name = 'cameraStack';
}

// const plane = new Plane();
// if ( process.env.DEV && module.hot ) {
//   const replacer = new NodeReplacer( plane, () => new Plane() );
//   module.hot.accept( './entities/Plane', () => {
//     replacer.replace( dog.root );
//   } );
// }
// plane.transform.position = [ 0.0, 3.0, 5.0 ];
// plane.transform.scale = [ 1.0, 1.0, 1.0 ];

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

// this sucks
const crtVideoSender = new Lambda( {
  onUpdate: ( { componentsByTag } ) => {
    const cameraStack =
      Array.from( componentsByTag.get( tagMainCamera ) )[ 0 ] as CameraStack | undefined;
    const texture = cameraStack?.postStack?.swap?.o.texture;

    if ( texture ) {
      Array.from( componentsByTag.get( tagCRT ) ).map( ( crt ) => {
        ( crt as CRT ).input = texture;
      } );
    }
  },
} );

dog.root.children.push(
  iblLutCalc,
  fui,
  walls,
  fence,
  floor,
  stuff,
  lights,
  cubemapNode,
  // plane,
  cameraLambda,
  cameraStack,
  crtVideoSender,
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
