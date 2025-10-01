import type { Strategy, PayoffMatrix } from './types';
import { DEFAULT_PAYOFF_MATRIX } from './types';
import { PrisonersDilemmaGame } from './game';
import { createRandomSource } from './random';

export interface TournamentResult {
  name: string;
  totalScore: number;
  averageScore: number;
  matchesPlayed: number;
  wins: number;
}

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

    const results: TournamentResult[] =
      strategies.map((strategy) => ({
        name: strategy.name,
        totalScore: 0,
        averageScore: 0,
        matchesPlayed: 0,
        wins: 0,
      }));

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

          if (rematch.player2Score > rematch.player1Score) results[i].wins++;
          else if (rematch.player1Score > rematch.player2Score) results[j].wins++;
        }
      }
    }

    // Compute averages and sort by total score
    results.forEach((result) => {
      if (result.matchesPlayed > 0) {
        result.averageScore = result.totalScore / result.matchesPlayed;
      }
    });

    results.sort((a, b) => b.totalScore - a.totalScore);

    return results;
  }

  /**
   * Format results for console
   */
  formatResults(results: TournamentResult[]): void {
    console.log('\n=== TOURNAMENT RESULTS ===');
    console.log('Rank | Strategy          | Score | Avg   | Wins | Matches');
    console.log('-----|-------------------|-------|-------|------|--------');

    results.forEach((result, index) => {
      const rank = (index + 1).toString().padStart(4);
      const name = result.name.padEnd(17);
      const score = result.totalScore.toString().padStart(5);
      const average = result.averageScore.toFixed(2).padStart(5);
      const wins = result.wins.toString().padStart(4);
      const matches = result.matchesPlayed.toString().padStart(6);
      console.log(`${rank} | ${name} | ${score} | ${average} | ${wins} | ${matches}`);
    });
  }
}