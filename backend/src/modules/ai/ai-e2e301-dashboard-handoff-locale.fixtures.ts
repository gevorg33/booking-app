/**
 * e2e-bug.301 — explain_dashboard_only_action summaries must localize
 * under HY/RU prompts (and explicit locale), not stay hardcoded EN.
 */

export type E2e301LocaleCase = {
  id: string;
  prompt: string;
  locale?: 'en' | 'hy' | 'ru';
  /** Expected localized action fragment in the summary. */
  expectActionFragment: string;
  /** Must not appear for non-EN summaries. */
  forbidEnglishFragments?: string[];
};

export const E2E301_LOCALIZED_SUMMARY_CASES: readonly E2e301LocaleCase[] = [
  {
    id: 'ai-e2e301-en-call',
    prompt: "Why can't I call the client?",
    locale: 'en',
    expectActionFragment: 'Tap phone to call client',
  },
  {
    id: 'ai-e2e301-hy-call-script',
    prompt: 'Ինչու չեմ կարող զանգահարել հաճախորդին',
    expectActionFragment: 'Հեռախոսով զանգել հաճախորդին',
    forbidEnglishFragments: [
      "isn't available from the mobile assistant",
      'Tap phone to call client',
      'Use the dashboard for this',
    ],
  },
  {
    id: 'ai-e2e301-hy-call-explicit-locale',
    prompt: "Why can't I call the client?",
    locale: 'hy',
    expectActionFragment: 'Հեռախոսով զանգել հաճախորդին',
    forbidEnglishFragments: [
      "isn't available from the mobile assistant",
      'Tap phone to call client',
    ],
  },
  {
    id: 'ai-e2e301-ru-call-script',
    prompt: 'Почему я не могу позвонить клиенту?',
    expectActionFragment: 'Позвонить клиенту',
    forbidEnglishFragments: [
      "isn't available from the mobile assistant",
      'Tap phone to call client',
      'Use the dashboard for this',
    ],
  },
  {
    id: 'ai-e2e301-ru-call-explicit-locale',
    prompt: "Why can't I call the client?",
    locale: 'ru',
    expectActionFragment: 'Позвонить клиенту',
    forbidEnglishFragments: [
      "isn't available from the mobile assistant",
      'Tap phone to call client',
    ],
  },
  {
    id: 'ai-e2e301-hy-templates',
    prompt: 'Ինչու չեմ կարող խմբագրել հաղորդագրության ձևանմուշները',
    expectActionFragment: 'պատրաստի հաղորդագրության ձևանմուշները',
    forbidEnglishFragments: ['Edit canned message templates'],
  },
  {
    id: 'ai-e2e301-hy-loyalty',
    prompt: 'Ինչու չեմ կարող կարգավորել հավատարմության միավորները',
    expectActionFragment: 'հավատարմության միավորները',
    forbidEnglishFragments: ['Adjust loyalty points'],
  },
  {
    id: 'ai-e2e301-hy-intake',
    prompt: 'Ինչու չեմ կարող բացել ամբողջական ընդունելության պատասխանները',
    expectActionFragment: 'ընդունելության պատասխանները',
    forbidEnglishFragments: ['Open full intake answers'],
  },
  {
    id: 'ai-e2e301-en-loyalty',
    prompt: 'Adjust loyalty points',
    locale: 'en',
    expectActionFragment: 'Adjust loyalty points',
  },
  {
    id: 'ai-e2e301-ru-loyalty-locale',
    prompt: 'Adjust loyalty points',
    locale: 'ru',
    expectActionFragment: 'Изменить баллы лояльности',
    forbidEnglishFragments: ['Adjust loyalty points'],
  },
];

export const E2E301_FALLBACK_CASES = [
  {
    id: 'ai-e2e301-fallback-hy',
    locale: 'hy' as const,
    expectFragment: 'վահանակից',
    forbid: 'That feature is managed from the dashboard',
  },
  {
    id: 'ai-e2e301-fallback-ru',
    locale: 'ru' as const,
    expectFragment: 'панели',
    forbid: 'That feature is managed from the dashboard',
  },
  {
    id: 'ai-e2e301-fallback-en',
    locale: 'en' as const,
    expectFragment: 'dashboard',
    forbid: 'վահանակ',
  },
] as const;
