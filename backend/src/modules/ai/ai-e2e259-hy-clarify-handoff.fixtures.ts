/**
 * e2e-bug.259 — locale:hy|ru must not return English clarify/status chrome
 * (any-provider clarify, Still stuck? handoff) beside localized guides.
 * Also covers sibling e2e-bug.274 confirm anon clarify.
 */

export const E2E259_ENGLISH_FORBIDDEN = [
  /Still stuck\?/i,
  /Ask what Any stylist means/i,
  /Finish booking or sign in so I can read your appointment details/i,
  /Product guide help/i,
  /The user finished the in-app guide/i,
] as const;

export const E2E259_UNIT_CASES = [
  {
    id: 'e2e259-hy-support-handoff-label',
    locale: 'hy' as const,
    expectedLabelKey: 'assistant.guideStillStuck' as const,
  },
  {
    id: 'e2e259-ru-support-handoff-label',
    locale: 'ru' as const,
    expectedLabelKey: 'assistant.guideStillStuck' as const,
  },
  {
    id: 'e2e259-en-support-handoff-label-regression',
    locale: 'en' as const,
    expectedLabel: 'Still stuck?',
  },
  {
    id: 'e2e259-hy-any-provider-clarify',
    locale: 'hy' as const,
    prompt: 'Who is best for curly hair?',
    expectedAction: 'explain_any_provider_option' as const,
    expectClarify: true,
  },
  {
    id: 'e2e259-ru-any-provider-clarify',
    locale: 'ru' as const,
    prompt: 'Who is best for curly hair?',
    expectedAction: 'explain_any_provider_option' as const,
    expectClarify: true,
  },
  {
    id: 'e2e259-en-any-provider-clarify-regression',
    locale: 'en' as const,
    prompt: 'Who is best for curly hair?',
    expectedAction: 'explain_any_provider_option' as const,
    expectClarify: true,
    expectedSummaryIncludes: 'Ask what Any stylist means',
  },
  {
    id: 'e2e274-hy-confirm-anon-clarify',
    locale: 'hy' as const,
    prompt: 'Ինչ ժամի է իմ ամրագրումը?',
    expectedAction: 'confirm_my_booking_details' as const,
  },
  {
    id: 'e2e274-ru-confirm-anon-clarify',
    locale: 'ru' as const,
    prompt: 'Когда моя запись?',
    expectedAction: 'confirm_my_booking_details' as const,
  },
  {
    id: 'e2e274-en-confirm-anon-clarify-regression',
    locale: 'en' as const,
    prompt: 'What time is my appointment?',
    expectedAction: 'confirm_my_booking_details' as const,
    expectedSummaryIncludes:
      'Finish booking or sign in so I can read your appointment details',
  },
] as const;

export const E2E259_LIVE_CASES = [
  {
    id: 'e2e259-live-hy-any-stylist-meaning',
    prompt: 'ինչ է նշանակում ցանկացած մասնագետ',
    locale: 'hy' as const,
    expectAction: 'explain_any_provider_option',
    forbidEnglishChrome: true,
    requireHy: true,
  },
  {
    id: 'e2e259-live-hy-packages-guide-handoff',
    prompt: 'How do I buy a package?',
    locale: 'hy' as const,
    allowActions: ['guide_user_flow', 'explain_app_feature'],
    forbidEnglishChrome: true,
    requireSupportHandoffLocalized: true,
    requireHy: true,
  },
  {
    id: 'e2e259-live-ru-packages-guide-handoff',
    prompt: 'How do I buy a package?',
    locale: 'ru' as const,
    allowActions: ['guide_user_flow', 'explain_app_feature'],
    forbidEnglishChrome: true,
    requireSupportHandoffLocalized: true,
  },
  {
    id: 'e2e259-live-en-packages-guide-handoff-regression',
    prompt: 'How do I buy a package?',
    locale: 'en' as const,
    allowActions: ['guide_user_flow', 'explain_app_feature'],
    expectSupportHandoffLabel: 'Still stuck?',
  },
  {
    id: 'e2e259-live-hy-booking-help-no-en-chrome',
    prompt: 'Ինչպես ամրագրել',
    locale: 'hy' as const,
    expectAction: 'booking_help',
    forbidEnglishChrome: true,
    requireHy: true,
  },
  {
    id: 'e2e274-live-hy-confirm-time',
    prompt: 'Ինչ ժամի է իմ ամրագրումը?',
    locale: 'hy' as const,
    expectAction: 'confirm_my_booking_details',
    forbidEnglishChrome: true,
    requireHy: true,
  },
  {
    id: 'e2e274-live-hy-confirm-summarize',
    prompt: 'Ամփոփիր իմ ամրագրումը',
    locale: 'hy' as const,
    expectAction: 'confirm_my_booking_details',
    forbidEnglishChrome: true,
    requireHy: true,
  },
  {
    id: 'e2e274-live-en-confirm-summarize-regression',
    prompt: 'Summarize my booking',
    locale: 'en' as const,
    expectAction: 'confirm_my_booking_details',
    expectSummaryIncludes:
      'Finish booking or sign in so I can read your appointment details',
  },
] as const;
