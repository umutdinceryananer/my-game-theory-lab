import { describe, expect, it } from "vitest";

import { Tournament } from "@/core/tournament";
import type { Strategy, PayoffMatrix } from "@/core/types";

const createStrategy = (name: string, move: "COOPERATE" | "DEFECT"): Strategy => ({
  name,
  description: `${name} strategy`,
  play: () => move,
});

const payoffMatrix: PayoffMatrix = {
  temptation: 5,
  reward: 3,
  punishment: 1,
  sucker: 0,
};

describe("Tournament round-robin scoring", () => {
  const cooperator = createStrategy("Cooperator", "COOPERATE");
  const defector = createStrategy("Defector", "DEFECT");

  it("ranks strategies by total score in single round-robin", () => {
    const tournament = new Tournament();
    const outcome = tournament.runWithFormat(
      { kind: "single-round-robin" },
      [cooperator, defector],
      1,
      0,
      payoffMatrix,
      123,
    );

    expect(outcome.results).toHaveLength(2);
    const [first, second] = outcome.results;
    expect(first.name).toBe("Defector");
    expect(first.totalScore).toBe(payoffMatrix.temptation);
    expect(first.matchesPlayed).toBe(1);
    expect(second.name).toBe("Cooperator");
    expect(second.totalScore).toBe(payoffMatrix.sucker);
  });

  it("plays both directions in double round-robin", () => {
    const tournament = new Tournament();
    const outcome = tournament.runWithFormat(
      { kind: "double-round-robin" },
      [cooperator, defector],
      1,
      0,
      payoffMatrix,
      321,
    );

    const defectorResult = outcome.results.find((result) => result.name === "Defector");
    const coopResult = outcome.results.find((result) => result.name === "Cooperator");

    expect(defectorResult?.totalScore).toBe(payoffMatrix.temptation * 2);
    expect(coopResult?.totalScore).toBe(payoffMatrix.sucker * 2);
    expect(defectorResult?.matchesPlayed).toBe(2);
    expect(coopResult?.matchesPlayed).toBe(2);
  });
});

describe("Deterministic seeding", () => {
  it("produces identical outcomes when seeds match", () => {
    const strategies = [
      createStrategy("A", "COOPERATE"),
      createStrategy("B", "DEFECT"),
      createStrategy("C", "COOPERATE"),
    ];
    const tournament = new Tournament();

    const first = tournament.runWithFormat({ kind: "single-round-robin" }, strategies, 5, 0.1, payoffMatrix, "seed-42");
    const second = tournament.runWithFormat({ kind: "single-round-robin" }, strategies, 5, 0.1, payoffMatrix, "seed-42");

    expect(first.results).toStrictEqual(second.results);
  });
});
