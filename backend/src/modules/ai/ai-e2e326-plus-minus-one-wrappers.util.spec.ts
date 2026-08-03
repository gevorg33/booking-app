import {
  E2E326_NEGATIVE_PROMPTS,
  E2E326_WRAPPER_CASES,
} from './ai-e2e326-plus-minus-one-wrappers.fixtures.js';
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

describe('e2e-bug.326: "+1 thanks" / "thanks +1" wrapper phrasing rates as give_ai_feedback', () => {
  it.each(E2E326_WRAPPER_CASES)(
    'parse $id ("$prompt")',
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

  it.each(E2E326_NEGATIVE_PROMPTS)(
    'negative $id ("$prompt") does not steal booking math',
    ({ prompt }) => {
      expect(isPlusOneFeedbackPrompt(prompt)).toBe(false);
      expect(isMinusOneFeedbackPrompt(prompt)).toBe(false);
    },
  );

  it.each(E2E326_WRAPPER_CASES)(
    'handler $id returns give_ai_feedback for "$prompt"',
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
    { id: 'provider-plus-one-thanks', prompt: '+1 thanks', rating: 'up' as const },
    { id: 'provider-thanks-minus-one', prompt: 'thanks -1', rating: 'down' as const },
  ])('provider mirror $id ("$prompt")', ({ prompt, rating }) => {
    expect(isGiveProviderAiFeedbackPrompt(prompt)).toBe(true);
    expect(parseGiveProviderAiFeedbackFromPrompt(prompt)).toEqual(
      expect.objectContaining({ rating }),
    );
    expect(rescueGiveProviderAiFeedbackIntent(prompt, 'unknown')?.action).toBe(
      'give_provider_ai_feedback',
    );
  });

  // e2e-bug.300 non-regression — bare +1/-1 and existing booking-math
  // negatives must remain unaffected by the e2e-bug.326 wrapper widening.
  it('does not regress bare +1 / -1 (e2e-bug.300)', () => {
    expect(isPlusOneFeedbackPrompt('+1')).toBe(true);
    expect(isMinusOneFeedbackPrompt('-1')).toBe(true);
    expect(isPlusOneFeedbackPrompt('party of +1')).toBe(false);
    expect(isPlusOneFeedbackPrompt('1+1')).toBe(false);
    expect(isPlusOneFeedbackPrompt('+10')).toBe(false);
  });
});
