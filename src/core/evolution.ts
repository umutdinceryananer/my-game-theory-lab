import type { GeneticStrategyConfig, Genome } from '@/strategies/genetic';

/**
 * Selection strategies describe how parent individuals are chosen from a population.
 * Additional methods can be added once the core evolutionary loop is implemented.
 */
export type EvolutionSelectionMethod =
  | 'roulette-wheel'
  | 'tournament'
  | 'rank'
  | 'elitist';

/**
 * Mutation operators describe how child genomes should be mutated.
 * Specific implementations live under `src/strategies/genetic/operators.ts`.
 */
export type EvolutionMutationOperator = 'bit-flip' | 'gaussian' | 'swap';

/**
 * Crossover operators describe how parent genomes should be combined.
 */
export type EvolutionCrossoverOperator = 'single-point' | 'two-point' | 'uniform';

/**
 * High level settings that define an evolutionary run.
 * These settings will be surfaced in the UI and persisted alongside tournament runs.
 */
export interface EvolutionSettings {
  populationSize: number;
  generations: number;
  selectionMethod: EvolutionSelectionMethod;
  mutationOperator: EvolutionMutationOperator;
  crossoverOperator: EvolutionCrossoverOperator;
  mutationRate: number;
  crossoverRate: number;
  elitismCount: number;
  tournamentSize?: number;
  randomSeed?: number | string;
  profilingEnabled?: boolean;
}

/**
 * A single individual in the population.
 */
export interface PopulationIndividual {
  id: string;
  strategyName: string;
  config: GeneticStrategyConfig;
  genome: Genome;
  fitness: number | null;
  parentIds: string[];
  generationIntroduced: number;
  metadata?: Record<string, unknown>;
}

/**
 * Aggregate metrics tracked for each generation.
 */
export interface EvolutionMetrics {
  bestFitness: number | null;
  averageFitness: number | null;
  medianFitness: number | null;
  mutationCount: number;
  crossoverCount: number;
  runtimeMs?: number;
}

export interface EvolutionRuntimeMetrics {
  totalRuntimeMs: number;
  averageGenerationMs: number;
  generationDurations: number[];
}

/**
 * Snapshot of a single generation.
 */
export interface GenerationSnapshot {
  generation: number;
  population: PopulationIndividual[];
  metrics: EvolutionMetrics;
  bestIndividualId: string | null;
  createdAt: number;
}

/**
 * Summary returned after a complete evolutionary run.
 */
export interface EvolutionSummary {
  bestIndividual: PopulationIndividual | null;
  finalPopulation: PopulationIndividual[];
  history: GenerationSnapshot[];
  settings: EvolutionSettings;
  runtimeMetrics?: EvolutionRuntimeMetrics;
}

/**
 * Function invoked to evaluate the fitness of a single individual.
 * Implementations will usually run tournament simulations using the individual strategy.
 */
export type EvaluateFitnessFn = (
  individual: PopulationIndividual,
  context: EvolutionContext,
) => Promise<number> | number;

/**
 * Context handed to evolution hooks. Provides accessors to randomness and previous results.
 */
export interface EvolutionContext {
  settings: EvolutionSettings;
  generation: number;
  random: () => number;
  history: GenerationSnapshot[];
}

/**
 * Optional hooks that fire during the evolutionary loop. Useful for telemetry and UI updates.
 */
export interface EvolutionHooks {
  onGenerationStart?: (context: EvolutionContext) => void;
  onGenerationComplete?: (snapshot: GenerationSnapshot) => void;
  onMutationApplied?: (individual: PopulationIndividual) => void;
  onCrossoverApplied?: (
    parents: PopulationIndividual[],
    offspring: PopulationIndividual[],
  ) => void;
}

/**
 * Definition for the eventual evolutionary engine. This interface is used so the data model
 * can be reasoned about before implementation.
 */
export interface EvolutionEngine {
  settings: EvolutionSettings;
  hooks?: EvolutionHooks;

  /**
   * Creates the initial population. May source genomes from the genetic editor or defaults.
  */
  initializePopulation(): PopulationIndividual[];

  /**
   * Runs the configured number of generations and returns a summary.
   */
  run(params: {
    evaluateFitness?: EvaluateFitnessFn;
    initialPopulation?: PopulationIndividual[];
  }): Promise<EvolutionSummary>;
}

/**
 * Utility type guard used while the implementation is in flux.
 */
export function isEvolutionEngine(value: unknown): value is EvolutionEngine {
  if (!value || typeof value !== 'object') return false;
  const engine = value as EvolutionEngine;
  return (
    typeof engine.settings === 'object' &&
    typeof engine.initializePopulation === 'function' &&
    typeof engine.run === 'function'
  );
}

export { createBasicEvolutionEngine } from './evolutionEngine';
