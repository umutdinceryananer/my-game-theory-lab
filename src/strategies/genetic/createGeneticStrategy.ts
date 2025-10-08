import type { GameHistory, Strategy } from '@/core/types';
import type { Gene, GeneticStrategyConfig, Genome } from './genome';
import { createGeneTemplate, ensureGeneIds } from './utils';

/**
 * Creates a Strategy implementation from a GeneticStrategyConfig. The genome is read-only at
 * runtime; mutation/crossover utilities live in `operators.ts` and can supply new configs.
 */
export function createGeneticStrategy(config: GeneticStrategyConfig): Strategy {
  const normalizedGenome = ensureGenome(config.genome);

  return {
    name: config.name,
    description: config.description,
    play(history, round) {
      const matches = normalizedGenome.filter((gene) => matchesGene(gene, history, round));
      const chosen = selectGene(matches, history);
      return chosen.response;
    },
  };
}

function ensureGenome(genome: Genome): Genome {
  if (genome.length === 0) {
    return [createGeneTemplate()];
  }
  return ensureGeneIds(genome);
}

function matchesGene(gene: Gene, history: GameHistory, round: number): boolean {
  const { condition } = gene;

  if (condition.opponentLastMove !== undefined) {
    const opponentLastMove = round > 0 ? history.opponentMoves[round - 1] : undefined;
    if (opponentLastMove !== condition.opponentLastMove) {
      return false;
    }
  }

  if (condition.selfLastMove !== undefined) {
    const selfLastMove = round > 0 ? history.playerMoves[round - 1] : undefined;
    if (selfLastMove !== condition.selfLastMove) {
      return false;
    }
  }

  if (condition.roundRange) {
    const [startInclusive, endInclusive] = condition.roundRange;
    const humanRound = round + 1;
    if (humanRound < startInclusive || humanRound > endInclusive) {
      return false;
    }
  }

  return true;
}

function selectGene(matches: Genome, history: GameHistory): Gene {
  if (matches.length === 0) {
    // Default to cooperation so new genomes fail gracefully rather than defecting infinitely.
    return { condition: {}, response: 'COOPERATE' };
  }

  if (matches.length === 1) {
    return matches[0];
  }

  const weights = matches.map((gene) => gene.weight ?? 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) {
    return matches[0];
  }

  let threshold = history.random() * totalWeight;
  for (let i = 0; i < matches.length; i++) {
    threshold -= weights[i];
    if (threshold <= 0) {
      return matches[i];
    }
  }

  return matches[matches.length - 1];
}
