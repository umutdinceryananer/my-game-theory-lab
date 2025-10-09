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

export function twoPointCrossover(
  left: Genome,
  right: Genome,
  options: CrossoverOptions = {},
): [Genome, Genome] {
  const random = options.random ?? Math.random;

  if (left.length === 0 || right.length === 0) {
    return [cloneGenome(right), cloneGenome(left)];
  }

  const minLength = Math.min(left.length, right.length);
  if (minLength < 2) {
    return singlePointCrossover(left, right, options);
  }

  const cutA = Math.floor(random() * (minLength - 1)) + 1;
  let cutB = Math.floor(random() * (minLength - 1)) + 1;
  if (cutA === cutB) {
    cutB = cutA === 1 ? 2 : cutA - 1;
  }
  const start = Math.min(cutA, cutB);
  const end = Math.max(cutA, cutB);

  const leftSegment = left.slice(start, end);
  const rightSegment = right.slice(start, end);

  const childA = cloneGenome([
    ...left.slice(0, start),
    ...rightSegment,
    ...left.slice(end),
  ]);
  const childB = cloneGenome([
    ...right.slice(0, start),
    ...leftSegment,
    ...right.slice(end),
  ]);

  return [childA, childB];
}

export function uniformCrossover(
  left: Genome,
  right: Genome,
  options: CrossoverOptions = {},
): [Genome, Genome] {
  const random = options.random ?? Math.random;

  if (left.length === 0 || right.length === 0) {
    return [cloneGenome(right), cloneGenome(left)];
  }

  const childA = cloneGenome(left);
  const childB = cloneGenome(right);
  const maxCommon = Math.min(childA.length, childB.length);

  for (let index = 0; index < maxCommon; index += 1) {
    if (random() < 0.5) continue;
    const original = childA[index];
    childA[index] = cloneGene(childB[index]);
    childB[index] = cloneGene(original);
  }

  return [childA, childB];
}

export function swapMutation(genome: Genome, options: MutationOptions = {}): Genome {
  const mutationRate = options.mutationRate ?? 0.05;
  const random = options.random ?? Math.random;
  const clone = cloneGenome(genome);

  if (clone.length < 2) {
    return clone;
  }

  if (random() >= mutationRate) {
    return clone;
  }

  const indexA = Math.floor(random() * clone.length);
  let indexB = Math.floor(random() * clone.length);
  while (indexB === indexA && clone.length > 1) {
    indexB = Math.floor(random() * clone.length);
  }

  const temp = clone[indexA];
  clone[indexA] = clone[indexB];
  clone[indexB] = temp;

  return cloneGenome(clone);
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
  return genome.map(cloneGene);
}

function cloneGene(gene: Gene): Gene {
  return {
    id: gene.id,
    condition: {
      ...gene.condition,
      roundRange: gene.condition.roundRange
        ? [gene.condition.roundRange[0], gene.condition.roundRange[1]]
        : undefined,
    },
    response: gene.response,
    weight: gene.weight,
  };
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
