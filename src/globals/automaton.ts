import { Automaton } from '@0b5vr/automaton';
import { AutomatonWithGUI } from '@0b5vr/automaton-with-gui';
import { Clock } from '@0b5vr/experimental';
import { fxDefinitions } from './automaton-fxs/fxDefinitions';
import { getDivAutomaton } from './dom';
import automatonData from '../automaton.json';

export const automaton = ( () => {
  if ( process.env.DEV ) {
    // this cast smells so bad
    // https://github.com/FMS-Cat/automaton/issues/121
    const automatonWithGUI = new AutomatonWithGUI(
      automatonData,
      {
        gui: getDivAutomaton(),
        isPlaying: true,
        fxDefinitions,
      },
    );

    if ( module.hot ) {
      module.hot.accept( '../automaton.json', () => {
        // we probably don't need this feature for now...
        // See: https://github.com/FMS-Cat/automaton/issues/120
        // automatonWithGUI.deserialize( automatonData );
      } );
    }

    return automatonWithGUI;
  } else {
    return new Automaton(
      automatonData,
      {
        fxDefinitions,
      },
    );
  }
} )();

/**
 * Since automaton and clock try to reference each other...
 */
export function automatonSetupClock( clock: Clock ): void {
  if ( process.env.DEV ) {
    const automatonWithGUI = automaton as AutomatonWithGUI;

    automatonWithGUI.on( 'play', () => { clock.play(); } );
    automatonWithGUI.on( 'pause', () => { clock.pause(); } );
    automatonWithGUI.on( 'seek', ( { time } ) => {
      clock.setTime( Math.max( 0.0, time ) );
      automatonWithGUI.reset();
    } );
  }
}

export const auto = automaton.auto;
