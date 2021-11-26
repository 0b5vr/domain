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
  document.write( '<a></a><a></a><a></a><style>a{display:block}canvas{position:fixed;left:0;top:0;width:100%;height:100%}</style>' );

  const anchors = document.querySelectorAll( 'a' );
  const mainAnchor = anchors[ 0 ];
  mainAnchor.textContent = 'wait a moment';

  Promise.all( [
    Material.d3dSucks(),
    music.prepare(),
  ].map( ( task, i ) => {
    const a = anchors[ i + 1 ];
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

      document.documentElement.requestFullscreen();

      music.isPlaying = true;
    };
  } );
}
