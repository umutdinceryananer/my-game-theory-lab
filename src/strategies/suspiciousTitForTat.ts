import type { Strategy } from '../core/types';

export const suspiciousTitForTat: Strategy = {
  name: 'Suspicious Tit-for-Tat',
  description: 'Opens with defection, then mirrors the opponent’s previous move.',
  play: (history) => {
    if (history.opponentMoves.length === 0) {
      return 'DEFECT';
    }

    return history.opponentMoves.at(-1) ?? 'COOPERATE';
  },
};