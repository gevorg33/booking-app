import { REVIEWS_SCENARIOS } from './ai-reviews.fixtures.js';
import {
  isListReviewsPrompt,
  isSubmitReviewPrompt,
  isReviewsIntent,
  rescueReviewsIntent,
} from './ai-reviews.util.js';

describe('ai-reviews.util (parity-2)', () => {
  it.each(REVIEWS_SCENARIOS)('scenario $id detection', ({ prompt, expectedAction }) => {
    if (expectedAction === 'list_reviews') {
      expect(isListReviewsPrompt(prompt)).toBe(true);
    } else {
      expect(isSubmitReviewPrompt(prompt)).toBe(true);
    }
    expect(isReviewsIntent(expectedAction)).toBe(true);
  });

  it('rescues misclassified review prompts', () => {
    expect(rescueReviewsIntent('show recent reviews', 'unknown')).toEqual({
      action: 'list_reviews',
      rescueReason: 'list_reviews',
    });
    expect(rescueReviewsIntent('leave a 5 star review', 'unknown')).toEqual({
      action: 'submit_review',
      rescueReason: 'submit_review',
    });
  });
});
