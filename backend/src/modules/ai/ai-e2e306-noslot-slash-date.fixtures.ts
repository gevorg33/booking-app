/**
 * e2e-bug.306 — no-slot / empty-availability failure copy must use
 * formatDateForAiLabel ("2 August 2026"), never DD/MM slash ("02/08/2026").
 */

export type E2e306NoSlotCase = {
  id: string;
  dateKey: string;
  serviceName: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  expectContains: string;
  forbidSlash: string;
};

export const E2E306_NO_NEAREST_CASES: readonly E2e306NoSlotCase[] = [
  {
    id: 'ai-e2e306-nearest-aug-2',
    dateKey: '2026-08-02',
    serviceName: 'Swedish massage',
    expectContains: '2 August 2026',
    forbidSlash: '02/08/2026',
  },
  {
    id: 'ai-e2e306-nearest-aug-3',
    dateKey: '2026-08-03',
    serviceName: 'Swedish massage',
    timeOfDay: 'morning',
    expectContains: '3 August 2026',
    forbidSlash: '03/08/2026',
  },
  {
    id: 'ai-e2e306-nearest-jun-7',
    dateKey: '2026-06-07',
    serviceName: 'Permanent lashes',
    timeOfDay: 'evening',
    expectContains: '7 June 2026',
    forbidSlash: '07/06/2026',
  },
] as const;

export const E2E306_NO_PROVIDERS_CASES: readonly E2e306NoSlotCase[] = [
  {
    id: 'ai-e2e306-providers-aug-2',
    dateKey: '2026-08-02',
    serviceName: 'Swedish massage',
    expectContains: '2 August 2026',
    forbidSlash: '02/08/2026',
  },
  {
    id: 'ai-e2e306-providers-aug-3-evening',
    dateKey: '2026-08-03',
    serviceName: 'massage',
    timeOfDay: 'evening',
    expectContains: '3 August 2026',
    forbidSlash: '03/08/2026',
  },
] as const;

/** Slash DD/MM must never appear in AI failure summaries. */
export const E2E306_SLASH_DATE_RE = /\b\d{2}\/\d{2}\/\d{4}\b/;
