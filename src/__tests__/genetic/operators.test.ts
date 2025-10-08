import { describe, expect, it } from 'vitest';

import type { Genome } from '@/strategies/genetic';
import { mutateGenome, singlePointCrossover } from '@/strategies/genetic/operators';
import { createSequenceRandom } from './utils/random';

describe('mutateGenome', () => {
  it('returns a new genome instance', () => {
    const genome: Genome = [
      { condition: {}, response: 'COOPERATE' },
      { condition: { opponentLastMove: 'DEFECT' }, response: 'DEFECT' },
    ];

    const mutated = mutateGenome(genome, { mutationRate: 0, random: () => 0 });
    expect(mutated).not.toBe(genome);
    expect(mutated).toEqual(genome);
  });

  it('mutates response when random threshold is met', () => {
    const genome: Genome = [{ condition: {}, response: 'COOPERATE' }];
    const mutated = mutateGenome(genome, {
      mutationRate: 1,
      random: createSequenceRandom([0.1, 0.9, 0.9, 0.9, 0.9]),
    });

    expect(mutated[0].response).toBe('DEFECT');
  });

  it('removes conditions when mutation threshold is met', () => {
    const genome: Genome = [
      {
        condition: { opponentLastMove: 'COOPERATE', selfLastMove: 'DEFECT', roundRange: [2, 3] },
        response: 'COOPERATE',
      },
    ];

    const mutated = mutateGenome(genome, {
      mutationRate: 0.5,
      random: createSequenceRandom([
        0.9, // skip response flip
        0.4, // mutate opponent condition
        0.2, // drop opponent condition
        0.4, // mutate self condition
        0.2, // drop self condition
        0.6, // skip first roundRange branch
        0.4, // remove roundRange in else-if
      ]),
    });

    expect(mutated[0].condition).toEqual({});
  });
});

describe('singlePointCrossover', () => {
  it('swaps tails after a random cut point', () => {
    const left: Genome = [
      { condition: { selfLastMove: 'COOPERATE' }, response: 'DEFECT' },
      { condition: {}, response: 'COOPERATE' },
      { condition: { opponentLastMove: 'DEFECT' }, response: 'DEFECT' },
    ];

    const right: Genome = [
      { condition: {}, response: 'COOPERATE' },
      { condition: { opponentLastMove: 'COOPERATE' }, response: 'COOPERATE' },
      { condition: { opponentLastMove: 'DEFECT' }, response: 'COOPERATE' },
    ];

    const [childA, childB] = singlePointCrossover(left, right, {
      random: () => 0.4, // cut at index 1 (floor(0.4 * (maxCut+1)))
    });

    expect(childA).toEqual([
      left[0],
      right[1],
      right[2],
    ]);

    expect(childB).toEqual([
      right[0],
      left[1],
      left[2],
    ]);
  });

  it('handles short genomes without throwing', () => {
    const [childA, childB] = singlePointCrossover(
      [{ condition: {}, response: 'COOPERATE' }],
      [{ condition: {}, response: 'DEFECT' }],
    );

    expect(childA).toHaveLength(1);
    expect(childB).toHaveLength(1);
  });
});
