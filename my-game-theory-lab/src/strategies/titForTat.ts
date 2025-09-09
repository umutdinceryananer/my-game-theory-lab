import type { Strategy } from '../core/types';

export const titForTat: Strategy = {
  name: 'Tit-for-Tat',
  description: 'Copies opponent\'s last move',
  play: (history) => history.opponentMoves.length > 0 
    ? history.opponentMoves[history.opponentMoves.length - 1] 
    : 'COOPERATE'
};
