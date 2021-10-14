import { ClockRealtime } from '@0b5vr/experimental';
import { automatonSetupClock } from './automaton';

export const clock = new ClockRealtime();
clock.play();

automatonSetupClock( clock );
