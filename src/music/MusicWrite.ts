import { MusicOffline } from './MusicOffline';
import { TaskProgress } from '../utils/TaskProgress';
import toWav from 'audiobuffer-to-wav';

export class MusicWrite extends MusicOffline {
  public prepare(): TaskProgress {
    return new TaskProgress( async ( setProgress ) => {
      await super.prepare().promise;
      setProgress( 0.5 );

      const b = toWav( this.__buffer );
      const blob = new Blob( [ b ] );
      const anchor = document.createElement( 'a' );
      anchor.href = URL.createObjectURL( blob );
      anchor.download = 'wenis.wav';
      anchor.click();
      setProgress( 1.0 );
    } );
  }
}
