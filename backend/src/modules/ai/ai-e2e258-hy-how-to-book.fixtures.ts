/**
 * e2e-bug.258 — short Armenian "Ինչպես ամրագրել" must be booking_help,
 * not confirm_my_booking_details (+ English "Finish booking or sign in…" clarify).
 */

export const E2E258_BOOKING_HELP_SCENARIOS = [
  {
    id: 'e2e258-hy-short-how-book',
    prompt: 'Ինչպես ամրագրել',
    surface: 'public' as const,
    locale: 'hy' as const,
    expectedAction: 'booking_help' as const,
  },
  {
    id: 'e2e258-hy-short-how-book-question-mark',
    prompt: 'Ինչպե՞ս ամրագրել',
    surface: 'public' as const,
    locale: 'hy' as const,
    expectedAction: 'booking_help' as const,
  },
  {
    id: 'e2e258-hy-how-book-visit-no-step',
    prompt: 'Ինչպես ամրագրել այցելություն',
    surface: 'public' as const,
    locale: 'hy' as const,
    expectedAction: 'booking_help' as const,
  },
  {
    id: 'e2e258-hy-how-book-imperative',
    prompt: 'Ինչպես ամրագրեմ',
    surface: 'customer' as const,
    locale: 'hy' as const,
    expectedAction: 'booking_help' as const,
  },
  {
    id: 'e2e258-hy-full-step-by-step',
    prompt: 'Ինչպե՞ս ամրագրել այցելություն քայլ առ քայլ',
    surface: 'public' as const,
    locale: 'hy' as const,
    expectedAction: 'booking_help' as const,
  },
  {
    id: 'e2e258-ru-kak-zapisatsya',
    prompt: 'Как записаться',
    surface: 'public' as const,
    locale: 'ru' as const,
    expectedAction: 'booking_help' as const,
  },
  {
    id: 'e2e258-en-how-book-regression',
    prompt: 'How do I book an appointment?',
    surface: 'public' as const,
    locale: 'en' as const,
    expectedAction: 'booking_help' as const,
  },
] as const;

/** True booking-details reads — must not regress into booking_help. */
export const E2E258_STILL_CONFIRM_SCENARIOS = [
  {
    id: 'e2e258-hy-confirm-time',
    prompt: 'Ինչ ժամի է իմ ամրագրումը?',
    expectedAction: 'confirm_my_booking_details' as const,
  },
  {
    id: 'e2e258-hy-confirm-summarize',
    prompt: 'Ամփոփիր իմ ամրագրումը',
    expectedAction: 'confirm_my_booking_details' as const,
  },
  {
    id: 'e2e258-hy-confirm-just-booked',
    prompt: 'Ի՞նչ ամրագրում եմ արել հենց հիմա',
    expectedAction: 'confirm_my_booking_details' as const,
  },
  {
    id: 'e2e258-hy-confirm-provider',
    prompt: 'Ովի հետ է ամրագրումս?',
    expectedAction: 'confirm_my_booking_details' as const,
  },
] as const;

export const E2E258_ENGLISH_CLARIFY_FORBIDDEN =
  /Finish booking or sign in so I can read your appointment details/i;

export const E2E258_LIVE_CASES = [
  ...E2E258_BOOKING_HELP_SCENARIOS.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    locale: row.locale,
    expectAction: row.expectedAction,
    forbidEnglishClarify: row.locale === 'hy' || row.locale === 'ru',
  })),
  ...E2E258_STILL_CONFIRM_SCENARIOS.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    locale: 'hy' as const,
    expectAction: row.expectedAction,
    forbidEnglishClarify: false,
    allowConfirmClarify: true,
  })),
] as const;
