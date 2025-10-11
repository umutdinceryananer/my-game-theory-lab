import { describe, expect, it } from "vitest";

import { processEloMatches, updateEloRating } from "@/lib/rating/elo";

describe("updateEloRating", () => {
  it("returns baseline rating when no outcome", () => {
    const next = updateEloRating(undefined, undefined, "draw");
    expect(next).toBe(1500);
  });

  it("increases rating after a win", () => {
    const next = updateEloRating(1500, 1500, "win", { kFactor: 32 });
    expect(next).toBeGreaterThan(1500);
  });

  it("decreases rating after a loss", () => {
    const next = updateEloRating(1600, 1500, "loss", { kFactor: 32 });
    expect(next).toBeLessThan(1600);
  });
});

describe("processEloMatches", () => {
  it("applies sequential updates across matches", () => {
    const matches = [
      { player: "A", opponent: "B", outcome: "win" as const },
      { player: "A", opponent: "C", outcome: "draw" as const },
      { player: "B", opponent: "C", outcome: "loss" as const },
    ];

    const ratings = processEloMatches({}, matches, { kFactor: 16 });

    expect(ratings.A).toBeDefined();
    expect(ratings.B).toBeDefined();
    expect(ratings.C).toBeDefined();
    expect(ratings.A).toBeGreaterThan(ratings.B);
    expect(ratings.C).toBeGreaterThan(ratings.B);
  });

  it("respects initial rating baseline", () => {
    const matches = [{ player: "A", opponent: "B", outcome: "win" as const }];
    const ratings = processEloMatches({ A: 2000, B: 1500 }, matches, { kFactor: 32 });

    expect(ratings.A).toBeGreaterThan(2000);
    expect(ratings.B).toBeLessThan(1500);
  });
});


