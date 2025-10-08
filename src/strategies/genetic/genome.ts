import type { Move } from '@/core/types';

export type GeneId = string;

/**
 * Describes the conditional branch used by a genetic strategy when deciding on a move.
 * Conditions are deliberately lightweight so we can start iterating without touching the
 * tournament engine. Additional predicates (score differentials, stochastic gates, etc.)
 * can layer on later without breaking existing genomes.
 */
export interface GeneCondition {
  /**
   * Expected opponent move from the previous round. When omitted the check is skipped.
   */
  opponentLastMove?: Move;
  /**
   * Expected self move from the previous round. When omitted the check is skipped.
   */
  selfLastMove?: Move;
  /**
   * Optional inclusive round range where this gene applies. Useful for encoding openings/endgames.
   */
  roundRange?: [startInclusive: number, endInclusive: number];
}

/**
 * A single rule within the genome. Rules are evaluated in order; the first match yields the move.
 */
export interface Gene {
  id: GeneId;
  condition: GeneCondition;
  response: Move;
  /**
   * Weight lets us bias selection when multiple genes match. Default weight is 1.
   */
  weight?: number;
}

/**
 * A genome is an ordered list of genes evaluated sequentially.
 */
export type Genome = Gene[];

/**
 * Configuration required to build a Strategy instance from a genome.
 */
export interface GeneticStrategyConfig {
  name: string;
  description: string;
  genome: Genome;
  /**
   * Default mutation rate for future evolutionary passes. Stored here so we can propagate
   * metadata without wiring it into the tournament just yet.
   */
  mutationRate?: number;
  /**
   * Default crossover rate. Mirrors mutationRate comment.
   */
  crossoverRate?: number;
}
