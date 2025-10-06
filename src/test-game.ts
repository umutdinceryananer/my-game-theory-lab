import { Tournament, type TournamentResult, DEFAULT_TOURNAMENT_FORMAT, type TournamentFormat } from './core/tournament';
import { DEFAULT_PAYOFF_MATRIX, type PayoffMatrix, type Strategy } from './core/types';
import { defaultStrategies } from './strategies';

export interface SimulateTournamentOptions {
  rounds?: number;
  errorRate?: number;
  payoffMatrix?: PayoffMatrix;
  seed?: number | string;
  format?: TournamentFormat;
  doubleRoundRobin?: boolean;
  strategies?: Strategy[];
}

export function simulateTournament(options: SimulateTournamentOptions = {}): TournamentResult[] {
  const {
    rounds = 100,
    errorRate = 0,
    payoffMatrix = DEFAULT_PAYOFF_MATRIX,
    seed,
    format,
    doubleRoundRobin = false,
    strategies = defaultStrategies,
  } = options;

  const effectiveFormat =
    format ?? (doubleRoundRobin ? { kind: 'double-round-robin' as const } : DEFAULT_TOURNAMENT_FORMAT);

  const tournament = new Tournament();
  return tournament.runWithFormat(effectiveFormat, strategies, rounds, errorRate, payoffMatrix, seed);
}
