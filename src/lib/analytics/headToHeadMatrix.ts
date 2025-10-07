import type { TournamentResult } from "@/core/tournament";

export interface HeadToHeadMatrixCell {
  strategy: string;
  opponent: string;
  matches: number;
  playerScore: number;
  opponentScore: number;
  scoreDifferential: number;
  wins: number;
  draws: number;
  losses: number;
  averageScore: number;
}

export interface HeadToHeadMatrix {
  strategies: string[];
  matrix: (HeadToHeadMatrixCell | null)[][];
  minDifferential: number;
  maxDifferential: number;
}

export function buildHeadToHeadMatrix(results: TournamentResult[]): HeadToHeadMatrix {
  if (results.length === 0) {
    return {
      strategies: [],
      matrix: [],
      minDifferential: 0,
      maxDifferential: 0,
    };
  }

  const strategies = results.map((result) => result.name);
  const nameToIndex = new Map<string, number>();
  strategies.forEach((name, index) => nameToIndex.set(name, index));

  const matrix: (HeadToHeadMatrixCell | null)[][] = strategies.map(() =>
    strategies.map(() => null),
  );

  let minDifferential = Infinity;
  let maxDifferential = -Infinity;

  results.forEach((result) => {
    const rowIndex = nameToIndex.get(result.name);
    if (rowIndex === undefined) return;

    result.headToHead.forEach((summary) => {
      const columnIndex = nameToIndex.get(summary.opponent);
      if (columnIndex === undefined) return;

      const scoreDifferential = summary.playerScore - summary.opponentScore;
      const cell: HeadToHeadMatrixCell = {
        strategy: result.name,
        opponent: summary.opponent,
        matches: summary.matches,
        playerScore: summary.playerScore,
        opponentScore: summary.opponentScore,
        scoreDifferential,
        wins: summary.wins,
        draws: summary.draws,
        losses: summary.losses,
        averageScore: summary.averageScore,
      };

      matrix[rowIndex][columnIndex] = cell;
      minDifferential = Math.min(minDifferential, scoreDifferential);
      maxDifferential = Math.max(maxDifferential, scoreDifferential);
    });
  });

  if (minDifferential === Infinity) {
    minDifferential = 0;
    maxDifferential = 0;
  }

  return {
    strategies,
    matrix,
    minDifferential,
    maxDifferential,
  };
}
