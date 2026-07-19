/**
 * e2e-bug.105 — registry example prompts for tour compounds must execute
 * explain_tour_booking / day-slots / capacity steps via structured compound
 * params (not only when the raw prompt looks like a READ explain), and short
 * nicknames like "wine tour" must resolve to catalog names such as
 * "Private Wine Country Day".
 */
export const E2E105_TOUR_COMPOUND_REGISTRY_SCENARIOS = [
  {
    id: 'e2e-bug-105-nearest-wine-tour',
    prompt: 'Book the wine tour earliest date for 2 people',
    recipe: 'book_tour_nearest_departure' as const,
    serviceNickname: 'wine tour',
    catalogName: 'Private Wine Country Day',
    paxCount: 2,
  },
  {
    id: 'e2e-bug-105-nearest-mountain-trek',
    prompt: 'Reserve mountain trek soonest departure for 4 people',
    recipe: 'book_tour_nearest_departure' as const,
    serviceNickname: 'mountain trek',
    catalogName: '3-Day Mountain Trek',
    paxCount: 4,
  },
  {
    id: 'e2e-bug-105-group-wine-tour',
    prompt: 'Wine tour for 6 next Saturday — book if enough seats',
    recipe: 'tour_group_checkout' as const,
    serviceNickname: 'Wine tour',
    catalogName: 'Private Wine Country Day',
    paxCount: 6,
  },
  {
    id: 'e2e-bug-105-group-city-tour',
    prompt: 'City tour for 8 on 15/08/2026 — book only if enough spots',
    recipe: 'tour_group_checkout' as const,
    serviceNickname: 'City tour',
    catalogName: 'Full Day City Tour',
    paxCount: 8,
  },
] as const;

export type E2e105TourCompoundRegistryScenario =
  (typeof E2E105_TOUR_COMPOUND_REGISTRY_SCENARIOS)[number];
