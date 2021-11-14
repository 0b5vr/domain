import { audio } from '../globals/music';

/**
 * cringe
 */
export function createIR(): AudioBuffer {
  const sampleRate = audio.sampleRate;
  const samples = 4.0 * sampleRate;
  const buffer = audio.createBuffer( 2, samples, sampleRate );

  for ( let iCh = 0; iCh < 2; iCh ++ ) {
    const ch = buffer.getChannelData( iCh );

    for ( let i = 0; i < samples; i ++ ) {
      const t = i / sampleRate;
      ch[ i ] = ( Math.random() - 0.5 ) * Math.exp( -5.0 * t );
    }
  }

  return buffer;
}
