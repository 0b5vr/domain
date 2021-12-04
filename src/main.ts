import { AutomatonWithGUI } from '@0b5vr/automaton-with-gui';
import { Material } from './heck/Material';
import { automaton } from './globals/automaton';
import { canvas } from './globals/canvas';
import { dog } from './scene';
import { getDivCanvasContainer } from './globals/dom';
import { gui } from './globals/gui';
import { music } from './globals/music';

// == dom ==========================================================================================
document.body.style.margin = '0';
document.body.style.padding = '0';

if ( process.env.DEV ) {
  document.body.style.background = '#000';
  document.body.style.width = '100%';

  const divCanvasContainer = getDivCanvasContainer();

  divCanvasContainer.appendChild( canvas );
  ( canvas.style as any ).aspectRatio = 'auto 16 / 9';
  canvas.style.margin = 'auto';
  canvas.style.maxWidth = '100%';
  canvas.style.maxHeight = '100%';
}

// == dev kickstarter ==============================================================================
async function kickstartDev(): Promise<void> {
  console.info( dog );

  [
    Material.d3dSucks(),
    music.prepare(),
  ].map( ( task, i ) => {
    const taskname = [ 'shaders', 'music' ][ i ];
    task.onProgress = ( progress ) => {
      const gui_ = gui;
      gui_?.monitor( `tasks/${ taskname }`, `${ Math.floor( progress * 100.0 ) }%` );
    };
    return task.promise;
  } );

  ( automaton as AutomatonWithGUI ).play();
}

if ( process.env.DEV ) {
  kickstartDev();
}

// == prod kickstarter =============================================================================
if ( !process.env.DEV ) {
  document.write( '<a>fullscreen</a><a>wait a moment</a><a></a><a></a><style>a{display:block}canvas{position:fixed;left:0;top:0;width:100%;height:100%;cursor:none}</style>' );

  const anchors = document.querySelectorAll( 'a' );
  const fsAnchor = anchors[ 0 ];
  const mainAnchor = anchors[ 1 ];

  fsAnchor.onclick = () => {
    document.documentElement.requestFullscreen();
  };

  Promise.all( [
    Material.d3dSucks(),
    music.prepare(),
  ].map( ( task, i ) => {
    const a = anchors[ i + 2 ];
    const taskname = [ 'shaders', 'music' ][ i ];
    a.textContent = `${ taskname }: 0%`;
    task.onProgress = ( progress ) => (
      a.textContent = `${ taskname }: ${ Math.floor( progress * 100.0 ) }%`
    );
    return task.promise;
  } ) ).then( () => {
    mainAnchor.textContent = 'click';

    mainAnchor.onclick = () => {
      document.body.appendChild( canvas );

      music.isPlaying = true;
    };

    window.addEventListener( 'keydown', ( event ) => {
      if ( event.code === 'Escape' ) {
        music.isPlaying = false;
        music.update();
        dog.root.active = false;
      }
    } );

  } );
}
