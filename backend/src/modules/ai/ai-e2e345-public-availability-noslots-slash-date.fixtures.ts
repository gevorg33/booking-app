/**
 * e2e-bug.345 — public `check_availability`'s no-slots summary
 * (`public-booking-assistant.service.ts`, `composeAvailabilityNoSlotsSummary`
 * call site) must use `formatDateForAiLabel` ("2 August 2026"), never DD/MM
 * slash ("02/08/2026") — sibling of Fixed e2e-bug.285/306/332.
 */

export type E2e345NoSlotsDateCase = {
  id: string;
  dateKey: string;
  serviceLabel: string;
  providerLabel: string;
  expectContains: string;
  forbidSlash: string;
};

export const E2E345_NO_SLOTS_DATE_CASES: readonly E2e345NoSlotsDateCase[] = [
  {
    id: 'ai-e2e345-any-specialist-aug-2',
    dateKey: '2026-08-02',
    serviceLabel: 'Swedish massage',
    providerLabel: 'any specialist',
    expectContains: '2 August 2026',
    forbidSlash: '02/08/2026',
  },
  {
    id: 'ai-e2e345-any-specialist-aug-3',
    dateKey: '2026-08-03',
    serviceLabel: 'Deep tissue massage',
    providerLabel: 'any specialist',
    expectContains: '3 August 2026',
    forbidSlash: '03/08/2026',
  },
  {
    id: 'ai-e2e345-named-provider-dec-25',
    dateKey: '2026-12-25',
    serviceLabel: 'Haircut',
    providerLabel: 'Karo Mazmanyan',
    expectContains: '25 December 2026',
    forbidSlash: '25/12/2026',
  },
] as const;

/** Slash DD/MM must never appear in the public no-slots summary. */
export const E2E345_SLASH_DATE_RE = /\b\d{2}\/\d{2}\/\d{4}\b/;
