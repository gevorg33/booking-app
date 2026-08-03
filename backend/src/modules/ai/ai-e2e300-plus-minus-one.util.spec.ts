import {
  E2E300_CONTROL_CASES,
  E2E300_NEGATIVE_PROMPTS,
  E2E300_PLUS_MINUS_CASES,
} from './ai-e2e300-plus-minus-one.fixtures.js';
import { handleGiveAiFeedbackLogic } from './ai-give-ai-feedback.logic.js';
import {
  isGiveAiFeedbackPrompt,
  isMinusOneFeedbackPrompt,
  isPlusOneFeedbackPrompt,
  parseGiveAiFeedbackFromPrompt,
  parseGiveAiFeedbackRating,
  rescueGiveAiFeedbackIntent,
} from './ai-give-ai-feedback.util.js';
import {
  isGiveProviderAiFeedbackPrompt,
  parseGiveProviderAiFeedbackFromPrompt,
  rescueGiveProviderAiFeedbackIntent,
} from './ai-provider-give-ai-feedback.util.js';

describe('e2e-bug.300: +1 / -1 rate as give_ai_feedback', () => {
  it.each(E2E300_PLUS_MINUS_CASES)(
    'parse $id',
    ({ prompt, expectedRating, expectedAspect, expectShowReasonChips }) => {
      expect(isGiveAiFeedbackPrompt(prompt)).toBe(true);
      if (expectedRating === 'up') {
        expect(isPlusOneFeedbackPrompt(prompt)).toBe(true);
        expect(isMinusOneFeedbackPrompt(prompt)).toBe(false);
      } else {
        expect(isMinusOneFeedbackPrompt(prompt)).toBe(true);
        expect(isPlusOneFeedbackPrompt(prompt)).toBe(false);
      }
      expect(parseGiveAiFeedbackRating(prompt)).toBe(expectedRating);
      expect(parseGiveAiFeedbackFromPrompt(prompt)).toEqual({
        aspect: expectedAspect,
        rating: expectedRating,
      });
      expect(rescueGiveAiFeedbackIntent(prompt, 'unknown')).toEqual({
        action: 'give_ai_feedback',
        rescueReason: 'give_ai_feedback',
      });
      if (expectShowReasonChips) {
        expect(expectedRating).toBe('down');
      }
    },
  );

  it.each(E2E300_CONTROL_CASES)(
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

  it.each(E2E300_NEGATIVE_PROMPTS)('negative $id', ({ prompt }) => {
    expect(isPlusOneFeedbackPrompt(prompt)).toBe(false);
    expect(isMinusOneFeedbackPrompt(prompt)).toBe(false);
    expect(isGiveAiFeedbackPrompt(prompt)).toBe(false);
    expect(parseGiveAiFeedbackFromPrompt(prompt)).toBeNull();
    expect(rescueGiveAiFeedbackIntent(prompt, 'unknown')).toBeNull();
  });

  it.each(E2E300_PLUS_MINUS_CASES)(
    'handler $id',
    async ({ prompt, expectedRating, expectShowReasonChips }) => {
      const result = await handleGiveAiFeedbackLogic(
        'biz',
        { lastAssistantReply: 'Slots open tomorrow.', lastAction: 'list_services' },
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

  it.each([
    { id: 'provider-plus-one', prompt: '+1', rating: 'up' as const },
    { id: 'provider-minus-one', prompt: '-1', rating: 'down' as const },
  ])('provider mirror $id', ({ prompt, rating }) => {
    expect(isGiveProviderAiFeedbackPrompt(prompt)).toBe(true);
    expect(parseGiveProviderAiFeedbackFromPrompt(prompt)).toEqual(
      expect.objectContaining({ rating }),
    );
    expect(rescueGiveProviderAiFeedbackIntent(prompt, 'unknown')?.action).toBe(
      'give_provider_ai_feedback',
    );
  });
});
