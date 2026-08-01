/**
 * e2e-bug.280 — short public give_ai_feedback prompts that classify as
 * `unknown` must still rescue (unknown-phase), not return assistant.unknown.
 */

export type E2e280FeedbackCase = {
  id: string;
  prompt: string;
  surface: 'public' | 'customer';
  expectedRating?: 'up' | 'down';
  expectedReason?:
    | 'wrong_action'
    | 'wrong_date'
    | 'wrong_person'
    | 'wrong_service'
    | 'did_not_understand';
};

/** Short cues that util detects but previously died as unknown before rescue. */
export const E2E280_SHORT_FEEDBACK_PROMPTS: readonly E2e280FeedbackCase[] = [
  {
    id: 'ai-e2e280-helpful',
    prompt: 'Helpful',
    surface: 'public',
    expectedRating: 'up',
  },
  {
    id: 'ai-e2e280-good-answer',
    prompt: 'Good answer',
    surface: 'public',
    expectedRating: 'up',
  },
  {
    id: 'ai-e2e280-bad-answer',
    prompt: 'Bad answer',
    surface: 'public',
    expectedRating: 'down',
  },
  {
    id: 'ai-e2e280-wrong-service',
    prompt: 'Wrong service',
    surface: 'public',
    expectedRating: 'down',
    expectedReason: 'wrong_service',
  },
  {
    id: 'ai-e2e280-wrong-person-picked',
    prompt: 'Wrong person picked',
    surface: 'public',
    expectedRating: 'down',
    expectedReason: 'wrong_person',
  },
  {
    id: 'ai-e2e280-didnt-understand',
    prompt: "You didn't understand me",
    surface: 'public',
    expectedRating: 'down',
    expectedReason: 'did_not_understand',
  },
  {
    id: 'ai-e2e280-ru-ne-polezno',
    prompt: 'Не полезно',
    surface: 'public',
    expectedRating: 'down',
  },
  {
    id: 'ai-e2e280-wrong-action',
    prompt: 'Wrong action',
    surface: 'public',
    expectedRating: 'down',
    expectedReason: 'wrong_action',
  },
  {
    id: 'ai-e2e280-customer-helpful',
    prompt: 'Helpful',
    surface: 'customer',
    expectedRating: 'up',
  },
  {
    id: 'ai-e2e280-customer-bad-answer',
    prompt: 'Bad answer',
    surface: 'customer',
    expectedRating: 'down',
  },
] as const;

/** Longer cues that already worked — regression guard. */
export const E2E280_REGRESSION_PROMPTS: readonly E2e280FeedbackCase[] = [
  {
    id: 'ai-e2e280-not-helpful',
    prompt: 'Not helpful',
    surface: 'public',
    expectedRating: 'down',
  },
  {
    id: 'ai-e2e280-that-was-helpful',
    prompt: 'That was helpful',
    surface: 'public',
    expectedRating: 'up',
  },
  {
    id: 'ai-e2e280-wrong-date-picked',
    prompt: 'Wrong date picked',
    surface: 'public',
    expectedRating: 'down',
    expectedReason: 'wrong_date',
  },
] as const;
