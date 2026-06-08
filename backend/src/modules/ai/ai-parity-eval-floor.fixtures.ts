/** parity-4.3 — role/surface eval floor ratchet toward 100%. */
export const ROLE_SURFACE_EVAL_RATCHET_TARGET = 1;
export const ROLE_SURFACE_EVAL_RATCHET_STEP = 0.005;

export const ROLE_SURFACE_EVAL_RATCHET_SCENARIOS = [
  {
    id: 'bump-owner-dashboard',
    key: 'owner:dashboard',
    currentFloor: 0.996,
    measuredAccuracy: 1,
    expectBump: true,
    expectNextFloor: 1,
  },
  {
    id: 'skip-at-target',
    key: 'manager:dashboard',
    currentFloor: 1,
    measuredAccuracy: 1,
    expectBump: false,
    expectNextFloor: 1,
  },
  {
    id: 'skip-when-too-close',
    key: 'client:customer',
    currentFloor: 0.935,
    measuredAccuracy: 0.936,
    expectBump: false,
    expectNextFloor: 0.935,
  },
] as const;
