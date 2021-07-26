import { canvas } from './globals/canvas';
import { dog } from './scene';
import { getDivCanvasContainer } from './globals/dom';

// == dom ==========================================================================================
document.body.style.margin = '0';
document.body.style.padding = '0';

if ( process.env.DEV ) {
  document.body.style.background = '#000';
  document.body.style.width = '100%';

  const divCanvasContainer = getDivCanvasContainer();

  divCanvasContainer.appendChild( canvas );
  ( canvas.style as any ).aspectRatio = 'auto 1920 / 1080';
  canvas.style.margin = 'auto';
  canvas.style.maxWidth = '100%';
  canvas.style.maxHeight = '100%';
} else {
  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  document.body.style.width = canvas.style.width = '100%';
  document.body.style.height = canvas.style.height = '100%';
}

// == load =========================================================================================
async function load(): Promise<void> {
  console.info( dog );
}
load();
