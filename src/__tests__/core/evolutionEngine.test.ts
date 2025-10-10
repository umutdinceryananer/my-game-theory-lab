import { describe, expect, it } from 'vitest';

import { createBasicEvolutionEngine } from '@/core/evolution';
import type { EvolutionSettings } from '@/core/evolution';
import type { Strategy } from '@/core/types';
import { introductoryGeneticConfig } from '@/strategies/genetic';

const stubOpponent: Strategy = {
  name: 'Stub',
  description: 'Always cooperates',
  play: () => 'COOPERATE',
};

function createSettings(overrides: Partial<EvolutionSettings> = {}): EvolutionSettings {
  return {
    populationSize: 4,
    generations: 2,
    selectionMethod: 'elitist',
    mutationOperator: 'bit-flip',
    crossoverOperator: 'single-point',
    mutationRate: 0,
    crossoverRate: 1,
    elitismCount: 0,
    tournamentSize: 3,
    randomSeed: 42,
    ...overrides,
  };
}

describe('createBasicEvolutionEngine', () => {
  it('clamps tournament selection size to the population size', async () => {
    const settings = createSettings({
      populationSize: 1,
      generations: 1,
      selectionMethod: 'tournament',
      tournamentSize: 6,
      crossoverRate: 0,
      mutationRate: 0,
    });

    const engine = createBasicEvolutionEngine({
      settings,
      seedPool: [introductoryGeneticConfig],
      opponents: [stubOpponent],
    });

    const summary = await engine.run({
      evaluateFitness: () => 1,
    });

    expect(summary.finalPopulation).toHaveLength(1);
    expect(summary.history).toHaveLength(1);
  });

  it('skips crossover when crossoverRate is zero', async () => {
    const settings = createSettings({
      crossoverRate: 0,
      generations: 2,
    });

    const engine = createBasicEvolutionEngine({
      settings,
      seedPool: [introductoryGeneticConfig],
      opponents: [stubOpponent],
    });

    const summary = await engine.run({
      evaluateFitness: () => 5,
    });

    summary.history.forEach((snapshot) => {
      expect(snapshot.metrics.crossoverCount).toBe(0);
    });
  });

  it('emits crossover events for alternate operators when enabled', async () => {
    let crossoverEvents = 0;
    const settings = createSettings({
      crossoverOperator: 'uniform',
      crossoverRate: 1,
    });

    const engine = createBasicEvolutionEngine({
      settings,
      seedPool: [introductoryGeneticConfig],
      opponents: [stubOpponent],
      hooks: {
        onCrossoverApplied: () => {
          crossoverEvents += 1;
        },
      },
    });

    await engine.run({
      evaluateFitness: (_, context) => context.generation,
    });

    expect(crossoverEvents).toBeGreaterThan(0);
  });

  it('applies swap mutation when configured', async () => {
    let mutationEvents = 0;
    const settings = createSettings({
      mutationOperator: 'swap',
      mutationRate: 1,
    });

    const engine = createBasicEvolutionEngine({
      settings,
      seedPool: [introductoryGeneticConfig],
      opponents: [stubOpponent],
      hooks: {
        onMutationApplied: () => {
          mutationEvents += 1;
        },
      },
    });

    await engine.run({
      evaluateFitness: () => 1,
    });

    expect(mutationEvents).toBeGreaterThan(0);
  });

  it('applies bit-flip mutation when configured', async () => {
    let mutationEvents = 0;
    const settings = createSettings({
      mutationOperator: 'bit-flip',
      mutationRate: 1,
    });

    const engine = createBasicEvolutionEngine({
      settings,
      seedPool: [introductoryGeneticConfig],
      opponents: [stubOpponent],
      hooks: {
        onMutationApplied: () => {
          mutationEvents += 1;
        },
      },
    });

    await engine.run({
      evaluateFitness: () => 1,
    });

    expect(mutationEvents).toBeGreaterThan(0);
  });

  it('applies gaussian mutation when configured', async () => {
    let mutationEvents = 0;
    const settings = createSettings({
      mutationOperator: 'gaussian',
      mutationRate: 1,
    });

    const engine = createBasicEvolutionEngine({
      settings,
      seedPool: [introductoryGeneticConfig],
      opponents: [stubOpponent],
      hooks: {
        onMutationApplied: () => {
          mutationEvents += 1;
        },
      },
    });

    await engine.run({
      evaluateFitness: () => 1,
    });

    expect(mutationEvents).toBeGreaterThan(0);
  });
});
