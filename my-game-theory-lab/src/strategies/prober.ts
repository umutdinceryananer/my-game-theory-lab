import type { Strategy } from '../core/types';

export const prober: Strategy = {
  name: 'Prober',
  description: 'Tries DEFECT-COOPERATE-COOPERATE probe, defects if opponent retaliates.',
  play: (history, round) => {
    if (round === 0) return 'DEFECT';
    if (round === 1 || round === 2) return 'COOPERATE';

    const opponentMoves = history.opponentMoves;
    const retaliated = opponentMoves[0] === 'DEFECT' || opponentMoves[1] === 'DEFECT';
    return retaliated ? opponentMoves[round - 1] : 'DEFECT';
  },
};