/** acc-3.13 — per-business learned paraphrase limits and match thresholds. */
export const MAX_BUSINESS_PARAPHRASES = 120;

export const MIN_BUSINESS_PARAPHRASE_PROMPT_LENGTH = 12;

export const BUSINESS_PARAPHRASE_EXACT_MATCH_CONFIDENCE = 0.95;

export const BUSINESS_PARAPHRASE_FUZZY_MATCH_CONFIDENCE = 0.78;

export const BUSINESS_PARAPHRASE_RECURRING_HIT_THRESHOLD = 2;

/** Actions never stored as learned business paraphrases. */
export const BUSINESS_PARAPHRASE_SKIP_ACTIONS = new Set([
  'unknown',
  'clarify',
  'error',
  'security_blocked',
  'noop',
]);

export interface BusinessParaphraseScenario {
  id: string;
  prompt: string;
  action: string;
  surface: 'dashboard' | 'provider' | 'customer' | 'public';
  source: 'correction' | 'recurring';
  hitCount?: number;
}

export const BUSINESS_PARAPHRASE_SCENARIOS: BusinessParaphraseScenario[] = [
  {
    id: 'biz-paraphrase-exact-dashboard',
    prompt: 'pull the morning sheet',
    action: 'list_bookings',
    surface: 'dashboard',
    source: 'correction',
  },
  {
    id: 'biz-paraphrase-exact-provider',
    prompt: 'show my chair today',
    action: 'list_my_bookings',
    surface: 'provider',
    source: 'correction',
  },
  {
    id: 'biz-paraphrase-recurring-customer',
    prompt: 'book my usual spot',
    action: 'create_booking',
    surface: 'customer',
    source: 'recurring',
    hitCount: 3,
  },
  {
    id: 'biz-paraphrase-skip-short',
    prompt: 'hi there',
    action: 'list_bookings',
    surface: 'dashboard',
    source: 'recurring',
  },
];
