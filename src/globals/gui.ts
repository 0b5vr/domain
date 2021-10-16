import { GPUMeasureHandler } from './gui/GPUMeasureHandler';
import { GPUTimer } from './gui/GPUTimer';
import type { ImPane } from '@0b5vr/imtweakpane';

export let gui: ImPane | undefined;
let profilerUpdateCpu: any | undefined;
let profilerUpdateGpu: any | undefined;
let profilerDrawCpu: any | undefined;
let profilerDrawGpu: any | undefined;

export const promiseGui = new Promise( ( resolve ) => {
  if ( process.env.DEV ) {
    import( '@0b5vr/imtweakpane' ).then( ( { ImPane } ) => {
      const gui_ = gui = new ImPane( { title: 'gui' } );

      const tpDfwv = gui.pane.element.parentNode! as HTMLDivElement;
      tpDfwv.style.zIndex = '100';

      const gpuTimer = new GPUTimer();

      resolve( gui );

      import( '@0b5vr/tweakpane-plugin-profiler' ).then( ( plugin ) => {
        gui_.pane.registerPlugin( plugin as any );

        profilerUpdateCpu = gui_.blade( 'profilers/update/cpu', {
          view: 'profiler',
          label: 'cpu',
        } );

        profilerUpdateGpu = gui_.blade( 'profilers/update/gpu', {
          view: 'profiler',
          label: 'gpu',
          measureHandler: new GPUMeasureHandler( gpuTimer ),
        } );

        profilerDrawCpu = gui_.blade( 'profilers/draw/cpu', {
          view: 'profiler',
          label: 'cpu',
        } );

        profilerDrawGpu = gui_.blade( 'profilers/draw/gpu', {
          view: 'profiler',
          label: 'gpu',
          measureHandler: new GPUMeasureHandler( gpuTimer ),
        } );
      } );
    } );
  } else {
    // no promise resolution for you!
  }
} );

export function guiMeasureUpdate( name: string, fn: () => void ): void {
  if ( process.env.DEV && profilerUpdateCpu != null && profilerUpdateGpu != null ) {
    profilerUpdateCpu.measure( name, () => {
      profilerUpdateGpu.measure( name, () => {
        fn();
      } );
    } );
  } else {
    fn();
  }
}

export function guiMeasureDraw( name: string, fn: () => void ): void {
  if ( process.env.DEV && profilerDrawCpu != null && profilerDrawGpu != null ) {
    profilerDrawCpu.measure( name, () => {
      profilerDrawGpu.measure( name, () => {
        fn();
      } );
    } );
  } else {
    fn();
  }
}
