/**
 * e2e-bug.341 — `POSITIVE_CUE`'s Armenian alternative was written with the
 * letter Ե (Yech, U+0565) instead of Է (Eh, U+0537), so `"օգտակար էր"`
 * ("was helpful") never matched any real occurrence — only the one exact
 * canonical string "Օգտակար էր" survived, via a coincidental separate
 * exact-string fixture lookup used only by `isGiveAiFeedbackPrompt`.
 */

export type E2e341FeedbackRatingCase = {
  id: string;
  prompt: string;
  expectIsFeedbackPrompt: boolean;
  expectRating: 'up' | 'down' | undefined;
  expectAspect: 'positive' | 'negative' | 'generic';
};

export const E2E341_POSITIVE_CASES: readonly E2e341FeedbackRatingCase[] = [
  {
    id: 'e341-hy-canonical-exact-phrase',
    prompt: 'Օգտակար էր',
    expectIsFeedbackPrompt: true,
    expectRating: 'up',
    expectAspect: 'positive',
  },
  {
    id: 'e341-hy-exact-reported-repro-1',
    prompt: 'Դա օգտակար էր',
    expectIsFeedbackPrompt: true,
    expectRating: 'up',
    expectAspect: 'positive',
  },
  {
    id: 'e341-hy-exact-reported-repro-2',
    prompt: 'Շատ օգտակար էր',
    expectIsFeedbackPrompt: true,
    expectRating: 'up',
    expectAspect: 'positive',
  },
] as const;

/** Controls — sibling negative Armenian cues from e2e-bug.324 must be unaffected. */
export const E2E341_NEGATIVE_CONTROL_CASES: readonly E2e341FeedbackRatingCase[] =
  [
    {
      id: 'e341-hy-negative-control-not-helpful-past',
      prompt: 'Օգտակար չէր',
      expectIsFeedbackPrompt: true,
      expectRating: 'down',
      expectAspect: 'negative',
    },
    {
      id: 'e341-hy-negative-control-that-was-wrong',
      prompt: 'Դա սխալ էր',
      expectIsFeedbackPrompt: true,
      expectRating: 'down',
      expectAspect: 'negative',
    },
  ] as const;
