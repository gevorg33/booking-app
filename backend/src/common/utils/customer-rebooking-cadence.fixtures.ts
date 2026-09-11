/** adopt-6.5 — smart rebooking cadence scenario fixtures. */

/** Declared so the array is one type, not a union of literal shapes. */
export type LearnedCadenceIntervalScenario = {
  id: string;
  intervals: { completedAt: string; previousCompletedAt: string }[];
  expectedDays: number;
};

export const LEARNED_CADENCE_INTERVAL_SCENARIOS: readonly LearnedCadenceIntervalScenario[] = [
  {
    id: 'two-four-week-gaps',
    intervals: [
      { completedAt: '2026-04-01', previousCompletedAt: '2026-03-04' },
      { completedAt: '2026-05-01', previousCompletedAt: '2026-04-03' },
    ],
    expectedDays: 28,
  },
  {
    id: 'three-week-median',
    intervals: [
      { completedAt: '2026-06-01', previousCompletedAt: '2026-05-11' },
      { completedAt: '2026-05-11', previousCompletedAt: '2026-04-20' },
      { completedAt: '2026-04-20', previousCompletedAt: '2026-03-30' },
    ],
    expectedDays: 21,
  },
] as const;

/**
 * Declared so the array is one type, not a union of literal shapes. The three
 * members exercise different precedence paths — history, metadata, service
 * default — so each path's input is optional.
 */
export type LearnedCadenceResolveScenario = {
  id: string;
  serviceCadenceDays: number;
  defaultCadenceDays: number;
  expectedDays: number;
  learnedFromHistory?: number;
  metadataByService?: Record<string, number>;
  serviceId?: string;
};

export const LEARNED_CADENCE_RESOLVE_SCENARIOS: readonly LearnedCadenceResolveScenario[] = [
  {
    id: 'history-overrides-service-default',
    serviceCadenceDays: 30,
    defaultCadenceDays: 45,
    learnedFromHistory: 21,
    expectedDays: 21,
  },
  {
    id: 'metadata-overrides-service-default',
    serviceCadenceDays: 30,
    defaultCadenceDays: 45,
    metadataByService: { 'svc-color': 63 },
    serviceId: 'svc-color',
    expectedDays: 63,
  },
  {
    id: 'falls-back-to-service-default',
    serviceCadenceDays: 28,
    defaultCadenceDays: 45,
    expectedDays: 28,
  },
] as const;
