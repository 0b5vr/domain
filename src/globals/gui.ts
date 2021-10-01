import { GPUMeasureHandler } from './gui/GPUMeasureHandler';
import { GPUTimer } from './gui/GPUTimer';
import { ImPane } from '@0b5vr/imtweakpane';
import { plugin } from '@0b5vr/tweakpane-plugin-profiler';

export const gui = new ImPane();
const tpDfwv = gui.pane.element.parentNode! as HTMLDivElement;
tpDfwv.style.zIndex = '100';

const gpuTimer = new GPUTimer();

gui.pane.registerPlugin( { plugin } as any );

const profilers = gui.folder( 'profilers' );

const updateProfilers = profilers.folder( 'update' );
const drawProfilers = profilers.folder( 'draw' );

const cpuUpdateProfiler = updateProfilers.blade( 'cpu-profiler', {
  view: 'profiler',
  label: 'cpu',
} );

const gpuUpdateProfiler = updateProfilers.blade( 'gpu-profiler', {
  view: 'profiler',
  label: 'gpu',
  measureHandler: new GPUMeasureHandler( gpuTimer ),
} );

const cpuDrawProfiler = drawProfilers.blade( 'cpu-draw-profiler', {
  view: 'profiler',
  label: 'cpu',
} );

const gpuDrawProfiler = drawProfilers.blade( 'gpu-draw-profiler', {
  view: 'profiler',
  label: 'gpu',
  measureHandler: new GPUMeasureHandler( gpuTimer ),
} );

export function guiMeasureUpdate( name: string, fn: () => void ): void {
  ( cpuUpdateProfiler as any ).measure( name, () => {
    ( gpuUpdateProfiler as any ).measure( name, () => {
      fn();
    } );
  } );
}

export function guiMeasureDraw( name: string, fn: () => void ): void {
  ( cpuDrawProfiler as any ).measure( name, () => {
    ( gpuDrawProfiler as any ).measure( name, () => {
      fn();
    } );
  } );
}
