/**
 * e2e-bug.294 — hy/ru booking_help progress step titles must stay short
 * (EN-parity), not body-length humanize leftovers from e2e-bug.275.
 */

export type E2e294ShortTitleCase = {
  id: string;
  locale: 'en' | 'hy' | 'ru';
  /** Exact step-1 title expected after shortTitleKey / humanize */
  expectedStep1Title: string;
  /** Max words in any funnel step title (progress chrome scannability) */
  maxTitleWords: number;
};

export const E2E294_FUNNEL_SHORT_TITLE_CASES: readonly E2e294ShortTitleCase[] =
  [
    {
      id: 'ai-e2e294-en-step1-short',
      locale: 'en',
      expectedStep1Title: 'Pick a service',
      maxTitleWords: 4,
    },
    {
      id: 'ai-e2e294-hy-step1-short',
      locale: 'hy',
      expectedStep1Title: 'Ընտրեք ծառայություն',
      maxTitleWords: 4,
    },
    {
      id: 'ai-e2e294-ru-step1-short',
      locale: 'ru',
      expectedStep1Title: 'Выберите услугу',
      maxTitleWords: 4,
    },
  ] as const;

export const E2E294_HUMANIZE_CASES = [
  {
    id: 'humanize-en-from',
    title: 'Step 1',
    body: 'Pick a service from the public booking page.',
    expected: 'Pick a service',
  },
  {
    id: 'humanize-hy-hanrayin',
    title: 'Քայլ 1',
    body: 'Ընտրեք ծառայություն հանրային ամրագրման էջից։',
    expected: 'Ընտրեք ծառայություն',
  },
  {
    id: 'humanize-ru-na',
    title: 'Шаг 1',
    body: 'Выберите услугу на странице онлайн-записи.',
    expected: 'Выберите услугу',
  },
] as const;

export const E2E294_LIVE_CASES = [
  {
    id: 'live-en-how-to-book-short',
    locale: 'en' as const,
    prompt: 'How do I book an appointment?',
    summaryTitle: /Pick a service\s*$/u,
    forbidBodyLength: /public booking page|from the/i,
  },
  {
    id: 'live-hy-how-to-book-short',
    locale: 'hy' as const,
    prompt: 'How do I book an appointment?',
    summaryTitle: /Ընտրեք ծառայություն\s*$/u,
    forbidBodyLength: /հանրային|ամրագրման էջից/u,
  },
  {
    id: 'live-ru-how-to-book-short',
    locale: 'ru' as const,
    prompt: 'How do I book an appointment?',
    summaryTitle: /Выберите услугу\s*$/u,
    forbidBodyLength: /на странице|онлайн-записи/iu,
  },
  {
    id: 'live-hy-short-prompt',
    locale: 'hy' as const,
    prompt: 'Ինչպես ամրագրել',
    summaryTitle: /Ընտրեք ծառայություն\s*$/u,
    forbidBodyLength: /հանրային|ամրագրման էջից/u,
  },
  {
    id: 'live-ru-short-prompt',
    locale: 'ru' as const,
    prompt: 'Как записаться',
    summaryTitle: /Выберите услугу\s*$/u,
    forbidBodyLength: /на странице|онлайн-записи/iu,
  },
  {
    id: 'live-hy-walkthrough-short',
    locale: 'hy' as const,
    prompt: 'Walk me through booking step by step',
    summaryTitle: /Ընտրեք ծառայություն\s*$/u,
    forbidBodyLength: /հանրային|ամրագրման էջից/u,
  },
  {
    id: 'live-ru-walkthrough-short',
    locale: 'ru' as const,
    prompt: 'Walk me through booking step by step',
    summaryTitle: /Выберите услугу\s*$/u,
    forbidBodyLength: /на странице|онлайн-записи/iu,
  },
  {
    id: 'live-en-walkthrough-short',
    locale: 'en' as const,
    prompt: 'Walk me through booking step by step',
    summaryTitle: /Pick a service\s*$/u,
    forbidBodyLength: /public booking page/i,
  },
] as const;
