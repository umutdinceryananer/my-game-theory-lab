import { Tournament, type TournamentResult } from './core/tournament';
import { DEFAULT_PAYOFF_MATRIX, type PayoffMatrix } from './core/types';
import { defaultStrategies } from './strategies';

export function simulateTournament(
  rounds: number = 100,
  errorRate: number = 0,
  payoffMatrix: PayoffMatrix = DEFAULT_PAYOFF_MATRIX,
  seed?: number | string,
  doubleRoundRobin: boolean = false,
): TournamentResult[] {
  const tournament = new Tournament();
  return tournament.run(
    defaultStrategies,
    rounds,
    errorRate,
    payoffMatrix,
    seed,
    doubleRoundRobin,
  );
}