import { describe, expect, it } from "vitest";

import { PrisonersDilemmaGame } from "@/core/game";
import type { Strategy, PayoffMatrix } from "@/core/types";

const createStrategy = (name: string, move: "COOPERATE" | "DEFECT"): Strategy => ({
  name,
  description: `${name} strategy`,
  play: () => move,
});

describe("PrisonersDilemmaGame", () => {
  const payoffMatrix: PayoffMatrix = {
    temptation: 7,
    reward: 4,
    punishment: 2,
    sucker: 0,
  };

  it("applies payoff matrix values for cooperative play", () => {
    const game = new PrisonersDilemmaGame();
    const coop = createStrategy("Cooperator", "COOPERATE");
    const result = game.playMatch(coop, coop, 3, 0, payoffMatrix, () => 0.9);

    expect(result.player1Score).toBe(3 * payoffMatrix.reward);
    expect(result.player2Score).toBe(3 * payoffMatrix.reward);
  });

  it("flips moves when noise triggers", () => {
    const game = new PrisonersDilemmaGame();
    const coop = createStrategy("Cooperator", "COOPERATE");
    const defect = createStrategy("Defector", "DEFECT");

    const result = game.playMatch(coop, defect, 1, 1, payoffMatrix, () => 0.0);

    expect(result.player1Score).toBe(payoffMatrix.temptation);
    expect(result.player2Score).toBe(payoffMatrix.sucker);
  });
});

