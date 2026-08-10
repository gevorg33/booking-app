/**
 * e2e-bug.326 — public/customer "+1 thanks" / "thanks +1" style wrappers
 * (and fullwidth ＋1/－1) must still rate as give_ai_feedback. Residual from
 * e2e-bug.300, which only covered bare "+1"/"-1". Whole-prompt only — no
 * booking-math false positives.
 */

export type E2e326RatingCase = {
  id: string;
  prompt: string;
  expectedRating: 'up' | 'down';
  expectedAspect: 'positive' | 'negative';
  expectShowReasonChips?: boolean;
};

export const E2E326_WRAPPER_CASES: readonly E2e326RatingCase[] = [
  {
    id: 'ai-e2e326-plus-one-thanks-suffix',
    prompt: '+1 thanks',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'ai-e2e326-thanks-plus-one-prefix',
    prompt: 'thanks +1',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'ai-e2e326-minus-one-thanks-suffix',
    prompt: '-1 thanks',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
  {
    id: 'ai-e2e326-thanks-minus-one-prefix',
    prompt: 'thanks -1',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
  {
    id: 'ai-e2e326-plus-one-thx-bang',
    prompt: '+1 thx!',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'ai-e2e326-ty-plus-one-comma',
    prompt: 'ty, +1',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'ai-e2e326-thanks-plus-one-word',
    prompt: 'thanks plus one',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'ai-e2e326-plus-one-fullwidth',
    prompt: '＋1',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'ai-e2e326-minus-one-fullwidth',
    prompt: '－1',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
  {
    id: 'ai-e2e326-plus-one-fullwidth-thanks',
    prompt: '＋1 thanks',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
];

/** Must not steal booking/math phrasing even with a wrapper word present. */
export const E2E326_NEGATIVE_PROMPTS: readonly {
  id: string;
  prompt: string;
}[] = [
  { id: 'ai-e2e326-neg-party-plus-one', prompt: 'party of +1' },
  { id: 'ai-e2e326-neg-book-plus-one', prompt: 'Book +1 massage tomorrow' },
  {
    id: 'ai-e2e326-neg-thanks-book-plus-one',
    prompt: 'thanks, book +1 massage',
  },
  { id: 'ai-e2e326-neg-plus-one-stars-thanks', prompt: 'thanks, +1 stars' },
  { id: 'ai-e2e326-neg-plus-ten-thanks', prompt: '+10 thanks' },
];
