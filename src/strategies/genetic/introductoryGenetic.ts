import type { GeneticStrategyConfig } from './genome';
import { createGeneticStrategy } from './createGeneticStrategy';

const INTRODUCTORY_GENETIC_CONFIG: GeneticStrategyConfig = {
  name: 'Genetic Adaptive Starter',
  description:
    'Genome opens with cooperation, punishes single-step defections, sustains retaliation if abuse continues, and returns to cooperation once trust is rebuilt.',
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

export const introductoryGenetic = createGeneticStrategy(INTRODUCTORY_GENETIC_CONFIG);
export const introductoryGeneticConfig = INTRODUCTORY_GENETIC_CONFIG;
