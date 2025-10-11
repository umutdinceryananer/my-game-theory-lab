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
} as const satisfies Record<string, TooltipEntry>;

export function getTooltipEntry(id: TooltipIdentifier): TooltipEntry {
  return tooltipRegistry[id];
}
