/**
 * e2e-bug.299 — public/customer give_ai_feedback chip + summary labels
 * must localize under locale:hy|ru (not stay hardcoded EN).
 */
export type E2e299LocaleCase = {
  id: string;
  locale: 'en' | 'hy' | 'ru';
  prompt: string;
  rating: 'up' | 'down';
  reason?: string;
  expectShowReasonChips?: boolean;
  /** Expected EN fragment that must NOT appear in hy/ru labels/summary. */
  forbidEnglishFragments?: string[];
};

/** Unit: builder/handler labels per locale. */
export const E2E299_LOCALIZED_LABEL_CASES: E2e299LocaleCase[] = [
  {
    id: 'ai-e2e299-en-not-helpful-chips',
    locale: 'en',
    prompt: 'Not helpful',
    rating: 'down',
    expectShowReasonChips: true,
  },
  {
    id: 'ai-e2e299-en-that-was-helpful',
    locale: 'en',
    prompt: 'That was helpful',
    rating: 'up',
  },
  {
    id: 'ai-e2e299-en-wrong-date',
    locale: 'en',
    prompt: 'Wrong date picked',
    rating: 'down',
    reason: 'wrong_date',
  },
  {
    id: 'ai-e2e299-hy-not-helpful-chips',
    locale: 'hy',
    prompt: 'Not helpful',
    rating: 'down',
    expectShowReasonChips: true,
    forbidEnglishFragments: ['Helpful', 'Not helpful', 'Wrong date', 'Skip'],
  },
  {
    id: 'ai-e2e299-hy-that-was-helpful',
    locale: 'hy',
    prompt: 'That was helpful',
    rating: 'up',
    forbidEnglishFragments: ['Helpful', 'Thanks'],
  },
  {
    id: 'ai-e2e299-hy-wrong-date',
    locale: 'hy',
    prompt: 'Wrong date picked',
    rating: 'down',
    reason: 'wrong_date',
    forbidEnglishFragments: ['Wrong date', 'Thanks'],
  },
  {
    id: 'ai-e2e299-ru-not-helpful-chips',
    locale: 'ru',
    prompt: 'Not helpful',
    rating: 'down',
    expectShowReasonChips: true,
    forbidEnglishFragments: ['Helpful', 'Not helpful', 'Wrong date', 'Skip'],
  },
  {
    id: 'ai-e2e299-ru-that-was-helpful',
    locale: 'ru',
    prompt: 'That was helpful',
    rating: 'up',
    forbidEnglishFragments: ['Helpful', 'Thanks'],
  },
  {
    id: 'ai-e2e299-ru-wrong-date',
    locale: 'ru',
    prompt: 'Wrong date picked',
    rating: 'down',
    reason: 'wrong_date',
    forbidEnglishFragments: ['Wrong date', 'Thanks'],
  },
  {
    id: 'ai-e2e299-hy-native-that-was-wrong',
    locale: 'hy',
    prompt: 'Սխալ էր',
    rating: 'down',
    expectShowReasonChips: true,
    forbidEnglishFragments: ['Not helpful', 'Helpful'],
  },
  {
    id: 'ai-e2e299-ru-native-not-helpful',
    locale: 'ru',
    prompt: 'Не полезно',
    rating: 'down',
    expectShowReasonChips: true,
    forbidEnglishFragments: ['Not helpful', 'Helpful'],
  },
  {
    id: 'ai-e2e299-hy-clarify-book',
    locale: 'hy',
    prompt: 'Book a haircut tomorrow',
    rating: 'down', // unused — clarify path
    forbidEnglishFragments: ['Say whether', 'Say if'],
  },
];

/** Expected localized chip strings (assert exact match). */
export const E2E299_EXPECTED_LABELS = {
  en: {
    feedbackUpLabel: 'Helpful',
    feedbackDownLabel: 'Not helpful',
    feedbackThanks: 'Thanks — this helps improve the assistant.',
    feedbackReasonSkipLabel: 'Skip',
    feedbackDownChooseReason:
      'Not helpful — choose a reason so we can improve the assistant.',
    wrongDate: 'Wrong date',
  },
  hy: {
    feedbackUpLabel: 'Օգտակար',
    feedbackDownLabel: 'Օգտակար չէ',
    feedbackThanks: 'Շնորհակալություն — սա օգնում է բարելավել օգնականին։',
    feedbackReasonSkipLabel: 'Բաց թողնել',
    feedbackDownChooseReason:
      'Օգտակար չէ — ընտրեք պատճառ, որպեսզի կարողանանք բարելավել օգնականին։',
    wrongDate: 'Սխալ ամսաթիվ',
  },
  ru: {
    feedbackUpLabel: 'Полезно',
    feedbackDownLabel: 'Не полезно',
    feedbackThanks: 'Спасибо — это помогает улучшить помощника.',
    feedbackReasonSkipLabel: 'Пропустить',
    feedbackDownChooseReason:
      'Не полезно — выберите причину, чтобы мы могли улучшить помощника.',
    wrongDate: 'Неверная дата',
  },
} as const;
