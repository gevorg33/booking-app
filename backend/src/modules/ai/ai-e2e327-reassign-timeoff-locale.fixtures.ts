/**
 * e2e-bug.327 — explain_reassign_limit / explain_time_off_approval summaries
 * must localize under HY/RU prompts (and explicit locale), not stay
 * hardcoded EN. Residual from e2e-bug.301, which only localized
 * explain_dashboard_only_action.
 */

export type E2e327LocaleCase = {
  id: string;
  prompt: string;
  locale?: 'en' | 'hy' | 'ru';
  /** Expected localized fragment in the summary. */
  expectFragment: string;
  /** Must not appear for non-EN summaries. */
  forbidEnglishFragments?: string[];
};

export const E2E327_REASSIGN_LIMIT_CASES: readonly E2e327LocaleCase[] = [
  {
    id: 'ai-e2e327-en-reassign',
    prompt: "Why can't AI reassign multi-service?",
    locale: 'en',
    expectFragment: 'Reassign button',
  },
  {
    id: 'ai-e2e327-hy-reassign-script',
    prompt: 'Ինչու չեմ կարող վերանշանակել բազմածառայության ամրագրումը',
    expectFragment: 'Վերանշանակել',
    forbidEnglishFragments: [
      'Same-day reassignment uses the dedicated mobile API',
      'Reassign button',
    ],
  },
  {
    id: 'ai-e2e327-hy-reassign-explicit-locale',
    prompt: "Why can't AI reassign multi-service?",
    locale: 'hy',
    expectFragment: 'Վերանշանակել',
    forbidEnglishFragments: ['Same-day reassignment uses the dedicated mobile API'],
  },
  {
    id: 'ai-e2e327-ru-reassign-script',
    prompt: 'Почему нельзя переназначить мультиуслугу?',
    expectFragment: 'Переназначить',
    forbidEnglishFragments: [
      'Same-day reassignment uses the dedicated mobile API',
      'Reassign button',
    ],
  },
  {
    id: 'ai-e2e327-ru-reassign-explicit-locale',
    prompt: "Why can't AI reassign multi-service?",
    locale: 'ru',
    expectFragment: 'Переназначить',
    forbidEnglishFragments: ['Same-day reassignment uses the dedicated mobile API'],
  },
];

export const E2E327_TIME_OFF_APPROVAL_CASES: readonly E2e327LocaleCase[] = [
  {
    id: 'ai-e2e327-en-time-off',
    prompt: 'Who approves my time off?',
    locale: 'en',
    expectFragment: 'manager approves',
  },
  {
    id: 'ai-e2e327-hy-time-off-script',
    prompt: 'Ով է հաստատում իմ արձակուրդը',
    expectFragment: 'մենեջերը',
    forbidEnglishFragments: ['Your manager approves or denies time-off requests'],
  },
  {
    id: 'ai-e2e327-hy-time-off-explicit-locale',
    prompt: 'Who approves my time off?',
    locale: 'hy',
    expectFragment: 'մենեջերը',
    forbidEnglishFragments: ['Your manager approves or denies time-off requests'],
  },
  {
    id: 'ai-e2e327-ru-time-off-script',
    prompt: 'Кто одобряет мой отпуск?',
    expectFragment: 'менеджер',
    forbidEnglishFragments: ['Your manager approves or denies time-off requests'],
  },
  {
    id: 'ai-e2e327-ru-time-off-explicit-locale',
    prompt: 'Who approves my time off?',
    locale: 'ru',
    expectFragment: 'менеджер',
    forbidEnglishFragments: ['Your manager approves or denies time-off requests'],
  },
];
