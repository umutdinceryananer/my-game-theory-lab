import { Tournament, type TournamentResult } from './core/tournament';
import { defaultStrategies } from './strategies';

export function simulateTournament(rounds: number = 100): TournamentResult[] {
  console.log("=== PRISONER'S DILEMMA TOURNAMENT ===");

  const tournament = new Tournament();
  const results = tournament.run(defaultStrategies, rounds);
  tournament.formatResults(results);

  return results;
}