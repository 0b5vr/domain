import { MUSIC_LENGTH } from '../config';
import { Music } from './Music';
import { TaskProgress } from '../utils/TaskProgress';
import { audio } from '../globals/music';
import { gl } from '../globals/canvas';

const BUFFER_LENGTH = 16384;

export class MusicOffline extends Music {
  protected __buffer: AudioBuffer;
  private __currentBufferSource?: AudioBufferSourceNode | null;

  public constructor() {
    super( BUFFER_LENGTH );

    this.__buffer = audio.createBuffer(
      2,
      MUSIC_LENGTH * audio.sampleRate,
      audio.sampleRate
    );
  }

  public prepare(): TaskProgress {
    return new TaskProgress( async ( setProgress ) => {
      await super.prepare().promise;

      let head = 0;
      const numBuffer = MUSIC_LENGTH * audio.sampleRate;

      await new Promise<void>( ( resolve ) => {
        const render = (): void => {
          setProgress( head / numBuffer );

          if ( numBuffer <= head ) {
            resolve();
            return;
          }

          this.__render( head / audio.sampleRate, ( i ) => {
            gl.getBufferSubData(
              gl.ARRAY_BUFFER,
              0,
              this.__buffer.getChannelData( i ),
              head,
              BUFFER_LENGTH,
            );
          } );

          head += BUFFER_LENGTH;

          setTimeout( render, 1 );
        };
        render();
      } );
    } );
  }

  public __updateImpl(): void {
    if ( this.isPlaying && this.__currentBufferSource == null ) {
      this.__currentBufferSource = audio.createBufferSource();
      this.__currentBufferSource.buffer = this.__buffer;
      this.__currentBufferSource.connect( this.__musicDest );

      this.__currentBufferSource.start( audio.currentTime, this.time );
    }

    if ( !this.isPlaying && this.__currentBufferSource != null ) {
      this.__currentBufferSource.stop( audio.currentTime );
      this.__currentBufferSource = null;
    }
  }
}
