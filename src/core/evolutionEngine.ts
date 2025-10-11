import { createRandomSource } from './random';
import { Tournament, DEFAULT_TOURNAMENT_FORMAT } from './tournament';
import { DEFAULT_PAYOFF_MATRIX } from './types';
import type { PayoffMatrix, Strategy } from './types';
import type { TournamentFormat } from './tournament';
import { cloneGeneticConfig, ensureGeneIds } from '@/strategies/genetic/utils';
import { createGeneticStrategy } from '@/strategies/genetic';
import {
  bitFlipMutation,
  gaussianMutation,
  singlePointCrossover,
  twoPointCrossover,
  uniformCrossover,
  swapMutation,
} from '@/strategies/genetic/operators';
import type {
  EvolutionContext,
  EvolutionEngine,
  EvolutionHooks,
  EvolutionSettings,
  EvolutionSummary,
  EvaluateFitnessFn,
  GenerationSnapshot,
  PopulationIndividual,
} from './evolution';
import type { GeneticStrategyConfig, Genome } from '@/strategies/genetic';

const now = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

interface FitnessOptions {
  rounds?: number;
  errorRate?: number;
  payoffMatrix?: PayoffMatrix;
  format?: TournamentFormat;
}

interface BasicEvolutionEngineOptions {
  settings: EvolutionSettings;
  seedPool: GeneticStrategyConfig[];
  opponents: Strategy[];
  hooks?: EvolutionHooks;
  fitness?: FitnessOptions;
}

const DEFAULT_TOURNAMENT_ROUNDS = 100;
const MIN_TOURNAMENT_SIZE = 2;

let individualCounter = 0;
const createIndividualId = (prefix: string): string => {
  individualCounter += 1;
  return `${prefix}-${individualCounter.toString(36)}`;
};

export function createBasicEvolutionEngine({
  settings,
  seedPool,
  opponents,
  hooks,
  fitness,
}: BasicEvolutionEngineOptions): EvolutionEngine {
  if (!Array.isArray(seedPool) || seedPool.length === 0) {
    throw new Error('Evolution engine requires at least one seed genetic strategy config.');
  }
  if (!Array.isArray(opponents) || opponents.length < MIN_TOURNAMENT_SIZE - 1) {
    throw new Error('Evolution engine requires at least one opponent strategy.');
  }

  class BasicEvolutionEngine implements EvolutionEngine {
    settings = settings;
    hooks = hooks;

    initializePopulation(): PopulationIndividual[] {
      const random = createRandomSource(this.settings.randomSeed);
      const population: PopulationIndividual[] = [];
      for (let index = 0; index < this.settings.populationSize; index += 1) {
        const seed = seedPool[index % seedPool.length];
        const baseConfig = cloneGeneticConfig(seed);
        const genome = ensureGeneIds(baseConfig.genome);
        const mutatedGenome =
          this.settings.mutationRate > 0
            ? bitFlipMutation(genome, { mutationRate: this.settings.mutationRate / 2, random })
            : genome;
        const config = {
          ...baseConfig,
          genome: mutatedGenome,
        };
        const id = createIndividualId('seed');
        population.push({
          id,
          strategyName: `${config.name} #${id}`,
          config,
          genome: mutatedGenome,
          fitness: null,
          parentIds: [],
          generationIntroduced: 0,
        });
      }
      return population;
    }

    async run({
      evaluateFitness,
      initialPopulation,
    }: {
      evaluateFitness?: EvaluateFitnessFn;
      initialPopulation?: PopulationIndividual[];
    }): Promise<EvolutionSummary> {
      const tournament = new Tournament();
      const random = createRandomSource(this.settings.randomSeed);
      const evaluate =
        evaluateFitness ??
        (async (individual: PopulationIndividual): Promise<number> => {
          const geneticStrategy = createGeneticStrategy({
            ...individual.config,
            name: individual.strategyName,
          });
          const strategies: Strategy[] = [geneticStrategy, ...opponents];
          const outcome = tournament.runWithFormat(
            fitness?.format ?? DEFAULT_TOURNAMENT_FORMAT,
            strategies,
            fitness?.rounds ?? DEFAULT_TOURNAMENT_ROUNDS,
            fitness?.errorRate ?? 0,
            fitness?.payoffMatrix ?? DEFAULT_PAYOFF_MATRIX,
            this.settings.randomSeed,
          );
          const result = outcome.results.find((entry) => entry.name === individual.strategyName);
          return result ? result.totalScore : 0;
        });

      let currentPopulation =
        initialPopulation && initialPopulation.length > 0
          ? initialPopulation.map((individual) => ({
              ...individual,
              genome: ensureGeneIds(individual.genome),
            }))
          : this.initializePopulation();

      const history: GenerationSnapshot[] = [];
      let bestIndividual: PopulationIndividual | null = null;
      let mutationEvents = 0;
      let crossoverEvents = 0;
      const profilingEnabled = Boolean(this.settings.profilingEnabled);
      const runStart = profilingEnabled ? now() : 0;
      const generationDurations: number[] = [];

      for (let generation = 0; generation < this.settings.generations; generation += 1) {
        const generationStart = profilingEnabled ? now() : 0;
        const context = this.buildContext(generation, history, random);
        this.hooks?.onGenerationStart?.(context);

        // Evaluate fitness
        for (const individual of currentPopulation) {
          const fitnessValue = await evaluate(individual, context);
          individual.fitness = fitnessValue;
        }

        // Metrics & snapshot
        const metrics = this.computeMetrics(currentPopulation, mutationEvents, crossoverEvents);
        const generationRuntime = profilingEnabled ? now() - generationStart : undefined;
        if (generationRuntime !== undefined) {
          metrics.runtimeMs = generationRuntime;
          generationDurations.push(generationRuntime);
        }
        const clonedPopulation = currentPopulation.map((individual) => ({
          ...individual,
          config: cloneGeneticConfig(individual.config),
          genome: ensureGeneIds(individual.genome),
        }));
        const best = this.pickBestIndividual(currentPopulation);
        if (!bestIndividual || (best && (bestIndividual.fitness ?? -Infinity) < (best.fitness ?? -Infinity))) {
          bestIndividual = best ? { ...best, config: cloneGeneticConfig(best.config) } : bestIndividual;
        }
        const snapshot: GenerationSnapshot = {
          generation,
          population: clonedPopulation,
          metrics,
          bestIndividualId: best?.id ?? null,
          createdAt: Date.now(),
        };
        history.push(snapshot);
        this.hooks?.onGenerationComplete?.(snapshot);

        if (generation === this.settings.generations - 1) {
          break;
        }

        const next = this.produceNextGeneration(currentPopulation, generation, random);
        currentPopulation = next.population;
        mutationEvents = next.mutationEvents;
        crossoverEvents = next.crossoverEvents;
      }

      const totalRuntime = profilingEnabled ? now() - runStart : undefined;

      return {
        bestIndividual,
        finalPopulation: currentPopulation.map((individual) => ({
          ...individual,
          config: cloneGeneticConfig(individual.config),
          genome: ensureGeneIds(individual.genome),
        })),
        history,
        settings: this.settings,
        runtimeMetrics:
          totalRuntime !== undefined
            ? {
                totalRuntimeMs: totalRuntime,
                averageGenerationMs:
                  generationDurations.length > 0
                    ? generationDurations.reduce((sum, value) => sum + value, 0) /
                      generationDurations.length
                    : 0,
                generationDurations,
              }
            : undefined,
      };
    }

    private buildContext(
      generation: number,
      history: GenerationSnapshot[],
      random: () => number,
    ): EvolutionContext {
      return {
        settings: this.settings,
        generation,
        random,
        history,
      };
    }

    private computeMetrics(population: PopulationIndividual[], mutationEvents: number, crossoverEvents: number) {
      const fitnessValues = population
        .map((individual) => individual.fitness)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      const bestFitness = fitnessValues.length > 0 ? Math.max(...fitnessValues) : null;
      const averageFitness =
        fitnessValues.length > 0
          ? fitnessValues.reduce((sum, value) => sum + value, 0) / fitnessValues.length
          : null;
      const medianFitness =
        fitnessValues.length > 0
          ? [...fitnessValues].sort((a, b) => a - b)[Math.floor(fitnessValues.length / 2)]
          : null;

      return {
        bestFitness,
        averageFitness,
        medianFitness,
        mutationCount: mutationEvents,
        crossoverCount: crossoverEvents,
      };
    }

    private pickBestIndividual(population: PopulationIndividual[]): PopulationIndividual | null {
      return population.reduce<PopulationIndividual | null>((best, candidate) => {
        if (candidate.fitness === null) return best;
        if (!best || (best.fitness ?? -Infinity) < candidate.fitness) {
          return candidate;
        }
        return best;
      }, null);
    }

    private produceNextGeneration(
      population: PopulationIndividual[],
      generation: number,
      random: () => number,
    ): { population: PopulationIndividual[]; mutationEvents: number; crossoverEvents: number } {
      const sorted = [...population].sort(
        (a, b) => (b.fitness ?? Number.NEGATIVE_INFINITY) - (a.fitness ?? Number.NEGATIVE_INFINITY),
      );
      const nextPopulation: PopulationIndividual[] = [];
      let mutationEvents = 0;
      let crossoverEvents = 0;

      const elitism = Math.min(this.settings.elitismCount, sorted.length);
      for (let index = 0; index < elitism; index += 1) {
        const elite = sorted[index];
        nextPopulation.push({
          ...elite,
          id: createIndividualId('elite'),
          parentIds: [elite.id],
          generationIntroduced: generation + 1,
          config: cloneGeneticConfig(elite.config),
          genome: ensureGeneIds(elite.genome),
          fitness: null,
        });
      }

      while (nextPopulation.length < this.settings.populationSize) {
        const parents = this.selectParents(sorted, random);
        const crossoverRate = Math.min(Math.max(this.settings.crossoverRate ?? 1, 0), 1);
        const canCrossover = crossoverRate > 0;
        const shouldCrossover = canCrossover && random() < crossoverRate;
        const offspringGenomes = shouldCrossover
          ? this.crossoverGenomes(parents, random)
          : parents.map((parent) => ensureGeneIds(parent.genome));
        if (shouldCrossover) {
          crossoverEvents += 1;
        }
        offspringGenomes.forEach((genome) => {
          if (nextPopulation.length >= this.settings.populationSize) return;
          const { genome: mutatedGenome, mutated } = this.applyMutation(genome, random);
          if (mutated) {
            mutationEvents += 1;
          }
          const seedParent = parents[random() < 0.5 ? 0 : 1];
          const config = {
            ...cloneGeneticConfig(seedParent.config),
            genome: mutatedGenome,
          };
          const id = createIndividualId('child');
          const child: PopulationIndividual = {
            id,
            strategyName: `${config.name} #${id}`,
            config,
            genome: mutatedGenome,
            fitness: null,
            parentIds: parents.map((parent) => parent.id),
            generationIntroduced: generation + 1,
          };
          nextPopulation.push(child);
          if (mutated) {
            this.hooks?.onMutationApplied?.(child);
          }
        });
      }

      return { population: nextPopulation, mutationEvents, crossoverEvents };
    }

    private selectParents(
      population: PopulationIndividual[],
      random: () => number,
    ): [PopulationIndividual, PopulationIndividual] {
      switch (this.settings.selectionMethod) {
        case 'roulette-wheel':
          return [this.rouletteWheelSelection(population, random), this.rouletteWheelSelection(population, random)];
        case 'tournament':
          return [
            this.tournamentSelection(population, random),
            this.tournamentSelection(population, random),
          ];
        case 'rank':
        case 'elitist':
        default:
          return [population[0], population[1] ?? population[0]];
      }
    }

    private rouletteWheelSelection(
      population: PopulationIndividual[],
      random: () => number,
    ): PopulationIndividual {
      const fitnessValues = population.map((individual) => individual.fitness ?? 0);
      const minFitness = Math.min(...fitnessValues);
      const adjusted = fitnessValues.map((value) => value - minFitness + 1);
      const total = adjusted.reduce((sum, value) => sum + value, 0);
      let threshold = random() * total;
      for (let index = 0; index < population.length; index += 1) {
        threshold -= adjusted[index];
        if (threshold <= 0) {
          return population[index];
        }
      }
      return population[population.length - 1];
    }

    private tournamentSelection(
      population: PopulationIndividual[],
      random: () => number,
    ): PopulationIndividual {
      const populationSize = population.length;
      if (populationSize === 0) {
        throw new Error('Cannot perform tournament selection on an empty population.');
      }
      const requestedSize = Math.max(this.settings.tournamentSize ?? 3, 2);
      const size = Math.min(populationSize, requestedSize);
      const competitors = new Set<PopulationIndividual>();
      while (competitors.size < size) {
        const candidate = population[Math.floor(random() * population.length)];
        competitors.add(candidate);
      }
      return Array.from(competitors).reduce<PopulationIndividual | null>((best, candidate) => {
        if (!best || (candidate.fitness ?? -Infinity) > (best.fitness ?? -Infinity)) {
          return candidate;
        }
        return best;
      }, null)!;
    }

    private crossoverGenomes(parents: PopulationIndividual[], random: () => number): Genome[] {
      const [parentA, parentB] = parents;
      switch (this.settings.crossoverOperator) {
        case 'two-point': {
          const [childAGenome, childBGenome] = twoPointCrossover(parentA.genome, parentB.genome, { random });
          this.hooks?.onCrossoverApplied?.(parents, [
            { ...parentA, genome: childAGenome },
            { ...parentB, genome: childBGenome },
          ]);
          return [childAGenome, childBGenome];
        }
        case 'uniform': {
          const [childAGenome, childBGenome] = uniformCrossover(parentA.genome, parentB.genome, { random });
          this.hooks?.onCrossoverApplied?.(parents, [
            { ...parentA, genome: childAGenome },
            { ...parentB, genome: childBGenome },
          ]);
          return [childAGenome, childBGenome];
        }
        case 'single-point':
        default: {
          const [childAGenome, childBGenome] = singlePointCrossover(parentA.genome, parentB.genome, { random });
          this.hooks?.onCrossoverApplied?.(parents, [
            { ...parentA, genome: childAGenome },
            { ...parentB, genome: childBGenome },
          ]);
          return [childAGenome, childBGenome];
        }
      }
    }

    private applyMutation(
      genome: Genome,
      random: () => number,
    ): { genome: Genome; mutated: boolean } {
      const normalized = ensureGeneIds(genome);
      if (this.settings.mutationRate <= 0) {
        return { genome: normalized, mutated: false };
      }
      const mutationRate = Math.min(Math.max(this.settings.mutationRate ?? 0, 0), 1);
      let mutatedGenome: Genome;
      switch (this.settings.mutationOperator) {
        case 'swap':
        mutatedGenome = swapMutation(normalized, { mutationRate, random });
        break;
      case 'gaussian':
        mutatedGenome = gaussianMutation(normalized, { mutationRate, random });
        break;
      case 'bit-flip':
      default:
        mutatedGenome = bitFlipMutation(normalized, { mutationRate, random });
        break;
      }
      const mutated = !this.genomesAreEqual(normalized, mutatedGenome);
      return { genome: mutatedGenome, mutated };
    }

    private genomesAreEqual(left: Genome, right: Genome): boolean {
      if (left.length !== right.length) {
        return false;
      }
      for (let index = 0; index < left.length; index += 1) {
        const leftGene = left[index];
        const rightGene = right[index];
        if (!rightGene) {
          return false;
        }
        if (leftGene.id !== rightGene.id) {
          return false;
        }
        if (leftGene.response !== rightGene.response) {
          return false;
        }
        const leftWeight = leftGene.weight ?? null;
        const rightWeight = rightGene.weight ?? null;
        if (leftWeight !== rightWeight) {
          return false;
        }
        if (!this.conditionsAreEqual(leftGene.condition, rightGene.condition)) {
          return false;
        }
      }
      return true;
    }

    private conditionsAreEqual(
      left: Genome[number]['condition'],
      right: Genome[number]['condition'],
    ): boolean {
      if (left.opponentLastMove !== right.opponentLastMove) {
        return false;
      }
      if (left.selfLastMove !== right.selfLastMove) {
        return false;
      }
      const leftRange = left.roundRange ?? null;
      const rightRange = right.roundRange ?? null;
      if (leftRange === null || rightRange === null) {
        return leftRange === rightRange;
      }
      return leftRange[0] === rightRange[0] && leftRange[1] === rightRange[1];
    }
  }

  return new BasicEvolutionEngine();
}


