import { Tournament, type TournamentResult } from './core/tournament';
import { defaultStrategies } from './strategies';

export function simulateTournament(
  rounds: number = 100,
  errorRate: number = 0,
): TournamentResult[] {
  console.log("=== PRISONER'S DILEMMA TOURNAMENT ===");
  console.log(`Rounds per match: ${rounds}`);
  console.log(`Noise (error rate): ${(errorRate * 100).toFixed(1)}%`);

  const tournament = new Tournament();
  const results = tournament.run(defaultStrategies, rounds, errorRate);
  tournament.formatResults(results);

  return results;
}