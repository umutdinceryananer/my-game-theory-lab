import type { Strategy } from '../core/types';

const FORGIVENESS_RATE = 0.2;

export const generousTitForTat: Strategy = {
  name: 'Generous Tit-for-Tat',
  description: 'Copies the opponent but occasionally forgives defections with 20% probability.',
  play: (history) => {
    if (history.opponentMoves.length === 0) return 'COOPERATE';

    const last = history.opponentMoves.at(-1);
    if (last === 'COOPERATE') return 'COOPERATE';

    return history.random() < FORGIVENESS_RATE ? 'COOPERATE' : 'DEFECT';
  },
};