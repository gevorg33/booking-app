import { rescueExplainPostVisitReviewPromptIntent } from './ai-explain-post-visit-review-prompt.util.js';
import { EXPLAIN_POST_VISIT_REVIEW_PROMPT_RESCUE_SCENARIOS } from './ai-explain-post-visit-review-prompt.fixtures.js';

describe('customer-ai-command explain_post_visit_review_prompt integration (ai-cmd-customer-4.12.2)', () => {
  it.each(EXPLAIN_POST_VISIT_REVIEW_PROMPT_RESCUE_SCENARIOS)(
    'rescues explain_post_visit_review_prompt for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainPostVisitReviewPromptIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe(expectedAction);
    },
  );
});
