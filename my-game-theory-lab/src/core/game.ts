import type { Move, Strategy } from './types';

// Simple game - just the essentials
export class PrisonersDilemmaGame {
  // Fixed payoff matrix
  private static readonly PAYOFFS = {
    'COOPERATE-COOPERATE': [3, 3],
    'COOPERATE-DEFECT': [0, 5],
    'DEFECT-COOPERATE': [5, 0],
    'DEFECT-DEFECT': [1, 1],
  } as const;

  private static invertMove(move: Move): Move {
    return move === 'COOPERATE' ? 'DEFECT' : 'COOPERATE';
  }

  /**
   * Play a match between two strategies
   */
  playMatch(
    strategy1: Strategy,
    strategy2: Strategy,
    rounds: number = 100,
    errorRate: number = 0,
  ) {
    let score1 = 0;
    let score2 = 0;
    const history1: Move[] = [];
    const history2: Move[] = [];

    for (let round = 0; round < rounds; round++) {
      // Simple history - just moves
      const gameHistory1 = {
        playerMoves: history1,
        opponentMoves: history2,
        scores: [],
        opponentScores: [],
      };
      const gameHistory2 = {
        playerMoves: history2,
        opponentMoves: history1,
        scores: [],
        opponentScores: [],
      };

      let move1 = strategy1.play(gameHistory1, round);
      let move2 = strategy2.play(gameHistory2, round);

      if (errorRate > 0) {
        if (Math.random() < errorRate) move1 = PrisonersDilemmaGame.invertMove(move1);
        if (Math.random() < errorRate) move2 = PrisonersDilemmaGame.invertMove(move2);
      }

      // Calculate and add scores
      const key = `${move1}-${move2}` as keyof typeof PrisonersDilemmaGame.PAYOFFS;
      const [points1, points2] = PrisonersDilemmaGame.PAYOFFS[key];

      score1 += points1;
      score2 += points2;
      history1.push(move1);
      history2.push(move2);
    }

    return {
      player1: strategy1.name,
      player2: strategy2.name,
      player1Score: score1,
      player2Score: score2,
      rounds,
    };
  }
}