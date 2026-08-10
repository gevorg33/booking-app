import {
  E2E299_EXPECTED_LABELS,
  E2E299_LOCALIZED_LABEL_CASES,
} from './ai-e2e299-give-ai-feedback-locale.fixtures.js';
import { handleGiveAiFeedbackLogic } from './ai-give-ai-feedback.logic.js';
import {
  buildGiveAiFeedbackDetails,
  buildGiveAiFeedbackSummary,
  localizedFeedbackDownLabel,
  localizedFeedbackReasonOptions,
  localizedFeedbackReasonSkipLabel,
  localizedFeedbackThanks,
  localizedFeedbackUpLabel,
} from './ai-give-ai-feedback.util.js';
import { commandResultToPublicAssistantResult } from './customer-ai-command.util.js';

describe('e2e-bug.299: give_ai_feedback chip/summary labels localize', () => {
  it.each(['en', 'hy', 'ru'] as const)(
    'localized helpers match expected for %s',
    (locale) => {
      const expected = E2E299_EXPECTED_LABELS[locale];
      expect(localizedFeedbackUpLabel(locale)).toBe(expected.feedbackUpLabel);
      expect(localizedFeedbackDownLabel(locale)).toBe(
        expected.feedbackDownLabel,
      );
      expect(localizedFeedbackThanks(locale)).toBe(expected.feedbackThanks);
      expect(localizedFeedbackReasonSkipLabel(locale)).toBe(
        expected.feedbackReasonSkipLabel,
      );
      const options = localizedFeedbackReasonOptions(locale);
      expect(options.find((o) => o.id === 'wrong_date')?.label).toBe(
        expected.wrongDate,
      );
      expect(buildGiveAiFeedbackSummary('down', undefined, true, locale)).toBe(
        expected.feedbackDownChooseReason,
      );
    },
  );

  it.each(
    E2E299_LOCALIZED_LABEL_CASES.filter(
      (c) => c.id !== 'ai-e2e299-hy-clarify-book',
    ),
  )(
    'details+handler $id',
    async ({
      locale,
      prompt,
      rating,
      reason,
      expectShowReasonChips,
      forbidEnglishFragments,
    }) => {
      const expected = E2E299_EXPECTED_LABELS[locale];
      const details = buildGiveAiFeedbackDetails(
        { locale, lastAssistantReply: 'Seed reply' },
        {
          aspect: 'rate_answer',
          rating,
          ...(reason ? { reason: reason as 'wrong_date' } : {}),
        },
        locale,
      );

      expect(details.feedbackUpLabel).toBe(expected.feedbackUpLabel);
      expect(details.feedbackDownLabel).toBe(expected.feedbackDownLabel);
      expect(details.feedbackThanks).toBe(expected.feedbackThanks);
      expect(details.feedbackReasonSkipLabel).toBe(
        expected.feedbackReasonSkipLabel,
      );
      const options = details.feedbackReasonOptions as Array<{
        id: string;
        label: string;
      }>;
      expect(options.find((o) => o.id === 'wrong_date')?.label).toBe(
        expected.wrongDate,
      );

      if (expectShowReasonChips) {
        expect(details.showReasonChips).toBe(true);
      }

      const result = await handleGiveAiFeedbackLogic(
        'biz-1',
        { locale, lastAssistantReply: 'Seed reply' },
        prompt,
      );
      expect(result.action).toBe('give_ai_feedback');
      expect(result.details?.feedbackUpLabel).toBe(expected.feedbackUpLabel);
      expect(result.details?.feedbackDownLabel).toBe(
        expected.feedbackDownLabel,
      );

      if (expectShowReasonChips) {
        expect(result.summary).toBe(expected.feedbackDownChooseReason);
        expect(result.details?.showReasonChips).toBe(true);
      } else if (rating === 'up' || reason) {
        expect(result.summary).toBe(expected.feedbackThanks);
      }

      const mapped = commandResultToPublicAssistantResult(result);
      expect(mapped.details?.feedbackUpLabel).toBe(expected.feedbackUpLabel);
      expect(mapped.details?.feedbackDownLabel).toBe(
        expected.feedbackDownLabel,
      );

      if (forbidEnglishFragments?.length && locale !== 'en') {
        const haystack = [
          String(result.summary ?? ''),
          String(result.details?.feedbackUpLabel ?? ''),
          String(result.details?.feedbackDownLabel ?? ''),
          String(result.details?.feedbackThanks ?? ''),
          String(result.details?.feedbackReasonSkipLabel ?? ''),
          ...options.map((o) => o.label),
        ].join(' | ');
        for (const frag of forbidEnglishFragments) {
          expect(haystack).not.toContain(frag);
        }
      }
    },
  );

  it('clarify path localizes under hy (ai-e2e299-hy-clarify-book)', async () => {
    const result = await handleGiveAiFeedbackLogic(
      'biz-1',
      { locale: 'hy' },
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.summary).not.toMatch(/Say whether|Say if/i);
    expect(result.summary).toContain('օգտակար');
  });

  it('hy/ru labels differ from en', () => {
    expect(localizedFeedbackUpLabel('hy')).not.toBe(
      localizedFeedbackUpLabel('en'),
    );
    expect(localizedFeedbackUpLabel('ru')).not.toBe(
      localizedFeedbackUpLabel('en'),
    );
    expect(localizedFeedbackDownLabel('hy')).not.toBe(
      localizedFeedbackDownLabel('en'),
    );
    expect(buildGiveAiFeedbackSummary('down', undefined, true, 'ru')).not.toBe(
      buildGiveAiFeedbackSummary('down', undefined, true, 'en'),
    );
  });
});
