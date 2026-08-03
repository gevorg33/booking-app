/**
 * e2e-bug.342 — `list_team_unpaid_today` / `explain_reviews_inbox` were
 * entirely missing from the command registry (INTENT_BINDING_SEEDS), so
 * `acceptRescueForSurface` silently dropped an otherwise-correct rescue
 * whenever the upstream classifier gave up entirely and returned literally
 * `'unknown'` — the deterministic detectors and `tryRescueProviderExp2`
 * were both already correct; only the registry row was missing.
 */

export type E2e342RegistryGapCase = {
  id: string;
  prompt: string;
  expectedAction: 'list_team_unpaid_today' | 'explain_reviews_inbox';
};

export const E2E342_UNKNOWN_RESCUE_CASES: readonly E2e342RegistryGapCase[] = [
  {
    id: 'e342-hy-unpaid-today',
    prompt: 'Կա՞ որևէ մեկը հարկում, ով դեռ չի վճարել',
    expectedAction: 'list_team_unpaid_today',
  },
  {
    id: 'e342-ru-unpaid-today',
    prompt: 'Есть кто-то в команде, кто ещё не заплатил?',
    expectedAction: 'list_team_unpaid_today',
  },
  {
    id: 'e342-hy-reviews-inbox',
    prompt: 'Ցուցադրիր վատ կարծիքները այս շաբաթ',
    expectedAction: 'explain_reviews_inbox',
  },
  {
    id: 'e342-ru-reviews-inbox',
    prompt: 'Покажи плохие отзывы за эту неделю',
    expectedAction: 'explain_reviews_inbox',
  },
] as const;
