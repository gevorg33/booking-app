/** adopt-4.4 — rebooking cadence scenario fixtures. */

export const REBOOKING_CADENCE_SCENARIOS = [
  {
    id: 'service-metadata-override',
    serviceMetadata: { rebookingCadenceDays: 21 },
    defaultCadenceDays: 42,
    expectedCadenceDays: 21,
  },
  {
    id: 'business-default-fallback',
    serviceMetadata: {},
    defaultCadenceDays: 42,
    expectedCadenceDays: 42,
  },
  {
    id: 'clamp-low-metadata',
    serviceMetadata: { rebookingCadenceDays: 3 },
    defaultCadenceDays: 42,
    expectedCadenceDays: 7,
  },
] as const;

export const REBOOKING_DUE_SCENARIOS = [
  {
    id: 'due-on-cadence-day',
    lastCompletedAt: '2026-05-01T15:00:00.000Z',
    cadenceDays: 28,
    now: '2026-05-29T12:00:00.000Z',
    expectedDue: true,
  },
  {
    id: 'inside-grace-window',
    lastCompletedAt: '2026-05-01T15:00:00.000Z',
    cadenceDays: 28,
    now: '2026-05-31T12:00:00.000Z',
    expectedDue: true,
  },
  {
    id: 'before-due-date',
    lastCompletedAt: '2026-05-01T15:00:00.000Z',
    cadenceDays: 28,
    now: '2026-05-20T12:00:00.000Z',
    expectedDue: false,
  },
  {
    id: 'after-grace-window',
    lastCompletedAt: '2026-05-01T15:00:00.000Z',
    cadenceDays: 28,
    now: '2026-06-05T12:00:00.000Z',
    expectedDue: false,
  },
] as const;
