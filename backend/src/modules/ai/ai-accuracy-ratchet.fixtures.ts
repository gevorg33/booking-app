/** acc-6.4 — ratchet CI floor toward 99% in small steps. */
export const ACCURACY_RATCHET_TARGET = 0.99;
export const ACCURACY_RATCHET_STEP = 0.005;
export const ACCURACY_RATCHET_MIN_BUMP_GAP = 0.002;

export const ACCURACY_LADDER_STAGES = [
  { stage: 1, label: 'Stage 1', targetNoClarify: 0.85 },
  { stage: 2, label: 'Stage 2', targetNoClarify: 0.92 },
  { stage: 3, label: 'Stage 3', targetNoClarify: 0.96 },
  { stage: 4, label: 'Stage 4', targetNoClarify: 0.99 },
] as const;

export const ACCURACY_RATCHET_SCENARIOS = [
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
  {
    id: 'skip-when-too-close',
    currentFloor: 0.98,
    measuredAccuracy: 0.981,
    expectBump: false,
    expectNextFloor: 0.98,
  },
] as const;
