/** prov-exp-7.1 — provider self-block scenarios. */

export const PROVIDER_SELF_BLOCK_SETTINGS_SCENARIOS = [
  {
    id: 'disabled-by-default',
    raw: {},
    expectedEnabled: false,
  },
  {
    id: 'enabled-flag',
    raw: { providerSelfBlock: { enabled: true } },
    expectedEnabled: true,
  },
  {
    id: 'explicit-disabled',
    raw: { providerSelfBlock: { enabled: false } },
    expectedEnabled: false,
  },
] as const;

/**
 * Declared so the array is one type, not a union of two literal shapes.
 *
 * The success and failure members carry different keys — one has
 * `expectedStart`/`expectedEnd`/`expectedPlaceholder`, the other `expected: null`
 * — so all four are optional. `as const` is kept off the array: it would make
 * each member a distinct readonly tuple element again, which is the problem.
 */
export type ProviderSelfBlockBuildScenario = {
  id: string;
  employeeId: string;
  input: {
    date: string;
    startTime: string;
    endTime: string;
    placeholder: string;
  };
  expectedStart?: string;
  expectedEnd?: string;
  expectedPlaceholder?: string;
  expected?: null;
};

export const PROVIDER_SELF_BLOCK_BUILD_SCENARIOS: readonly ProviderSelfBlockBuildScenario[] = [
  {
    id: 'lunch-window',
    employeeId: 'emp-1',
    input: {
      date: '2026-06-20',
      startTime: '12:00',
      endTime: '13:00',
      placeholder: 'Lunch',
    },
    expectedStart: '2026-06-20T12:00:00.000Z',
    expectedEnd: '2026-06-20T13:00:00.000Z',
    expectedPlaceholder: 'Lunch',
  },
  {
    id: 'invalid-window',
    employeeId: 'emp-1',
    input: {
      date: '2026-06-20',
      startTime: '14:00',
      endTime: '13:00',
      placeholder: 'Break',
    },
    expected: null,
  },
];

export const PROVIDER_SELF_BLOCK_VALIDATION_SCENARIOS = [
  {
    id: 'valid',
    startIso: '2026-06-20T12:00:00.000Z',
    endIso: '2026-06-20T13:00:00.000Z',
    expectedError: null,
  },
  {
    id: 'end-before-start',
    startIso: '2026-06-20T14:00:00.000Z',
    endIso: '2026-06-20T13:00:00.000Z',
    expectedError: 'End time must be after start time',
  },
] as const;
