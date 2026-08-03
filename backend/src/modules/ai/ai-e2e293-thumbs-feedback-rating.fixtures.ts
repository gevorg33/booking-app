/**
 * e2e-bug.293 — "Thumbs up" / "Thumbs down" (and UI synonyms) must parse a
 * feedbackRating, not clarify without rating.
 */

export type E2e293RatingCase = {
  id: string;
  prompt: string;
  expectedRating: 'up' | 'down';
  expectedAspect: 'positive' | 'negative';
  expectShowReasonChips?: boolean;
};

export const E2E293_THUMBS_RATING_CASES: readonly E2e293RatingCase[] = [
  {
    id: 'e2e293-thumbs-up',
    prompt: 'Thumbs up',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'e2e293-thumbs-down',
    prompt: 'Thumbs down',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
  {
    id: 'e2e293-thumb-up',
    prompt: 'thumb up',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'e2e293-thumbs-up-hyphen',
    prompt: 'thumbs-up',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'e2e293-thumbs-down-hyphen',
    prompt: 'thumbs-down',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
  {
    id: 'e2e293-emoji-up',
    prompt: '👍',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'e2e293-emoji-down',
    prompt: '👎',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
  {
    id: 'e2e293-thumbs-up-case',
    prompt: 'THUMBS UP',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'e2e293-thumbs-down-case',
    prompt: 'THUMBS DOWN',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
];

/** Controls — existing cues must keep working. */
export const E2E293_CONTROL_CASES: readonly E2e293RatingCase[] = [
  {
    id: 'e2e293-control-helpful',
    prompt: 'Helpful',
    expectedRating: 'up',
    expectedAspect: 'positive',
  },
  {
    id: 'e2e293-control-not-helpful',
    prompt: 'Not helpful',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
  {
    id: 'e2e293-control-bad-answer',
    prompt: 'Bad answer',
    expectedRating: 'down',
    expectedAspect: 'negative',
    expectShowReasonChips: true,
  },
];

/** Must not steal unrelated prompts. */
export const E2E293_NEGATIVE_PROMPTS: readonly {
  id: string;
  prompt: string;
}[] = [
  { id: 'e2e293-neg-book-massage', prompt: 'Book a massage tomorrow' },
  { id: 'e2e293-neg-list-services', prompt: 'What services do you offer?' },
  { id: 'e2e293-neg-read-aloud', prompt: 'Read that aloud' },
];
