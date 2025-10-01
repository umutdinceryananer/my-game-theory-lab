import type { Strategy } from '../core/types';

export const pavlov: Strategy = {
  name: 'Pavlov (Win-Stay)',
  description: 'Repeats last move if it yielded a high payoff; otherwise switches.',
  play: (history, round) => {
    if (round === 0) return 'COOPERATE';

    const lastMove = history.playerMoves[round - 1];
    const lastPayoff = history.scores[round - 1] ?? 0;
    const highPayoff = lastPayoff >= 3;
    if (highPayoff) return lastMove;
    return lastMove === 'COOPERATE' ? 'DEFECT' : 'COOPERATE';
  },
};