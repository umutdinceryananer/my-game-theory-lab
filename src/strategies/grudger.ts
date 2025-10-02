import type { Strategy } from '../core/types';

export const grudger: Strategy = {
  name: 'Grudger',
  description: 'Cooperates until the opponent defects once, then always defects.',
  play: (history) => {
    const hasBeenBetrayed = history.opponentMoves.includes('DEFECT');
    return hasBeenBetrayed ? 'DEFECT' : 'COOPERATE';
  },
};