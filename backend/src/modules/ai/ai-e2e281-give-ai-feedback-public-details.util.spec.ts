import { E2E281_PUBLIC_DETAIL_CASES } from './ai-e2e281-give-ai-feedback-public-details.fixtures.js';
import { buildGiveAiFeedbackDetails } from './ai-give-ai-feedback.util.js';
import {
  commandResultToPublicAssistantResult,
  publicAssistantResultToCommandResult,
} from './customer-ai-command.util.js';

describe('e2e-bug.281: public give_ai_feedback preserves chip/label details', () => {
  it.each(E2E281_PUBLIC_DETAIL_CASES)(
    'commandResultToPublicAssistantResult $id',
    ({
      details,
      expectKeys,
      forbidKeys,
      expectShowReasonChips,
      expectFeedbackRating,
      expectClientAction,
      expectReasonOptionCount,
    }) => {
      const mapped = commandResultToPublicAssistantResult({
        success: true,
        action: 'give_ai_feedback',
        summary: 'feedback',
        details,
      });
      expect(mapped.details).toBeDefined();
      for (const key of expectKeys) {
        expect(mapped.details).toHaveProperty(key);
      }
      for (const key of forbidKeys || []) {
        expect(mapped.details).not.toHaveProperty(key);
      }
      if (expectShowReasonChips != null) {
        expect(mapped.details?.showReasonChips).toBe(expectShowReasonChips);
      }
      if (expectFeedbackRating) {
        expect(mapped.details?.feedbackRating).toBe(expectFeedbackRating);
      }
      if (expectClientAction) {
        expect(mapped.details?.clientAction).toBe(expectClientAction);
      }
      if (expectReasonOptionCount != null) {
        expect(
          Array.isArray(mapped.details?.feedbackReasonOptions)
            ? mapped.details!.feedbackReasonOptions
            : [],
        ).toHaveLength(expectReasonOptionCount);
      }
    },
  );

  it('buildGiveAiFeedbackDetails → public convert keeps showReasonChips', () => {
    const details = buildGiveAiFeedbackDetails(
      {
        lastAssistantReply: 'Booked for Tuesday.',
        lastAction: 'create_booking',
      },
      { aspect: 'rate_answer', rating: 'down' },
    );
    expect(details.showReasonChips).toBe(true);

    const mapped = commandResultToPublicAssistantResult({
      success: true,
      action: 'give_ai_feedback',
      summary: 'Not helpful — choose a reason so we can improve the assistant.',
      details,
    });
    expect(mapped.details?.showReasonChips).toBe(true);
    expect(mapped.details?.aspect).toBe('rate_answer');
    expect(mapped.details?.feedbackUpLabel).toBe('Helpful');
    expect(mapped.details?.feedbackDownLabel).toBe('Not helpful');
    expect(mapped.details?.assistantFeedback).toBe(true);
    expect(mapped.details?.clientAction).toBe('openAssistantFeedback');
    expect(Array.isArray(mapped.details?.feedbackReasonOptions)).toBe(true);
    expect(
      (mapped.details?.feedbackReasonOptions as unknown[]).length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('customer↔public round-trip keeps feedback chip fields', () => {
    const details = buildGiveAiFeedbackDetails(
      { lastAssistantReply: 'Slots open tomorrow.' },
      { aspect: 'rate_answer', rating: 'down' },
    );
    const publicResult = commandResultToPublicAssistantResult({
      success: true,
      action: 'give_ai_feedback',
      summary: 'Not helpful — choose a reason so we can improve the assistant.',
      details,
    });
    const back = commandResultToPublicAssistantResult(
      publicAssistantResultToCommandResult(publicResult),
    );
    expect(back.details?.showReasonChips).toBe(true);
    expect(back.details?.feedbackReasonOptions).toEqual(
      publicResult.details?.feedbackReasonOptions,
    );
    expect(back.details?.feedbackUpLabel).toBe('Helpful');
  });
});
