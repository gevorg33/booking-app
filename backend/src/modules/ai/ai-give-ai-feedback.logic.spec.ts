import { handleGiveAiFeedbackLogic } from './ai-give-ai-feedback.logic.js';
import { GIVE_AI_FEEDBACK_HANDLER_FIXTURES } from './ai-give-ai-feedback.fixtures.js';
import { FEEDBACK_THANKS } from './ai-give-ai-feedback.util.js';

describe('ai-give-ai-feedback.logic', () => {
  it.each(GIVE_AI_FEEDBACK_HANDLER_FIXTURES)(
    'handles $id',
    async ({ prompt, aspect, rating, reason, params }) => {
      const result = await handleGiveAiFeedbackLogic('biz-1', params, prompt);
      expect(result.action).toBe('give_ai_feedback');
      expect(result.details?.aspect).toBe(aspect);
      expect(result.details?.feedbackRating).toBe(rating);
      if (reason) {
        expect(result.details?.feedbackReason).toBe(reason);
        expect(result.details?.clientAction).toBe('submitAssistantFeedback');
        expect(result.summary).toBe(FEEDBACK_THANKS);
      } else if (rating === 'down') {
        expect(result.details?.showReasonChips).toBe(true);
        expect(result.details?.clientAction).toBe('openAssistantFeedback');
      }
      expect(result.details?.assistantFeedback).toBe(true);
    },
  );

  it('fails clarify when prompt does not match', async () => {
    const result = await handleGiveAiFeedbackLogic(
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
