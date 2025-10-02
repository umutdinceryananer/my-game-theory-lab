import type { Strategy, PayoffMatrix } from './types';
import { DEFAULT_PAYOFF_MATRIX } from './types';
import { PrisonersDilemmaGame } from './game';
import { createRandomSource } from './random';

export interface HeadToHeadSummary {
  opponent: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  playerScore: number;
  opponentScore: number;
  averageScore: number;
}

export interface TournamentResult {
  name: string;
  totalScore: number;
  averageScore: number;
  matchesPlayed: number;
  wins: number;
  stdDeviation: number;
  headToHead: HeadToHeadSummary[];
}

interface HeadToHeadStats {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  playerScore: number;
  opponentScore: number;
}

const createHeadStats = (): HeadToHeadStats => ({
  matches: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  playerScore: 0,
  opponentScore: 0,
});

// Simple tournament - just what we need
export class Tournament {
  private game = new PrisonersDilemmaGame();

  /**
   * Run a round-robin tournament
   */
  run(
    strategies: Strategy[],
    roundsPerMatch: number = 100,
    errorRate: number = 0,
    payoffMatrix: PayoffMatrix = DEFAULT_PAYOFF_MATRIX,
    seed?: number | string,
    doubleRoundRobin: boolean = false,
  ): TournamentResult[] {
    if (strategies.length < 2) {
      throw new Error('Need at least 2 strategies');
    }

    const seededRandom = seed !== undefined ? createRandomSource(seed) : undefined;

    const scores: number[][] = strategies.map(() => []);
    const headToHeadMaps: Map<string, HeadToHeadStats>[] = strategies.map(() => new Map());

    const results: TournamentResult[] = strategies.map((strategy) => ({
      name: strategy.name,
      totalScore: 0,
      averageScore: 0,
      matchesPlayed: 0,
      wins: 0,
      stdDeviation: 0,
      headToHead: [],
    }));

    const updateHeadToHead = (
      map: Map<string, HeadToHeadStats>,
      opponent: string,
      playerScore: number,
      opponentScore: number,
    ) => {
      const entry = map.get(opponent) ?? createHeadStats();
      entry.matches += 1;
      entry.playerScore += playerScore;
      entry.opponentScore += opponentScore;
      if (playerScore > opponentScore) entry.wins += 1;
      else if (playerScore === opponentScore) entry.draws += 1;
      else entry.losses += 1;
      map.set(opponent, entry);
    };

    // Play all matches
    for (let i = 0; i < strategies.length; i++) {
      for (let j = i + 1; j < strategies.length; j++) {
        const randomSource = seededRandom ?? createRandomSource();
        const match = this.game.playMatch(
          strategies[i],
          strategies[j],
          roundsPerMatch,
          errorRate,
          payoffMatrix,
          randomSource,
        );

        // Update scores
        results[i].totalScore += match.player1Score;
        results[j].totalScore += match.player2Score;
        results[i].matchesPlayed += 1;
        results[j].matchesPlayed += 1;

        scores[i].push(match.player1Score);
        scores[j].push(match.player2Score);

        updateHeadToHead(headToHeadMaps[i], strategies[j].name, match.player1Score, match.player2Score);
        updateHeadToHead(headToHeadMaps[j], strategies[i].name, match.player2Score, match.player1Score);

        // Count wins
        if (match.player1Score > match.player2Score) results[i].wins++;
        else if (match.player2Score > match.player1Score) results[j].wins++;

        if (doubleRoundRobin) {
          const randomSourceRematch = seededRandom ?? createRandomSource();
          const rematch = this.game.playMatch(
            strategies[j],
            strategies[i],
            roundsPerMatch,
            errorRate,
            payoffMatrix,
            randomSourceRematch,
          );

          results[i].totalScore += rematch.player2Score;
          results[j].totalScore += rematch.player1Score;
          results[i].matchesPlayed += 1;
          results[j].matchesPlayed += 1;

          scores[i].push(rematch.player2Score);
          scores[j].push(rematch.player1Score);

          updateHeadToHead(headToHeadMaps[i], strategies[j].name, rematch.player2Score, rematch.player1Score);
          updateHeadToHead(headToHeadMaps[j], strategies[i].name, rematch.player1Score, rematch.player2Score);

          if (rematch.player2Score > rematch.player1Score) results[i].wins++;
          else if (rematch.player1Score > rematch.player2Score) results[j].wins++;
        }
      }
    }

    // Compute aggregates
    results.forEach((result, index) => {
      if (result.matchesPlayed > 0) {
        result.averageScore = result.totalScore / result.matchesPlayed;
        const playerScores = scores[index];
        if (playerScores.length > 1) {
          const mean = result.averageScore;
          const variance = playerScores.reduce((acc, score) => acc + (score - mean) ** 2, 0) / playerScores.length;
          result.stdDeviation = Math.sqrt(variance);
        } else {
          result.stdDeviation = 0;
        }
      }

      const headSummaries: HeadToHeadSummary[] = [];
      headToHeadMaps[index].forEach((stats, opponent) => {
        headSummaries.push({
          opponent,
          matches: stats.matches,
          wins: stats.wins,
          draws: stats.draws,
          losses: stats.losses,
          playerScore: stats.playerScore,
          opponentScore: stats.opponentScore,
          averageScore: stats.playerScore / stats.matches,
        });
      });
      headSummaries.sort((a, b) => b.averageScore - a.averageScore);
      result.headToHead = headSummaries;
    });

    results.sort((a, b) => b.totalScore - a.totalScore);

    return results;
  }

  /**
   * Format results into displayable strings
   */
  formatResults(results: TournamentResult[]): string[] {
    const lines: string[] = [
      '=== TOURNAMENT RESULTS ===',
      'Rank | Strategy          | Score | Avg   | Std   | Wins | Matches',
      '-----|-------------------|-------|-------|-------|------|--------',
    ];

    results.forEach((result, index) => {
      const rank = (index + 1).toString().padStart(4);
      const name = result.name.padEnd(17);
      const score = result.totalScore.toString().padStart(5);
      const average = result.averageScore.toFixed(2).padStart(5);
      const std = result.stdDeviation.toFixed(2).padStart(5);
      const wins = result.wins.toString().padStart(4);
      const matches = result.matchesPlayed.toString().padStart(6);
      lines.push(`${rank} | ${name} | ${score} | ${average} | ${std} | ${wins} | ${matches}`);
    });

    return lines;
  }
}
