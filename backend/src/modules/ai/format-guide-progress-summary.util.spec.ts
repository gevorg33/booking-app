import { describe, expect, it } from '@jest/globals';
import {
  formatGuideProgressSummary,
  formatGuideStepOfLabel,
} from './format-guide-progress-summary.util.js';

describe('format-guide-progress-summary.util (e2e-bug.219)', () => {
  it.each([
    {
      id: 'en',
      locale: 'en' as const,
      expected: 'Step 1 of 3',
    },
    {
      id: 'hy',
      locale: 'hy' as const,
      expected: 'Քայլ 1/3',
    },
    {
      id: 'ru',
      locale: 'ru' as const,
      expected: 'Шаг 1 из 3',
    },
  ])('formatGuideStepOfLabel: $id', ({ locale, expected }) => {
    expect(formatGuideStepOfLabel(1, 3, locale)).toBe(expected);
    if (locale !== 'en') {
      expect(formatGuideStepOfLabel(1, 3, locale)).not.toMatch(/^Step /);
    }
  });

  it.each([
    {
      // e2e-bug.275 — real localized titles (not placeholder Քայլ 1 / Шаг 1)
      id: 'hy-booking-help',
      locale: 'hy' as const,
      title: 'Ընտրեք ծառայություն',
      expected: 'Քայլ 1/3: Ընտրեք ծառայություն',
    },
    {
      id: 'ru-booking-help',
      locale: 'ru' as const,
      title: 'Выберите услугу',
      expected: 'Шаг 1 из 3: Выберите услугу',
    },
    {
      id: 'en-booking-help',
      locale: 'en' as const,
      title: 'Select Service',
      expected: 'Step 1 of 3: Select Service',
    },
    {
      id: 'hy-explain-app-feature',
      locale: 'hy' as const,
      title: 'Օրինակներ',
      current: 1,
      total: 1,
      expected: 'Քայլ 1/1: Օրինակներ',
    },
  ])(
    'formatGuideProgressSummary never keeps English Step chrome: $id',
    ({ locale, title, expected, current = 1, total = 3 }) => {
      const summary = formatGuideProgressSummary(
        current,
        total,
        title,
        locale,
      );
      expect(summary).toBe(expected);
      if (locale !== 'en') {
        expect(summary).not.toMatch(/Step \d+ of \d+/i);
      }
    },
  );

  it('uses localized fallback title when step title missing', () => {
    expect(formatGuideProgressSummary(2, 4, '', 'hy')).toBe(
      'Քայլ 2/4: Ուղեցույցի քայլ',
    );
    expect(formatGuideProgressSummary(2, 4, null, 'ru')).toBe(
      'Шаг 2 из 4: Шаг гида',
    );
    expect(formatGuideProgressSummary(2, 4, undefined, 'en')).toBe(
      'Step 2 of 4: Guide step',
    );
  });
});
