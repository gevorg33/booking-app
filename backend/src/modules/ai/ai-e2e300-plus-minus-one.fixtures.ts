/**
 * e2e-bug.300 — public/customer "+1" / "-1" must rate as give_ai_feedback
 * (not stay unknown). Whole-prompt only — no booking-math false positives.
 */

export type E2e300RatingCase = {
  id: string;
  prompt: string;
  expectedRating: 'up' | 'down';
  expectedAspect: 'positive' | 'negative';
  expectShowReasonChips?: boolean;
};

export const E2E300_PLUS_MINUS_CASES: readonly E2e300RatingCase[] = [
  {
    id: 'ai-e2e300-plus-one',
    prompt: '+1',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'ai-e2e300-minus-one',
    prompt: '-1',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
  {
    id: 'ai-e2e300-plus-one-space',
    prompt: '+ 1',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'ai-e2e300-minus-one-space',
    prompt: '- 1',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
  {
    id: 'ai-e2e300-plus-one-bang',
    prompt: '+1!',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'ai-e2e300-minus-one-period',
    prompt: '-1.',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
  {
    id: 'ai-e2e300-plus-one-words',
    prompt: 'plus one',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'ai-e2e300-minus-one-words',
    prompt: 'minus one',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
  {
    id: 'ai-e2e300-plus-1-words',
    prompt: 'plus 1',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'ai-e2e300-minus-1-words',
    prompt: 'minus 1',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
  {
    id: 'ai-e2e300-plus-one-padded',
    prompt: '  +1  ',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'ai-e2e300-minus-one-padded',
    prompt: '  -1  ',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
];

/** Must not steal booking/math phrasing. */
export const E2E300_NEGATIVE_PROMPTS: readonly {
  id: string;
  prompt: string;
}[] = [
  { id: 'ai-e2e300-neg-party-plus-one', prompt: 'party of +1' },
  { id: 'ai-e2e300-neg-book-plus-one', prompt: 'Book +1 massage tomorrow' },
  { id: 'ai-e2e300-neg-add-guest', prompt: 'add +1 guest' },
  { id: 'ai-e2e300-neg-one-plus-one', prompt: '1+1' },
  { id: 'ai-e2e300-neg-plus-ten', prompt: '+10' },
  { id: 'ai-e2e300-neg-minus-ten', prompt: '-10' },
  { id: 'ai-e2e300-neg-plus-one-stars', prompt: 'I give this +1 stars' },
  { id: 'ai-e2e300-neg-score-minus-one', prompt: 'score is -1 for today' },
];

/** Controls — existing thumbs cues still work. */
export const E2E300_CONTROL_CASES: readonly E2e300RatingCase[] = [
  {
    id: 'ai-e2e300-ctrl-thumbs-up',
    prompt: 'Thumbs up',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'ai-e2e300-ctrl-thumbs-down',
    prompt: 'Thumbs down',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
  {
    id: 'ai-e2e300-ctrl-helpful',
    prompt: 'Helpful',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
];
