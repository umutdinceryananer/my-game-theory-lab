import type { Move, Strategy, PayoffMatrix } from './types';
import { DEFAULT_PAYOFF_MATRIX } from './types';

// Simple game - just the essentials
export class PrisonersDilemmaGame {
  private static invertMove(move: Move): Move {
    return move === 'COOPERATE' ? 'DEFECT' : 'COOPERATE';
  }

  private static getPayoffs(matrix: PayoffMatrix, move1: Move, move2: Move): [number, number] {
    if (move1 === 'COOPERATE' && move2 === 'COOPERATE') {
      return [matrix.reward, matrix.reward];
    }

    if (move1 === 'COOPERATE' && move2 === 'DEFECT') {
      return [matrix.sucker, matrix.temptation];
    }

    if (move1 === 'DEFECT' && move2 === 'COOPERATE') {
      return [matrix.temptation, matrix.sucker];
    }

    return [matrix.punishment, matrix.punishment];
  }

  /**
   * Play a match between two strategies
   */
  playMatch(
    strategy1: Strategy,
    strategy2: Strategy,
    rounds: number = 100,
    errorRate: number = 0,
    payoffMatrix: PayoffMatrix = DEFAULT_PAYOFF_MATRIX,
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

      const [points1, points2] = PrisonersDilemmaGame.getPayoffs(payoffMatrix, move1, move2);

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