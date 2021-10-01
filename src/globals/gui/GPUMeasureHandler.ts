import { GPUTimer } from './GPUTimer';

export class GPUMeasureHandler {
  public readonly gpuTimer: GPUTimer;

  public constructor( gpuTimer: GPUTimer ) {
    this.gpuTimer = gpuTimer;
  }

  public async measure( path: string, fn: () => void ): Promise<number> {
    return this.gpuTimer.measure( fn );
  }
}
