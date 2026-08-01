/**
 * e2e-bug.316 — high-traffic guide playbooks must ship shortTitleKey
 * (+ stepNTitle catalog) so HY/RU progress chrome stays short (EN-parity),
 * not body-length humanize leftovers. Residual of e2e-bug.294.
 */

export type E2e316PlaybookShortTitleCase = {
  id: string;
  topicId: string;
  locale: 'en' | 'hy' | 'ru';
  /** Exact step-1 title after shortTitleKey resolution */
  expectedStep1Title: string;
  /** Max words in any step title (progress chrome scannability) */
  maxTitleWords: number;
  /** Body fragments that must not appear in resolved titles */
  forbidTitleFragment: RegExp;
};

export const E2E316_HIGH_TRAFFIC_TOPIC_IDS = [
  'consumer-booking-flow',
  'consumer-packages-gift-cards',
  'public-booking-professionals',
  'public-booking-services',
  'public-checkout',
] as const;

const STEP1_BY_TOPIC: Record<
  (typeof E2E316_HIGH_TRAFFIC_TOPIC_IDS)[number],
  Record<'en' | 'hy' | 'ru', string>
> = {
  'consumer-booking-flow': {
    en: 'Pick a professional',
    hy: 'Ընտրեք մասնագետ',
    ru: 'Выберите специалиста',
  },
  'consumer-packages-gift-cards': {
    en: 'Open Packages',
    hy: 'Բացեք փաթեթներ',
    ru: 'Откройте пакеты',
  },
  'public-booking-professionals': {
    en: 'Browse professionals',
    hy: 'Դիտեք մասնագետներ',
    ru: 'Просмотрите специалистов',
  },
  'public-booking-services': {
    en: 'Open Services',
    hy: 'Բացեք ծառայություններ',
    ru: 'Откройте услуги',
  },
  'public-checkout': {
    en: 'Review details',
    hy: 'Ստուգեք մանրամասները',
    ru: 'Проверьте детали',
  },
};

const FORBID_BY_TOPIC: Record<
  (typeof E2E316_HIGH_TRAFFIC_TOPIC_IDS)[number],
  RegExp
> = {
  'consumer-booking-flow': /Any available|add-ons|calendar|confirmation/iu,
  'consumer-packages-gift-cards': /Services or Account|expiry|next booking/iu,
  'public-booking-professionals': /bios or ratings|open times|toward checkout/iu,
  'public-booking-services': /from the menu|for each service|continue to checkout/iu,
  'public-checkout': /cancellation policy|prepayment is required|email or SMS/iu,
};

export const E2E316_PLAYBOOK_SHORT_TITLE_CASES: readonly E2e316PlaybookShortTitleCase[] =
  E2E316_HIGH_TRAFFIC_TOPIC_IDS.flatMap((topicId) =>
    (['en', 'hy', 'ru'] as const).map((locale) => ({
      id: `ai-e2e316-${topicId}-${locale}-step1-short`,
      topicId,
      locale,
      expectedStep1Title: STEP1_BY_TOPIC[topicId][locale],
      maxTitleWords: 4,
      forbidTitleFragment: FORBID_BY_TOPIC[topicId],
    })),
  );

/** Live public-assistant probes (screen-scoped booking_help / page help). */
export const E2E316_LIVE_PUBLIC_CASES = [
  {
    id: 'live-en-professionals-short',
    locale: 'en' as const,
    screen: '/book/professionals',
    prompt: 'How do I book an appointment?',
    topicId: 'public-booking-professionals',
    summaryTitle: /Browse professionals\s*$/u,
    forbidBodyLength: /bios or ratings|Professionals page/iu,
  },
  {
    id: 'live-hy-professionals-short',
    locale: 'hy' as const,
    screen: '/book/professionals',
    prompt: 'How do I book an appointment?',
    topicId: 'public-booking-professionals',
    summaryTitle: /Դիտեք մասնագետներ\s*$/u,
    forbidBodyLength: /վարկանիշ|բիոն/u,
  },
  {
    id: 'live-ru-professionals-short',
    locale: 'ru' as const,
    screen: '/book/professionals',
    prompt: 'How do I book an appointment?',
    topicId: 'public-booking-professionals',
    summaryTitle: /Просмотрите специалистов\s*$/u,
    forbidBodyLength: /биографии|рейтинги/iu,
  },
  {
    id: 'live-en-services-short',
    locale: 'en' as const,
    screen: '/book/services',
    prompt: 'How do I book an appointment?',
    topicId: 'public-booking-services',
    summaryTitle: /Open Services\s*$/u,
    forbidBodyLength: /from the menu|after choosing/iu,
  },
  {
    id: 'live-en-checkout-short',
    locale: 'en' as const,
    screen: '/book/checkout',
    prompt: 'How do I book an appointment?',
    topicId: 'public-checkout',
    summaryTitle: /Review details\s*$/u,
    forbidBodyLength: /cancellation policy|prepayment is required/iu,
  },
  {
    id: 'live-en-packages-walkthrough',
    locale: 'en' as const,
    screen: '/s/packages',
    prompt: 'Walk me through buying a package step by step',
    topicId: 'consumer-packages-gift-cards',
    summaryTitle: /Open Packages\s*$/u,
    forbidBodyLength: /Services or Account|expiry/iu,
  },
] as const;
