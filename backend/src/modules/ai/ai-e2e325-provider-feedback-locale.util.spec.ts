import { E2E325_PROVIDER_FEEDBACK_LOCALE_CASES } from './ai-e2e325-provider-feedback-locale.fixtures.js';
import {
  buildGiveProviderAiFeedbackDetails,
  buildGiveProviderAiFeedbackSummary,
  handleGiveProviderAiFeedback,
} from './ai-provider-give-ai-feedback.util.js';

describe('e2e-bug.325 give_provider_ai_feedback localizes under locale:hy|ru', () => {
  it.each(E2E325_PROVIDER_FEEDBACK_LOCALE_CASES)(
    'buildGiveProviderAiFeedbackDetails localizes labels for $id',
    ({ locale, expectUpLabel, expectDownLabel, expectReasonWrongClient }) => {
      const details = buildGiveProviderAiFeedbackDetails(
        {},
        { aspect: 'negative', rating: 'down' },
        locale,
      );
      expect(details.feedbackUpLabel).toBe(expectUpLabel);
      expect(details.feedbackDownLabel).toBe(expectDownLabel);
      const reasonOptions = details.feedbackReasonOptions as Array<{
        id: string;
        label: string;
      }>;
      expect(reasonOptions.find((o) => o.id === 'wrong_client')?.label).toBe(
        expectReasonWrongClient,
      );
    },
  );

  it.each(E2E325_PROVIDER_FEEDBACK_LOCALE_CASES)(
    'buildGiveProviderAiFeedbackSummary localizes the thanks message for $id',
    ({ locale, expectThanks }) => {
      expect(
        buildGiveProviderAiFeedbackSummary('up', undefined, false, locale),
      ).toBe(expectThanks);
    },
  );

  it.each(E2E325_PROVIDER_FEEDBACK_LOCALE_CASES)(
    'handleGiveProviderAiFeedback returns a localized summary for $id (positive)',
    ({ locale, expectThanks }) => {
      const result = handleGiveProviderAiFeedback(
        { feedbackRating: 'up' },
        'that was helpful',
        locale,
      );
      expect(result.success).toBe(true);
      expect(result.summary).toBe(expectThanks);
    },
  );

  it.each(E2E325_PROVIDER_FEEDBACK_LOCALE_CASES)(
    'handleGiveProviderAiFeedback returns a localized clarify summary for $id (unrecognized prompt)',
    ({ locale }) => {
      const result = handleGiveProviderAiFeedback({}, 'xyz nonsense', locale);
      expect(result.success).toBe(false);
      // Must not be the raw EN fallback string when a non-EN locale was requested.
      expect(result.summary).not.toBe(
        'Say whether the last answer was helpful or what was wrong (e.g. "Wrong client picked" or "That wasn\'t my intent").',
      );
    },
  );

  it('defaults to English when no locale is provided (regression guard)', () => {
    const details = buildGiveProviderAiFeedbackDetails(
      {},
      { aspect: 'negative', rating: 'down' },
    );
    expect(details.feedbackUpLabel).toBe('Helpful');
    expect(details.feedbackDownLabel).toBe('Not helpful');
    expect(buildGiveProviderAiFeedbackSummary('up', undefined, false)).toBe(
      'Thanks — this helps improve the provider assistant.',
    );
  });
});
