import { describe, expect, it } from "vitest";

import type { Genome } from "@/strategies/genetic";
import {
  mutateGenome,
  bitFlipMutation,
  gaussianMutation,
  singlePointCrossover,
  twoPointCrossover,
  uniformCrossover,
  swapMutation,
} from "@/strategies/genetic/operators";
import { createSequenceRandom } from "./utils/random";

describe("mutateGenome", () => {
  it("returns a new genome instance", () => {
    const genome: Genome = [
      { id: "g-1", condition: {}, response: "COOPERATE" },
      { id: "g-2", condition: { opponentLastMove: "DEFECT" }, response: "DEFECT" },
    ];

    const mutated = mutateGenome(genome, { mutationRate: 0, random: () => 0 });
    expect(mutated).not.toBe(genome);
    expect(mutated).toEqual(genome);
  });

  it("mutates response when random threshold is met", () => {
    const genome: Genome = [{ id: "g-3", condition: {}, response: "COOPERATE" }];
    const mutated = mutateGenome(genome, {
      mutationRate: 1,
      random: createSequenceRandom([0.1, 0.9, 0.9, 0.9, 0.9]),
    });

    expect(mutated[0].response).toBe("DEFECT");
  });

  it("removes conditions when mutation threshold is met", () => {
    const genome: Genome = [
      {
        id: "g-4",
        condition: { opponentLastMove: "COOPERATE", selfLastMove: "DEFECT", roundRange: [2, 3] },
        response: "COOPERATE",
      },
    ];

    const mutated = mutateGenome(genome, {
      mutationRate: 0.5,
      random: createSequenceRandom([
        0.9,
        0.4,
        0.2,
        0.4,
        0.2,
        0.6,
        0.4,
      ]),
    });

    expect(mutated[0].condition).toEqual({});
  });
});

describe("bitFlipMutation", () => {
  it("flips responses with the configured probability", () => {
    const genome: Genome = [
      { id: "b-1", condition: {}, response: "COOPERATE" },
      { id: "b-2", condition: {}, response: "DEFECT" },
    ];

    const random = createSequenceRandom([0.4, 0.6]);
    const mutated = bitFlipMutation(genome, { mutationRate: 0.5, random });

    expect(mutated[0].response).toBe("DEFECT");
    expect(mutated[1].response).toBe("DEFECT");
  });
});

describe("gaussianMutation", () => {
  it("perturbs weights using gaussian noise", () => {
    const genome: Genome = [
      { id: "g-1", condition: {}, response: "COOPERATE", weight: 1 },
    ];

    const random = createSequenceRandom([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
    const mutated = gaussianMutation(genome, { mutationRate: 1, random });

    expect(mutated[0].weight).not.toBe(1);
  });
});

describe("singlePointCrossover", () => {
  it("swaps tails after a random cut point", () => {
    const left: Genome = [
      { id: "l-1", condition: { selfLastMove: "COOPERATE" }, response: "DEFECT" },
      { id: "l-2", condition: {}, response: "COOPERATE" },
      { id: "l-3", condition: { opponentLastMove: "DEFECT" }, response: "DEFECT" },
    ];

    const right: Genome = [
      { id: "r-1", condition: {}, response: "COOPERATE" },
      { id: "r-2", condition: { opponentLastMove: "COOPERATE" }, response: "COOPERATE" },
      { id: "r-3", condition: { opponentLastMove: "DEFECT" }, response: "COOPERATE" },
    ];

    const [childA, childB] = singlePointCrossover(left, right, {
      random: () => 0.4,
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

  it("handles short genomes without throwing", () => {
    const [childA, childB] = singlePointCrossover(
      [{ id: "a-1", condition: {}, response: "COOPERATE" }],
      [{ id: "b-1", condition: {}, response: "DEFECT" }],
    );

    expect(childA).toHaveLength(1);
    expect(childB).toHaveLength(1);
  });
});

describe("twoPointCrossover", () => {
  it("exchanges middle segments between parents", () => {
    const left: Genome = [
      { id: "l-1", condition: {}, response: "COOPERATE" },
      { id: "l-2", condition: {}, response: "DEFECT" },
      { id: "l-3", condition: {}, response: "COOPERATE" },
      { id: "l-4", condition: {}, response: "DEFECT" },
    ];

    const right: Genome = [
      { id: "r-1", condition: {}, response: "DEFECT" },
      { id: "r-2", condition: {}, response: "COOPERATE" },
      { id: "r-3", condition: {}, response: "DEFECT" },
      { id: "r-4", condition: {}, response: "COOPERATE" },
    ];

    const random = createSequenceRandom([0.2, 0.8]);
    const [childA, childB] = twoPointCrossover(left, right, { random });

    expect(childA).toEqual([
      left[0],
      right[1],
      right[2],
      left[3],
    ]);

    expect(childB).toEqual([
      right[0],
      left[1],
      left[2],
      right[3],
    ]);
  });
});

describe("uniformCrossover", () => {
  it("swaps genes probabilistically across positions", () => {
    const left: Genome = [
      { id: "l-1", condition: {}, response: "COOPERATE" },
      { id: "l-2", condition: {}, response: "DEFECT" },
    ];
    const right: Genome = [
      { id: "r-1", condition: {}, response: "DEFECT" },
      { id: "r-2", condition: {}, response: "COOPERATE" },
    ];

    const random = createSequenceRandom([0.9, 0.1]);
    const [childA, childB] = uniformCrossover(left, right, { random });

    expect(childA[0]).toEqual(right[0]);
    expect(childB[0]).toEqual(left[0]);
    expect(childA[1]).toEqual(left[1]);
    expect(childB[1]).toEqual(right[1]);
  });
});

describe("swapMutation", () => {
  it("swaps two genes when triggered", () => {
    const genome: Genome = [
      { id: "g-1", condition: {}, response: "COOPERATE" },
      { id: "g-2", condition: {}, response: "DEFECT" },
      { id: "g-3", condition: {}, response: "COOPERATE" },
    ];

    const random = createSequenceRandom([0.4, 0.1, 0.7]);
    const mutated = swapMutation(genome, { mutationRate: 0.5, random });

    expect(mutated.map((gene) => gene.id)).toEqual(["g-3", "g-2", "g-1"]);
  });

  it("returns identical genome when swap does not trigger", () => {
    const genome: Genome = [
      { id: "g-1", condition: {}, response: "COOPERATE" },
      { id: "g-2", condition: {}, response: "DEFECT" },
    ];

    const mutated = swapMutation(genome, { mutationRate: 0.1, random: () => 0.9 });
    expect(mutated).toEqual(genome);
  });
});
