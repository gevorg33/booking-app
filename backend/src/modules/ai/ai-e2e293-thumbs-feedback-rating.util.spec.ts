import {
  E2E293_CONTROL_CASES,
  E2E293_NEGATIVE_PROMPTS,
  E2E293_THUMBS_RATING_CASES,
} from './ai-e2e293-thumbs-feedback-rating.fixtures.js';
import { handleGiveAiFeedbackLogic } from './ai-give-ai-feedback.logic.js';
import {
  buildGiveAiFeedbackDetails,
  isGiveAiFeedbackPrompt,
  parseGiveAiFeedbackFromPrompt,
  parseGiveAiFeedbackRating,
  rescueGiveAiFeedbackIntent,
} from './ai-give-ai-feedback.util.js';

describe('e2e-bug.293: Thumbs up/down parse feedbackRating', () => {
  it.each(E2E293_THUMBS_RATING_CASES)(
    'parse $id',
    ({ prompt, expectedRating, expectedAspect, expectShowReasonChips }) => {
      expect(isGiveAiFeedbackPrompt(prompt)).toBe(true);
      expect(parseGiveAiFeedbackRating(prompt)).toBe(expectedRating);
      expect(parseGiveAiFeedbackFromPrompt(prompt)).toEqual({
        aspect: expectedAspect,
        rating: expectedRating,
      });
      expect(rescueGiveAiFeedbackIntent(prompt, 'unknown')).toEqual({
        action: 'give_ai_feedback',
        rescueReason: 'give_ai_feedback',
      });

      const details = buildGiveAiFeedbackDetails(
        { lastAssistantReply: 'Here are our services.' },
        { aspect: expectedAspect, rating: expectedRating },
      );
      if (expectShowReasonChips) {
        expect(details.showReasonChips).toBe(true);
        expect(details.clientAction).toBe('openAssistantFeedback');
      } else {
        expect(details.showReasonChips).toBeUndefined();
        expect(details.clientAction).toBe('submitAssistantFeedback');
      }
    },
  );

  it.each(E2E293_CONTROL_CASES)(
    'control $id',
    ({ prompt, expectedRating, expectedAspect }) => {
      expect(parseGiveAiFeedbackFromPrompt(prompt)).toEqual(
        expect.objectContaining({
          rating: expectedRating,
          aspect: expectedAspect,
        }),
      );
    },
  );

  it.each(E2E293_NEGATIVE_PROMPTS)('negative $id', ({ prompt }) => {
    expect(isGiveAiFeedbackPrompt(prompt)).toBe(false);
    expect(parseGiveAiFeedbackFromPrompt(prompt)).toBeNull();
  });

  it.each(E2E293_THUMBS_RATING_CASES)(
    'handler $id',
    async ({ prompt, expectedRating, expectShowReasonChips }) => {
      const result = await handleGiveAiFeedbackLogic(
        'biz',
        {
          lastAssistantReply: 'Slots open tomorrow.',
          lastAction: 'list_services',
        },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('give_ai_feedback');
      expect(result.details?.feedbackRating).toBe(expectedRating);
      if (expectShowReasonChips) {
        expect(result.details?.showReasonChips).toBe(true);
        expect(result.details?.clientAction).toBe('openAssistantFeedback');
      } else {
        expect(result.details?.clientAction).toBe('submitAssistantFeedback');
      }
    },
  );
});
