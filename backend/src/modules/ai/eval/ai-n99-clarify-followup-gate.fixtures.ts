import {
  CLARIFY_FOLLOWUP_EVAL_FLOOR,
  CLARIFY_NEAR_99_PRIMARY_LOCALES,
  CLARIFY_NEAR_99_TARGET,
} from '../ai-n99-clarify-success.fixtures.js';

/** n99-1.9 — ratchet clarify_followup CI floor toward 99% in small steps. */
export const CLARIFY_FOLLOWUP_RATCHET_STEP = 0.005;
export const CLARIFY_FOLLOWUP_RATCHET_MIN_BUMP_GAP = 0.002;
export const CLARIFY_FOLLOWUP_MIN_CASES = 10;
export const CLARIFY_FOLLOWUP_MIN_PER_LOCALE = 2;

export const CLARIFY_FOLLOWUP_GATE_DEFAULTS = {
  floor: CLARIFY_FOLLOWUP_EVAL_FLOOR,
  target: CLARIFY_NEAR_99_TARGET,
  minCases: CLARIFY_FOLLOWUP_MIN_CASES,
  minPerLocale: CLARIFY_FOLLOWUP_MIN_PER_LOCALE,
  primaryLocales: CLARIFY_NEAR_99_PRIMARY_LOCALES,
} as const;

export const CLARIFY_FOLLOWUP_RATCHET_SCENARIOS = [
  {
    id: 'bump-when-above-floor',
    currentFloor: 0.95,
    measuredAccuracy: 0.962,
    expectBump: true,
    expectNextFloor: 0.955,
  },
  {
    id: 'skip-when-at-target',
    currentFloor: 0.99,
    measuredAccuracy: 0.995,
    expectBump: false,
    expectNextFloor: 0.99,
  },
] as const;
