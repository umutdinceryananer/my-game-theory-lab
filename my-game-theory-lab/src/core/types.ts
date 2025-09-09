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
