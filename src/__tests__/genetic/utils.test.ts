import { describe, expect, it } from 'vitest';

import type { GeneticStrategyConfig } from '@/strategies/genetic';
import {
  cloneGeneticConfig,
  cloneGeneticConfigMap,
  createGeneId,
  createGeneTemplate,
  ensureGeneIds,
  canonicalizeConfig,
  canonicalizeConfigMap,
  createGeneTemplate,
} from '@/strategies/genetic/utils';

describe('createGeneId', () => {
  it('generates unique-ish identifiers', () => {
    const first = createGeneId();
    const second = createGeneId();
    expect(first).not.toEqual(second);
    expect(first).toMatch(/^gene-/);
    expect(second).toMatch(/^gene-/);
  });
});

describe('createGeneTemplate', () => {
  it('provides defaults and merges overrides', () => {
    const gene = createGeneTemplate({
      condition: { opponentLastMove: 'DEFECT', roundRange: [1, 3] },
      response: 'DEFECT',
      weight: 1.25,
    });

    expect(gene.id).toBeTruthy();
    expect(gene.condition.opponentLastMove).toBe('DEFECT');
    expect(gene.condition.roundRange).toEqual([1, 3]);
    expect(gene.response).toBe('DEFECT');
    expect(gene.weight).toBe(1.25);
  });
});

describe('ensureGeneIds', () => {
  it('adds ids to genes that are missing them', () => {
    const genome = ensureGeneIds([
      { id: 'existing', condition: {}, response: 'COOPERATE' },
      { condition: { selfLastMove: 'DEFECT' }, response: 'DEFECT' },
    ]);

    expect(genome).toHaveLength(2);
    expect(genome[0].id).toBe('existing');
    expect(genome[1].id).toMatch(/^gene-/);
    expect(genome[1].condition.selfLastMove).toBe('DEFECT');
  });
});

describe('cloneGeneticConfig', () => {
  const baseConfig: GeneticStrategyConfig = {
    name: 'Test Config',
    description: 'Example configuration to verify cloning.',
    genome: [
      { id: 'g-1', condition: {}, response: 'COOPERATE' },
      {
        id: 'g-2',
        condition: { opponentLastMove: 'DEFECT', roundRange: [2, 4] },
        response: 'DEFECT',
        weight: 1.2,
      },
    ],
  };

  it('clones configs without mutating the original', () => {
    const cloned = cloneGeneticConfig(baseConfig);

    expect(cloned).not.toBe(baseConfig);
    expect(cloned.genome).not.toBe(baseConfig.genome);
    expect(cloned.genome[0]).not.toBe(baseConfig.genome[0]);
    expect(cloned).toEqual(baseConfig);

    cloned.genome[0].response = 'DEFECT';
    expect(baseConfig.genome[0].response).toBe('COOPERATE');
  });

  it('clones config maps shallowly', () => {
    const map = cloneGeneticConfigMap({
      [baseConfig.name]: baseConfig,
    });

    expect(map[baseConfig.name]).toEqual(baseConfig);
    expect(map[baseConfig.name]).not.toBe(baseConfig);
  });
});

describe('canonical helpers', () => {
  const baseConfig: GeneticStrategyConfig = {
    name: 'Canon',
    description: 'Canonical config',
    mutationRate: 0.2,
    crossoverRate: 0.7,
    genome: [
      createGeneTemplate({ id: 'gene-A', response: 'COOPERATE' }),
      createGeneTemplate({
        id: 'gene-B',
        response: 'DEFECT',
        weight: 1.5,
        condition: { opponentLastMove: 'DEFECT', roundRange: [2, 5] },
      }),
    ],
  };

  it('produces deterministic canonical structures', () => {
    const canon = canonicalizeConfig(baseConfig);
    expect(canon).toEqual({
      name: baseConfig.name,
      description: baseConfig.description,
      mutationRate: 0.2,
      crossoverRate: 0.7,
      genome: [
        {
          id: 'gene-A',
          response: 'COOPERATE',
          weight: null,
          condition: {
            opponentLastMove: null,
            selfLastMove: null,
            roundRange: null,
          },
        },
        {
          id: 'gene-B',
          response: 'DEFECT',
          weight: 1.5,
          condition: {
            opponentLastMove: 'DEFECT',
            selfLastMove: null,
            roundRange: [2, 5],
          },
        },
      ],
    });
  });

  it('compares config maps without reference sensitivity', () => {
    const mapA = canonicalizeConfigMap({ canon: baseConfig });
    const mapB = canonicalizeConfigMap({
      canon: {
        ...baseConfig,
        genome: baseConfig.genome.map((gene) => ({ ...gene })),
      },
    });
    expect(mapA).toEqual(mapB);
  });
});
