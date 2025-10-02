import type { Strategy } from '../core/types';

export const softGrudger: Strategy = {
  name: 'Soft Grudger',
  description: 'Forgives after punishing defections with two retaliatory defects.',
  play: (history, round) => {
    if (round === 0) return 'COOPERATE';

    const lastDefectionIndex = history.opponentMoves.lastIndexOf('DEFECT');
    if (lastDefectionIndex === -1) {
      return 'COOPERATE';
    }

    const roundsSinceDefection = history.opponentMoves.length - 1 - lastDefectionIndex;
    return roundsSinceDefection < 2 ? 'DEFECT' : 'COOPERATE';
  },
};