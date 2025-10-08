import type { GeneticStrategyConfig } from './genome';
import { introductoryGenetic, introductoryGeneticConfig } from './introductoryGenetic';

export * from './genome';
export * from './operators';
export { createGeneticStrategy } from './createGeneticStrategy';
export { introductoryGenetic, introductoryGeneticConfig };

export const geneticStrategyConfigs: Record<string, GeneticStrategyConfig> = {
  [introductoryGeneticConfig.name]: introductoryGeneticConfig,
};
