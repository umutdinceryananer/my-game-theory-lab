import type { ReactNode } from "react";

export type TooltipIdentifier = keyof typeof tooltipRegistry;

export interface TooltipEntry {
  title?: string;
  description: ReactNode;
  /**
   * Optional override for tooltip placement, e.g. "top", "right"
   */
  side?: "top" | "right" | "bottom" | "left";
  /**
   * Optional alignment override for the tooltip content.
   */
  align?: "start" | "center" | "end";
}

export const tooltipRegistry = {
  "simulation.rounds": {
    title: "Rounds per match",
    description:
      "Controls how many turns each strategy pair plays. Higher values favor long-term cooperation.",
  },
  "simulation.noise": {
    title: "Noise",
    description:
      "Probability (0-100%) that a move flips. Useful to model miscommunication between strategies.",
  },
  "tournament.format": {
    title: "Tournament format",
    description:
      "Choose between round-robin or Swiss style. Swiss pairing adds tie-breakers and per-round snapshots.",
  },
  "tournament.single-round-robin": {
    title: "Single round-robin",
    description: "Every strategy plays each other exactly once. Fast overview with minimal matches.",
  },
  "tournament.double-round-robin": {
    title: "Double round-robin",
    description:
      "Each pairing is played twice, swapping positions. Useful when noise or asymmetric strategies are in play.",
  },
  "tournament.swiss": {
    title: "Swiss pairing",
    description:
      "Strategies are matched against opponents with similar scores across limited rounds. Configure rounds and tie-breakers below.",
  },
  "tournament.tie-breaker.total-score": {
    title: "Total score",
    description: "Sorts by aggregate points earned. Fast but ignores opponent strength.",
  },
  "tournament.tie-breaker.buchholz": {
    title: "Buchholz",
    description: "Adds the scores of opponents you faced. Rewards beating stronger competition.",
  },
  "tournament.tie-breaker.sonneborn": {
    title: "Sonneborn-Berger",
    description: "Weights wins against high-scorers more heavily by summing opponent scores scaled by results.",
  },
  "evolution.population-size": {
    title: "Population size",
    description: "Number of individuals per generation. Larger populations explore more strategies but increase runtime.",
  },
  "evolution.generations": {
    title: "Generations",
    description: "How many evolutionary iterations to run. More generations give the population time to improve.",
  },
  "evolution.mutation-rate": {
    title: "Mutation rate",
    description: "Probability (0-1) that each gene mutates. Higher values boost exploration but can destabilize good solutions.",
  },
  "evolution.crossover-rate": {
    title: "Crossover rate",
    description: "Chance (0-1) to recombine parents into offspring. Lower values favor mutation-only search.",
  },
  "evolution.selection-method": {
    title: "Selection method",
    description: "Strategy for picking parents. Tournament focuses on top performers, roulette/rank bias towards probability, elitist keeps the best unchanged.",
  },
  "evolution.elitism-count": {
    title: "Elitism count",
    description: "How many top individuals carry over unchanged each generation. Prevents regressions but reduce diversity.",
  },
  "evolution.mutation-operator": {
    title: "Mutation operator",
    description: "Defines how genes change during mutation: flip bits, perturb weights, or swap genes.",
  },
  "evolution.profiling": {
    title: "Performance profiling",
    description: "Collect timing metrics for each generation. Helpful for debugging slow runs; minimal overhead.",
  },
  "evolution.tournament-size": {
    title: "Tournament size",
    description: "Number of contenders sampled when using tournament selection. Must be ≤ population size.",
  },
  "evolution.random-seed": {
    title: "Random seed",
    description: "Optional seed for deterministic evolutionary runs. Leave blank for varied outcomes each run.",
  },
  "genetic.mutation-rate": {
    title: "Mutation rate",
    description:
      "Probability (0-1) that a gene mutates when breeding. Higher values explore more but risk losing good traits.",
  },
  "genetic.crossover-rate": {
    title: "Crossover rate",
    description:
      "Likelihood (0-1) of combining two parents when generating offspring. Lower values rely more on mutation.",
  },
  "genetic.response": {
    title: "Response",
    description:
      "Action this gene produces when its conditions are met. Typically COOPERATE or DEFECT.",
  },
  "genetic.weight": {
    title: "Weight",
    description:
      "Relative priority of this gene when multiple genes match. Higher weight wins ties.",
  },
  "genetic.opponent-last-move": {
    title: "Opponent last move",
    description:
      "Optional condition: restrict this gene to trigger only after the opponent played a specific move.",
  },
  "genetic.self-last-move": {
    title: "Self last move",
    description:
      "Optional condition: trigger the gene only if you played a specific move in the previous round.",
  },
  "genetic.round-start": {
    title: "Round start",
    description:
      "First round (inclusive) where this gene is active. Leave blank for any starting round.",
  },
  "genetic.round-end": {
    title: "Round end",
    description:
      "Last round (inclusive) where this gene applies. Leave blank to keep it active until the match ends.",
  },
} as const satisfies Record<string, TooltipEntry>;

export function getTooltipEntry(id: TooltipIdentifier): TooltipEntry {
  return tooltipRegistry[id];
}
