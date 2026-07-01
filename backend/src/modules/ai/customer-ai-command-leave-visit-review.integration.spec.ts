import { rescueLeaveVisitReviewIntent } from './ai-leave-visit-review.util.js';
import { LEAVE_VISIT_REVIEW_RESCUE_SCENARIOS } from './ai-leave-visit-review.fixtures.js';

describe('customer-ai-command leave_visit_review integration (ai-cmd-customer-4.12.1)', () => {
  it.each(LEAVE_VISIT_REVIEW_RESCUE_SCENARIOS)(
    'rescues leave_visit_review for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueLeaveVisitReviewIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );
});
