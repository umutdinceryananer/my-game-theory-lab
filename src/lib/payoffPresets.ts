import type { PayoffMatrix } from "@/core/types";

export interface PayoffMatrixPreset {
  id: string;
  name: string;
  description: string;
  matrix: PayoffMatrix;
}

export const PAYOFF_PRESETS: PayoffMatrixPreset[] = [
  {
    id: "prisoners-dilemma",
    name: "Prisoner's Dilemma",
    description: "Classic dilemma with temptation reward ordering T > R > P > S.",
    matrix: {
      temptation: 5,
      reward: 3,
      punishment: 1,
      sucker: 0,
    },
  },
  {
    id: "stag-hunt",
    name: "Stag Hunt",
    description: "Coordinated cooperation pays best; mutual defection is safer but less rewarding.",
    matrix: {
      temptation: 3,
      reward: 4,
      punishment: 2,
      sucker: 0,
    },
  },
  {
    id: "chicken",
    name: "Chicken",
    description: "Risky anti-coordination where backing down avoids the worst crash outcome.",
    matrix: {
      temptation: 4,
      reward: 3,
      punishment: 0,
      sucker: 1,
    },
  },
];

const PAYOFF_PRESET_MAP = new Map<string, PayoffMatrixPreset>(
  PAYOFF_PRESETS.map((preset) => [preset.id, preset]),
);

export function getPresetById(id: string): PayoffMatrixPreset | undefined {
  return PAYOFF_PRESET_MAP.get(id);
}

export function listPayoffPresets(): PayoffMatrixPreset[] {
  return PAYOFF_PRESETS;
}

export const DEFAULT_PAYOFF_PRESET_ID = "prisoners-dilemma";
