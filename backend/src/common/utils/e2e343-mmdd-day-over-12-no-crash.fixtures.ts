/**
 * e2e-bug.343 — `parseDateInput`'s slash-date branch unconditionally assumed
 * DD/MM/YYYY, so a day-of-month > 12 in the second position (i.e. an actual
 * MM/DD/YYYY US-format date) built an `Invalid Date` that `toIsoDay` then
 * crashed on via `.toISOString()`. A day-of-month > 12 unambiguously signals
 * MM/DD, so the parser now swaps interpretation instead of crashing.
 */

export type E2e343SlashDateCase = {
  id: string;
  input: string;
  expectedIso: string | null;
};

export const E2E343_SLASH_DATE_CASES: readonly E2e343SlashDateCase[] = [
  {
    id: 'e343-exact-reported-repro-mmdd',
    input: '08/19/2026',
    expectedIso: '2026-08-19',
  },
  {
    id: 'e343-ddmm-regression-no-swap-needed',
    input: '19/08/2026',
    expectedIso: '2026-08-19',
  },
  {
    id: 'e343-ambiguous-both-valid-keeps-ddmm-assumption',
    input: '01/02/2026',
    expectedIso: '2026-02-01',
  },
  {
    id: 'e343-both-components-over-12-graceful-null',
    input: '13/14/2026',
    expectedIso: null,
  },
  {
    id: 'e343-mmdd-swap-december',
    input: '12/25/2026',
    expectedIso: '2026-12-25',
  },
] as const;
