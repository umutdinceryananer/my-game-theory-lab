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
} as const satisfies Record<string, TooltipEntry>;

export function getTooltipEntry(id: TooltipIdentifier): TooltipEntry {
  return tooltipRegistry[id];
}
