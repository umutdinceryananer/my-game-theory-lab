import type { Strategy } from '../core/types';

export const titForTwoTats: Strategy = {
  name: 'Tit for Two Tats',
  description: 'Defects only after two consecutive opponent defections.',
  play: (history) => {
    if (history.opponentMoves.length < 2) {
      return history.opponentMoves.at(-1) ?? 'COOPERATE';
    }

    const last = history.opponentMoves.at(-1);
    const secondLast = history.opponentMoves.at(-2);
    return last === 'DEFECT' && secondLast === 'DEFECT' ? 'DEFECT' : 'COOPERATE';
  },
};