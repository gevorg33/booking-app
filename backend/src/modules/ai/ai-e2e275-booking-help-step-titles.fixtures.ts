/**
 * e2e-bug.275 — hy/ru booking_help progress summaries must use real step
 * titles (not placeholder "Քայլ 1" / "Шаг 1").
 */

export type E2e275BookingHelpLocaleCase = {
  id: string;
  locale: 'en' | 'hy' | 'ru';
  prompt: string;
  /** Chrome prefix for step 1 of 3 */
  progressPrefix: RegExp;
  /** Must not appear as the title after the colon */
  forbiddenTitle: RegExp;
};

export const E2E275_BOOKING_HELP_LOCALE_CASES: readonly E2e275BookingHelpLocaleCase[] =
  [
    {
      id: 'ai-e2e275-en-how-to-book',
      locale: 'en',
      prompt: 'How do I book an appointment?',
      progressPrefix: /^Step 1 of 3:/,
      forbiddenTitle: /:\s*Step\s*1\s*$/i,
    },
    {
      id: 'ai-e2e275-hy-how-to-book',
      locale: 'hy',
      prompt: 'How do I book an appointment?',
      progressPrefix: /^Քայլ 1\/3:/,
      forbiddenTitle: /:\s*Քայլ\s*1\s*$/u,
    },
    {
      id: 'ai-e2e275-ru-how-to-book',
      locale: 'ru',
      prompt: 'How do I book an appointment?',
      progressPrefix: /^Шаг 1 из 3:/,
      forbiddenTitle: /:\s*Шаг\s*1\s*$/u,
    },
    {
      id: 'ai-e2e275-hy-short',
      locale: 'hy',
      prompt: 'Ինչպես ամրագրել',
      progressPrefix: /^Քայլ 1\/3:/,
      forbiddenTitle: /:\s*Քայլ\s*1\s*$/u,
    },
    {
      id: 'ai-e2e275-ru-short',
      locale: 'ru',
      prompt: 'Как записаться',
      progressPrefix: /^Шаг 1 из 3:/,
      forbiddenTitle: /:\s*Шаг\s*1\s*$/u,
    },
    {
      id: 'ai-e2e275-hy-walkthrough',
      locale: 'hy',
      prompt: 'Walk me through booking step by step',
      progressPrefix: /^Քայլ 1\/3:/,
      forbiddenTitle: /:\s*Քայլ\s*1\s*$/u,
    },
    {
      id: 'ai-e2e275-ru-walkthrough',
      locale: 'ru',
      prompt: 'Walk me through booking step by step',
      progressPrefix: /^Шаг 1 из 3:/,
      forbiddenTitle: /:\s*Шаг\s*1\s*$/u,
    },
  ] as const;
