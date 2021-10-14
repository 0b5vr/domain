import { GPUMeasureHandler } from './gui/GPUMeasureHandler';
import { GPUTimer } from './gui/GPUTimer';
import { ImPane } from '@0b5vr/imtweakpane';
import { plugin } from '@0b5vr/tweakpane-plugin-profiler';

export let gui: ImPane | null = null;

if ( process.env.DEV ) {
  gui = new ImPane( { title: 'gui' } );
  const tpDfwv = gui.pane.element.parentNode! as HTMLDivElement;
  tpDfwv.style.zIndex = '100';

  const gpuTimer = new GPUTimer();

  gui.pane.registerPlugin( { plugin } as any );

  gui.blade( 'profilers/update/cpu', {
    view: 'profiler',
    label: 'cpu',
  } );

  gui.blade( 'profilers/update/gpu', {
    view: 'profiler',
    label: 'gpu',
    measureHandler: new GPUMeasureHandler( gpuTimer ),
  } );

  gui.blade( 'profilers/draw/cpu', {
    view: 'profiler',
    label: 'cpu',
  } );

  gui.blade( 'profilers/draw/gpu', {
    view: 'profiler',
    label: 'gpu',
    measureHandler: new GPUMeasureHandler( gpuTimer ),
  } );
}

export function guiMeasureUpdate( name: string, fn: () => void ): void {
  if ( process.env.DEV && gui != null ) {
    ( gui.blade( 'profilers/update/cpu' ) as any ).measure( name, () => {
      ( gui?.blade( 'profilers/update/gpu' ) as any ).measure( name, () => {
        fn();
      } );
    } );
  } else {
    fn();
  }
}

export function guiMeasureDraw( name: string, fn: () => void ): void {
  if ( process.env.DEV ) {
    ( gui?.blade( 'profilers/draw/cpu' ) as any ).measure( name, () => {
      ( gui?.blade( 'profilers/draw/gpu' ) as any ).measure( name, () => {
        fn();
      } );
    } );
  } else {
    fn();
  }
}
