import { ClockRealtime } from '@fms-cat/experimental';
import { automatonSetupClock } from './automaton';

export const clock = new ClockRealtime();
clock.play();

automatonSetupClock( clock );
