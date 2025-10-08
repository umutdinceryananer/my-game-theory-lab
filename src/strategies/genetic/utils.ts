import type { GeneticStrategyConfig } from './genome';

export function cloneGeneticConfig(config: GeneticStrategyConfig): GeneticStrategyConfig {
  return {
    ...config,
    genome: config.genome.map((gene) => ({
      ...gene,
      condition: {
        ...gene.condition,
        roundRange: gene.condition.roundRange
          ? [gene.condition.roundRange[0], gene.condition.roundRange[1]]
          : undefined,
      },
    })),
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
