import { createRandomSource } from './random';
import { Tournament, DEFAULT_TOURNAMENT_FORMAT } from './tournament';
import { DEFAULT_PAYOFF_MATRIX } from './types';
import type { PayoffMatrix, Strategy } from './types';
import type { TournamentFormat } from './tournament';
import { cloneGeneticConfig, ensureGeneIds } from '@/strategies/genetic/utils';
import { createGeneticStrategy } from '@/strategies/genetic';
import { mutateGenome as applyGenomeMutation, singlePointCrossover } from '@/strategies/genetic/operators';
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
            ? applyGenomeMutation(genome, { mutationRate: this.settings.mutationRate / 2, random })
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

      for (let generation = 0; generation < this.settings.generations; generation += 1) {
        const context = this.buildContext(generation, history, random);
        this.hooks?.onGenerationStart?.(context);

        // Evaluate fitness
        for (const individual of currentPopulation) {
          const fitnessValue = await evaluate(individual, context);
          individual.fitness = fitnessValue;
        }

        // Metrics & snapshot
        const metrics = this.computeMetrics(currentPopulation, mutationEvents, crossoverEvents);
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

      return {
        bestIndividual,
        finalPopulation: currentPopulation.map((individual) => ({
          ...individual,
          config: cloneGeneticConfig(individual.config),
          genome: ensureGeneIds(individual.genome),
        })),
        history,
        settings: this.settings,
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
        crossoverCount,
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
        const offspringGenomes = this.crossoverGenomes(parents, random);
        crossoverEvents += 1;
        offspringGenomes.forEach((genome) => {
          if (nextPopulation.length >= this.settings.populationSize) return;
          const mutated = this.applyMutation(genome, random);
          if (mutated !== genome) {
            mutationEvents += 1;
          }
          const seedParent = parents[random() < 0.5 ? 0 : 1];
          const config = {
            ...cloneGeneticConfig(seedParent.config),
            genome: mutated,
          };
          const id = createIndividualId('child');
          const child: PopulationIndividual = {
            id,
            strategyName: `${config.name} #${id}`,
            config,
            genome: mutated,
            fitness: null,
            parentIds: parents.map((parent) => parent.id),
            generationIntroduced: generation + 1,
          };
          nextPopulation.push(child);
          if (mutated !== genome) {
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
      const size = Math.max(this.settings.tournamentSize ?? 3, 2);
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

    private crossoverGenomes(
      parents: PopulationIndividual[],
      random: () => number,
    ): Genome[] {
      const [parentA, parentB] = parents;
      switch (this.settings.crossoverOperator) {
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

    private applyMutation(genome: Genome, random: () => number): Genome {
      if (this.settings.mutationRate <= 0) {
        return ensureGeneIds(genome);
      }
      return applyGenomeMutation(genome, { mutationRate: this.settings.mutationRate, random });
    }
  }

  return new BasicEvolutionEngine();
}
