import type { Gene, GeneId, GeneticStrategyConfig, Genome } from './genome';

let geneIdCounter = 0;

export function createGeneId(prefix = 'gene'): GeneId {
  geneIdCounter += 1;
  const counter = geneIdCounter.toString(36);
  const randomSegment = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${counter}-${randomSegment}`;
}

export function cloneGene(gene: Gene): Gene {
  return {
    id: gene.id,
    condition: {
      opponentLastMove: gene.condition.opponentLastMove,
      selfLastMove: gene.condition.selfLastMove,
      roundRange: gene.condition.roundRange
        ? [gene.condition.roundRange[0], gene.condition.roundRange[1]]
        : undefined,
    },
    response: gene.response,
    ...(gene.weight !== undefined ? { weight: gene.weight } : {}),
  };
}

export function ensureGeneIds(
  genome: Genome,
  generator: () => GeneId = createGeneId,
): Genome {
  return genome.map((gene) => {
    if (gene.id) {
      return cloneGene(gene);
    }
    return cloneGene({
      ...gene,
      id: generator(),
    });
  });
}

export function cloneGeneticConfig(config: GeneticStrategyConfig): GeneticStrategyConfig {
  return {
    ...config,
    genome: ensureGeneIds(config.genome),
  };
}

export function cloneGeneticConfigMap(
  configs: Record<string, GeneticStrategyConfig>,
): Record<string, GeneticStrategyConfig> {
  return Object.entries(configs).reduce<Record<string, GeneticStrategyConfig>>(
    (accumulator, [name, config]) => {
      accumulator[name] = cloneGeneticConfig(config);
      return accumulator;
    },
    {},
  );
}

export function createGeneTemplate(
  overrides: Partial<Gene> = {},
  generator: () => GeneId = createGeneId,
): Gene {
  const baseCondition = overrides.condition ?? {};
  const gene: Gene = {
    id: overrides.id ?? generator(),
    condition: {
      opponentLastMove: baseCondition.opponentLastMove,
      selfLastMove: baseCondition.selfLastMove,
      roundRange: baseCondition.roundRange
        ? [baseCondition.roundRange[0], baseCondition.roundRange[1]]
        : undefined,
    },
    response: overrides.response ?? 'COOPERATE',
  };

  if (overrides.weight !== undefined) {
    gene.weight = overrides.weight;
  }

  return cloneGene(gene);
}
