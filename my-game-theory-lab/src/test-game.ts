import { Tournament, type TournamentResult } from './core/tournament';
import { DEFAULT_PAYOFF_MATRIX, type PayoffMatrix } from './core/types';
import { defaultStrategies } from './strategies';

export function simulateTournament(
  rounds: number = 100,
  errorRate: number = 0,
  payoffMatrix: PayoffMatrix = DEFAULT_PAYOFF_MATRIX,
  seed?: number | string,
): TournamentResult[] {
  console.log("=== PRISONER'S DILEMMA TOURNAMENT ===");
  console.log(`Rounds per match: ${rounds}`);
  console.log(`Noise (error rate): ${(errorRate * 100).toFixed(1)}%`);
  console.log(
    `Payoff matrix (T, R, P, S): ${payoffMatrix.temptation}, ${payoffMatrix.reward}, ${payoffMatrix.punishment}, ${payoffMatrix.sucker}`,
  );
  if (seed !== undefined) {
    console.log(`Seed: ${seed}`);
  }

  const tournament = new Tournament();
  const results = tournament.run(defaultStrategies, rounds, errorRate, payoffMatrix, seed);
  tournament.formatResults(results);

  return results;
}