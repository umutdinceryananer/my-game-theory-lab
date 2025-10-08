import type { GeneticStrategyConfig } from './genome';
import { createGeneticStrategy } from './createGeneticStrategy';

const introductoryGenome: GeneticStrategyConfig = {
  name: 'Genetic Adaptive Starter',
  description: 'Begins cooperatively, punishes brief defections, and resets after mutual cooperation.',
  mutationRate: 0.08,
  crossoverRate: 0.6,
  genome: [
    {
      condition: {
        roundRange: [1, 1],
      },
      response: 'COOPERATE',
    },
    {
      condition: {
        opponentLastMove: 'DEFECT',
        selfLastMove: 'COOPERATE',
      },
      response: 'DEFECT',
      weight: 1.5,
    },
    {
      condition: {
        opponentLastMove: 'DEFECT',
        selfLastMove: 'DEFECT',
      },
      response: 'DEFECT',
      weight: 0.75,
    },
    {
      condition: {
        opponentLastMove: 'COOPERATE',
        selfLastMove: 'DEFECT',
      },
      response: 'COOPERATE',
    },
    {
      condition: {},
      response: 'COOPERATE',
    },
  ],
};

export const introductoryGenetic = createGeneticStrategy(introductoryGenome);
export const introductoryGeneticConfig = introductoryGenome;
