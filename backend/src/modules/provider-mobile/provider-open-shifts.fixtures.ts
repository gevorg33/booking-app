/** prov-exp-7.3 — open shifts / schedule gap scenarios. */

export const PROVIDER_OPEN_SHIFTS_SETTINGS_SCENARIOS = [
  {
    id: 'disabled-by-default',
    raw: {},
    expectedEnabled: false,
  },
  {
    id: 'enabled-flag',
    raw: { providerOpenShifts: { enabled: true } },
    expectedEnabled: true,
  },
] as const;

export const PROVIDER_OPEN_SHIFTS_GAP_DURATION_SCENARIOS = [
  {
    id: 'ninety-minutes',
    startTime: '10:00',
    endTime: '11:30',
    expectedMinutes: 90,
  },
  {
    id: 'thirty-one-minutes',
    startTime: '14:00',
    endTime: '14:31',
    expectedMinutes: 31,
  },
] as const;

export const PROVIDER_OPEN_SHIFTS_FILL_PROMPT_SCENARIOS = [
  {
    id: 'fill-this-gap',
    prompt: 'Fill this gap on 2026-06-09 from 14:00 to 15:30 — suggest waitlist customers',
    expectedMatch: true,
  },
  {
    id: 'generic-availability',
    prompt: 'Am I free at 14:00 tomorrow?',
    expectedMatch: false,
  },
] as const;

export const PROVIDER_OPEN_SHIFTS_CLASSIFIER_RULES = `- suggest_waitlist_for_gap: READ — own calendar gap with waitlist customer suggestions (requires open-shifts admin toggle). Triggers: fill this gap|suggest waitlist for gap|who on waitlist for this slot. Params: date + timeFrom/timeTo for the gap window. NOT fill_unused_slots (creates schedule blocks) and NOT coordinate_waitlist_offer (manager cancels then offers).`;

export const SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS = [
  {
    id: 'fill-gap-waitlist',
    prompt: 'Fill this gap on 09/06/2026 from 14:00 to 15:30 — suggest waitlist customers',
    surface: 'provider' as const,
    expectedAction: 'suggest_waitlist_for_gap',
  },
  {
    id: 'waitlist-for-open-slot',
    prompt: 'Suggest waitlist customers for my 10:00–11:00 gap today',
    surface: 'provider' as const,
    expectedAction: 'suggest_waitlist_for_gap',
  },
] as const;
