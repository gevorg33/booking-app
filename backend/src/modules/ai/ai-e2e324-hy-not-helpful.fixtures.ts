/**
 * e2e-bug.324 — Armenian native "not helpful" ("Օգտակար չէ") must rescue to
 * give_ai_feedback (rating "down"), matching the RU "Не полезно" sibling and
 * the existing HY negative "Սխալ էր" — instead of falling through to `unknown`.
 */

export type E2e324NegativeCase = {
  id: string;
  prompt: string;
};

export const E2E324_HY_NOT_HELPFUL_CASES: readonly E2e324NegativeCase[] = [
  { id: 'e324-not-helpful-present', prompt: 'Օգտակար չէ' },
  { id: 'e324-not-helpful-past', prompt: 'Օգտակար չէր' },
  { id: 'e324-not-helpful-lowercase', prompt: 'օգտակար չէ' },
] as const;

/** Must keep resolving to "up" — the fix must not steal the positive cue. */
export const E2E324_HY_HELPFUL_CONTROL = 'Օգտակար էր';
