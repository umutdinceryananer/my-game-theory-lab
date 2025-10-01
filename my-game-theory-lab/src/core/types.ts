// Core types for MVP
export type Move = 'COOPERATE' | 'DEFECT';

export interface GameHistory {
  playerMoves: Move[];
  opponentMoves: Move[];
  scores: number[];
  opponentScores: number[];
}

export interface Strategy {
  name: string;
  description: string;
  play: (history: GameHistory, roundNumber: number) => Move;
}

export interface PayoffMatrix {
  temptation: number; // payoff when player defects and opponent cooperates
  reward: number;     // payoff when both cooperate
  punishment: number; // payoff when both defect
  sucker: number;     // payoff when player cooperates and opponent defects
}

export const DEFAULT_PAYOFF_MATRIX: PayoffMatrix = {
  temptation: 5,
  reward: 3,
  punishment: 1,
  sucker: 0,
};