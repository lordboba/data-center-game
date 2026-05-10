import type {
  EventModifierTemplate,
  EventOutcomeTone,
  EventSeverity,
  RandomEventEffects,
} from "./randomEvents";

export type DifficultyId = "easy" | "medium" | "hard";

export type IndependentWarShock = {
  chance: number;
  firstAvailablePeriod: number;
  minBuiltUnits: number;
  headline: string;
  warning: string;
  effects: RandomEventEffects;
};

export type DifficultyMode = {
  id: DifficultyId;
  label: string;
  shortLabel: string;
  description: string;
  annualInflationRate: number;
  randomEventChance: number;
  eventCooldownPeriodOffset: number;
  eventSeverityWeightMultipliers: Record<EventSeverity, number>;
  outcomeToneWeightMultipliers: Record<EventOutcomeTone, number>;
  independentWarShock?: IndependentWarShock;
};

const hardWarInflation: EventModifierTemplate = {
  label: "War inflation",
  description:
    "An additional conflict compounds energy, insurance, freight, and critical-equipment costs.",
  durationPeriods: 7,
  costMultiplier: 1.08,
};

export const DIFFICULTY_MODES: DifficultyMode[] = [
  {
    id: "easy",
    label: "Easy",
    shortLabel: "Easy",
    description: "Baseline event odds and 10% annual inflation.",
    annualInflationRate: 0.1,
    randomEventChance: 0.28,
    eventCooldownPeriodOffset: 0,
    eventSeverityWeightMultipliers: {
      low: 1,
      medium: 1,
      high: 1,
    },
    outcomeToneWeightMultipliers: {
      favorable: 1,
      mixed: 1,
      adverse: 1,
    },
  },
  {
    id: "medium",
    label: "Medium",
    shortLabel: "Med",
    description: "More frequent shocks, harsher outcomes, and 12% inflation.",
    annualInflationRate: 0.12,
    randomEventChance: 0.36,
    eventCooldownPeriodOffset: 0,
    eventSeverityWeightMultipliers: {
      low: 0.92,
      medium: 1.08,
      high: 1.24,
    },
    outcomeToneWeightMultipliers: {
      favorable: 0.95,
      mixed: 1.05,
      adverse: 1.22,
    },
  },
  {
    id: "hard",
    label: "Hard",
    shortLabel: "Hard",
    description:
      "Frequent shocks, adverse outcomes, 15% inflation, and independent war risk.",
    annualInflationRate: 0.15,
    randomEventChance: 0.46,
    eventCooldownPeriodOffset: -1,
    eventSeverityWeightMultipliers: {
      low: 0.78,
      medium: 1.14,
      high: 1.5,
    },
    outcomeToneWeightMultipliers: {
      favorable: 0.86,
      mixed: 1.12,
      adverse: 1.45,
    },
    independentWarShock: {
      chance: 0.14,
      firstAvailablePeriod: 12,
      minBuiltUnits: 1,
      headline:
        "A separate overseas war widens the procurement shock and compounds crisis inflation.",
      warning:
        "Hard-mode war risk is independent of normal random events; overlapping wars multiply project costs.",
      effects: {
        businessSupport: -2,
        politicalSupport: -1,
        outlook: -2,
        budgetBalance: -1,
        modifiers: [hardWarInflation],
      },
    },
  },
];

export const DEFAULT_DIFFICULTY_ID: DifficultyId = "easy";

export function getDifficultyMode(difficultyId: DifficultyId): DifficultyMode {
  return (
    DIFFICULTY_MODES.find((difficulty) => difficulty.id === difficultyId) ??
    DIFFICULTY_MODES[0]
  );
}

export function isDifficultyId(value: unknown): value is DifficultyId {
  return (
    typeof value === "string" &&
    DIFFICULTY_MODES.some((difficulty) => difficulty.id === value)
  );
}
