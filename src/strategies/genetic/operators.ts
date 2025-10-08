import type { Move } from '@/core/types';
import type { Gene, Genome } from './genome';

const MOVES: Move[] = ['COOPERATE', 'DEFECT'];

export interface MutationOptions {
  mutationRate?: number;
  random?: () => number;
}

export interface CrossoverOptions {
  random?: () => number;
}

export function mutateGenome(genome: Genome, options: MutationOptions = {}): Genome {
  const mutationRate = options.mutationRate ?? 0.05;
  const random = options.random ?? Math.random;

  return genome.map((gene) => mutateGene(gene, mutationRate, random));
}

export function singlePointCrossover(
  left: Genome,
  right: Genome,
  options: CrossoverOptions = {},
): [Genome, Genome] {
  const random = options.random ?? Math.random;

  if (left.length === 0 || right.length === 0) {
    return [cloneGenome(right), cloneGenome(left)];
  }

  const maxCut = Math.min(left.length, right.length) - 1;
  const cutIndex = Math.max(1, Math.floor(random() * (maxCut + 1)));

  const leftHead = left.slice(0, cutIndex);
  const leftTail = left.slice(cutIndex);
  const rightHead = right.slice(0, cutIndex);
  const rightTail = right.slice(cutIndex);

  return [
    cloneGenome([...leftHead, ...rightTail]),
    cloneGenome([...rightHead, ...leftTail]),
  ];
}

function mutateGene(gene: Gene, mutationRate: number, random: () => number): Gene {
  const result: Gene = {
    id: gene.id,
    condition: { ...gene.condition },
    response: gene.response,
    weight: gene.weight,
  };

  if (gene.condition.roundRange) {
    result.condition.roundRange = [
      gene.condition.roundRange[0],
      gene.condition.roundRange[1],
    ];
  }

  if (random() < mutationRate) {
    result.response = pickDifferentMove(result.response, random);
  }

  if (random() < mutationRate) {
    result.condition.opponentLastMove = mutateMoveCondition(result.condition.opponentLastMove, random);
  }

  if (random() < mutationRate) {
    result.condition.selfLastMove = mutateMoveCondition(result.condition.selfLastMove, random);
  }

  if (random() < mutationRate && result.condition.roundRange) {
    const [start, end] = result.condition.roundRange;
    const shift = random() < 0.5 ? -1 : 1;
    result.condition.roundRange = [Math.max(1, start + shift), Math.max(start + shift, end + shift)];
  } else if (random() < mutationRate) {
    result.condition.roundRange = undefined;
  }

  if (result.weight !== undefined && random() < mutationRate) {
    const delta = random() < 0.5 ? -0.25 : 0.25;
    result.weight = Math.max(0.1, roundTo(result.weight + delta, 2));
  }

  return result;
}

function mutateMoveCondition(current: Move | undefined, random: () => number): Move | undefined {
  if (current === undefined) {
    return random() < 0.5 ? undefined : MOVES[Math.floor(random() * MOVES.length)];
  }

  if (random() < 0.33) {
    return undefined;
  }

  return pickDifferentMove(current, random);
}

function pickDifferentMove(current: Move, random: () => number): Move {
  if (MOVES.length < 2) {
    return current;
  }

  let candidate = current;
  while (candidate === current) {
    candidate = MOVES[Math.floor(random() * MOVES.length)];
  }
  return candidate;
}

function cloneGenome(genome: Genome): Genome {
  return genome.map((gene) => ({
    id: gene.id,
    condition: {
      ...gene.condition,
      roundRange: gene.condition.roundRange
        ? [gene.condition.roundRange[0], gene.condition.roundRange[1]]
        : undefined,
    },
    response: gene.response,
    weight: gene.weight,
  }));
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
