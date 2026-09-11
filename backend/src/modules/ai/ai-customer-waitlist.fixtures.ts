export type CustomerWaitlistPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'join_waitlist' | 'check_waitlist_status';
  rescueReason: 'join_waitlist' | 'check_waitlist_status';
  serviceName?: string;
  employeeName?: string;
  date?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
};

/** e2e-bug.112 — provider-only waitlist must not duplicate name into serviceName. */
/** Not `CustomerWaitlistPromptFixture`: these scenarios carry no
 * `expectedAction` / `rescueReason`, which that type requires. */
export type ProviderOnlyWaitlistScenario = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  employeeName: string;
  serviceName?: string;
};

export const E2E112_PROVIDER_ONLY_WAITLIST_SCENARIOS: readonly ProviderOnlyWaitlistScenario[] = [
  {
    id: 'e2e112-gevorg-tomorrow-public',
    prompt: 'put me on the waitlist for Gevorg Gasparyan tomorrow',
    surface: 'public' as const,
    employeeName: 'Gevorg Gasparyan',
  },
  {
    id: 'e2e112-gevorg-tomorrow-customer',
    prompt: 'put me on the waitlist for Gevorg Gasparyan tomorrow',
    surface: 'customer' as const,
    employeeName: 'Gevorg Gasparyan',
  },
  {
    id: 'e2e112-anna-friday-public',
    prompt: 'Join the waitlist for Anna on Friday',
    surface: 'public' as const,
    employeeName: 'Anna',
  },
  {
    id: 'e2e112-massage-with-gevorg',
    prompt: 'Put me on the waitlist for massage with Gevorg Gasparyan tomorrow',
    surface: 'public' as const,
    serviceName: 'massage',
    employeeName: 'Gevorg Gasparyan',
  },
];

/**
 * e2e-bug.235 — confirmation must not say "with Gevorg with Gevorg" or
 * "waitlist for with Gevorg" (provider-only leading "with").
 */
export const E2E235_WAITLIST_SUMMARY_SCENARIOS = [
  {
    id: 'e2e235-swedish-with-gevorg-short',
    serviceName: 'Swedish massage with Gevorg',
    employeeName: 'Gevorg',
    date: '29/07/2026',
    expectedSummary: 'Swedish massage with Gevorg on 29/07/2026',
    forbidden: ['with Gevorg with Gevorg'],
  },
  {
    id: 'e2e235-swedish-with-gevorg-full',
    serviceName: 'Swedish massage with Gevorg Gasparyan',
    employeeName: 'Gevorg Gasparyan',
    date: '29/07/2026',
    expectedSummary: 'Swedish massage with Gevorg Gasparyan on 29/07/2026',
    forbidden: ['with Gevorg Gasparyan with Gevorg'],
  },
  {
    id: 'e2e235-swedish-with-first-vs-full',
    serviceName: 'Swedish massage with Gevorg',
    employeeName: 'Gevorg Gasparyan',
    date: '29/07/2026',
    expectedSummary: 'Swedish massage with Gevorg Gasparyan on 29/07/2026',
    forbidden: ['with Gevorg with Gevorg'],
  },
  {
    id: 'e2e235-clean-service-plus-provider',
    serviceName: 'Swedish massage',
    employeeName: 'Gevorg',
    date: '29/07/2026',
    expectedSummary: 'Swedish massage with Gevorg on 29/07/2026',
    forbidden: ['with Gevorg with Gevorg'],
  },
  {
    id: 'e2e235-provider-only-no-leading-with',
    serviceName: undefined,
    employeeName: 'Gevorg Gasparyan',
    date: '29/07/2026',
    expectedSummary: 'Gevorg Gasparyan on 29/07/2026',
    forbidden: ['for with ', 'with Gevorg Gasparyan with'],
  },
  {
    id: 'e2e235-provider-equals-service',
    serviceName: 'Gevorg Gasparyan',
    employeeName: 'Gevorg Gasparyan',
    date: '29/07/2026',
    expectedSummary: 'Gevorg Gasparyan on 29/07/2026',
    forbidden: ['Gevorg Gasparyan with Gevorg', 'with Gevorg Gasparyan with'],
  },
  {
    id: 'e2e235-service-only',
    serviceName: 'Swedish massage',
    employeeName: undefined,
    date: '29/07/2026',
    expectedSummary: 'Swedish massage on 29/07/2026',
    forbidden: [' with with '],
  },
  {
    id: 'e2e235-massage-with-anna-short',
    serviceName: 'massage with Anna',
    employeeName: 'Anna',
    date: '01/08/2026',
    expectedSummary: 'massage with Anna on 01/08/2026',
    forbidden: ['with Anna with Anna'],
  },
] as const;

/** e2e-bug.235 — NL prompts that must parse + summarize without duplicate "with". */
/** Parse plus summary assertions; one prompt names no service. */
export type WaitlistPromptSummaryScenario = {
  id: string;
  prompt: string;
  serviceName?: string;
  employeeName: string;
  summaryIncludes: string;
  forbidden: string[];
};

export const E2E235_WAITLIST_PROMPT_SCENARIOS: readonly WaitlistPromptSummaryScenario[] = [
  {
    id: 'e2e235-prompt-swedish-with-gevorg',
    prompt: 'put me on the waitlist for Swedish massage with Gevorg tomorrow',
    serviceName: 'Swedish massage',
    employeeName: 'Gevorg',
    summaryIncludes: 'Swedish massage with Gevorg',
    forbidden: ['with Gevorg with Gevorg'],
  },
  {
    id: 'e2e235-prompt-notify-if-opens',
    prompt: 'Notify me if a Swedish massage with Gevorg opens tomorrow',
    serviceName: 'Swedish massage',
    employeeName: 'Gevorg',
    summaryIncludes: 'Swedish massage with Gevorg',
    forbidden: ['with Gevorg with Gevorg', 'opens for on '],
  },
  {
    id: 'e2e235-prompt-provider-only',
    prompt: 'put me on the waitlist for Gevorg Gasparyan tomorrow',
    employeeName: 'Gevorg Gasparyan',
    summaryIncludes: 'Gevorg Gasparyan',
    forbidden: ['opens for with ', 'for with Gevorg'],
  },
];

export const CUSTOMER_PUBLIC_CUSTOMER_WAITLIST_CLASSIFIER_RULES = `- join_waitlist: MUTATE — logged-in customer asks to be notified when a slot opens ("Notify me if something opens Friday", "Put me on the waitlist for massage"). Set serviceName, date/dateFrom/dateTo, timeSlot, timeOfDay, employeeName when mentioned. Provider-only prompts ("put me on the waitlist for Gevorg Gasparyan tomorrow") set employeeName only — never copy the provider into serviceName (e2e-bug.112). Uses POST /me/waitlist. Requires sign-in. NOT offer_waitlist_slot|list_waitlist_entries (staff dashboard), NOT suggest_waitlist_for_gap|coordinate_waitlist_offer (provider staff), NOT check_availability (browse open times without waitlist join cue), NOT book_appointment.
- check_waitlist_status: READ — logged-in customer asks whether they are already on the waitlist ("Am I on the waitlist?", "What's my waitlist status?"). Uses GET /me/waitlist. Requires sign-in. NOT list_waitlist_entries (staff CRM list).`;

export const JOIN_WAITLIST_PROMPTS: readonly CustomerWaitlistPromptFixture[] = [
  {
    id: 'notify-opens-friday-customer',
    prompt: 'Notify me if something opens Friday',
    surface: 'customer',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
  },
  {
    id: 'join-waitlist-massage-customer',
    prompt: 'Join the waitlist for massage',
    surface: 'customer',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'massage',
  },
  {
    id: 'alert-when-haircut-opens-customer',
    prompt: 'Alert me when a haircut slot opens',
    surface: 'customer',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'haircut',
  },
  {
    id: 'put-me-waitlist-friday-customer',
    prompt: 'Put me on the waitlist for Friday afternoon',
    surface: 'customer',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    timeOfDay: 'afternoon',
  },
  {
    id: 'notify-opening-trim-customer',
    prompt: 'Notify me if a trim opens this week',
    surface: 'customer',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'trim',
  },
  {
    id: 'waitlist-facial-morning-customer',
    prompt: 'Add me to the waitlist for facial tomorrow morning',
    surface: 'customer',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'facial',
    timeOfDay: 'morning',
  },
  {
    id: 'waiting-list-manicure-customer',
    prompt: 'Sign me up for the waiting list for manicure',
    surface: 'customer',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'manicure',
  },
  {
    id: 'notify-if-slot-opens-customer',
    prompt: 'Let me know if any slot opens for Swedish massage',
    surface: 'customer',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'Swedish massage',
  },
  {
    id: 'join-waitlist-evening-customer',
    prompt: 'Join waitlist for anything this evening',
    surface: 'customer',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    timeOfDay: 'evening',
  },
  {
    id: 'ping-when-opens-customer',
    prompt: 'Ping me when something opens for waxing',
    surface: 'customer',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'waxing',
  },
  {
    id: 'notify-opens-friday-public',
    prompt: 'Notify me if something opens Friday',
    surface: 'public',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
  },
  {
    id: 'join-waitlist-massage-public',
    prompt: 'Join the waitlist for massage',
    surface: 'public',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'massage',
  },
  {
    id: 'alert-when-haircut-opens-public',
    prompt: 'Alert me when a haircut slot opens',
    surface: 'public',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'haircut',
  },
  {
    id: 'put-me-waitlist-friday-public',
    prompt: 'Put me on the waitlist for Friday afternoon',
    surface: 'public',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    timeOfDay: 'afternoon',
  },
  {
    id: 'notify-opening-trim-public',
    prompt: 'Notify me if a trim opens this week',
    surface: 'public',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'trim',
  },
  {
    id: 'waitlist-facial-morning-public',
    prompt: 'Add me to the waitlist for facial tomorrow morning',
    surface: 'public',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'facial',
    timeOfDay: 'morning',
  },
  {
    id: 'waiting-list-manicure-public',
    prompt: 'Sign me up for the waiting list for manicure',
    surface: 'public',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'manicure',
  },
  {
    id: 'notify-if-slot-opens-public',
    prompt: 'Let me know if any slot opens for Swedish massage',
    surface: 'public',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'Swedish massage',
  },
  {
    id: 'join-waitlist-evening-public',
    prompt: 'Join waitlist for anything this evening',
    surface: 'public',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    timeOfDay: 'evening',
  },
  {
    id: 'ping-when-opens-public',
    prompt: 'Ping me when something opens for waxing',
    surface: 'public',
    expectedAction: 'join_waitlist',
    rescueReason: 'join_waitlist',
    serviceName: 'waxing',
  },
];

export const CHECK_WAITLIST_STATUS_PROMPTS: readonly CustomerWaitlistPromptFixture[] =
  [
    {
      id: 'am-i-on-waitlist-customer',
      prompt: 'Am I on the waitlist?',
      surface: 'customer',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'waitlist-status-customer',
      prompt: 'What is my waitlist status?',
      surface: 'customer',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'check-waitlist-customer',
      prompt: 'Check my waitlist request',
      surface: 'customer',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'still-on-waitlist-customer',
      prompt: 'Am I still on the waiting list?',
      surface: 'customer',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'waitlist-update-customer',
      prompt: 'Any update on my waitlist?',
      surface: 'customer',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'on-waitlist-yet-customer',
      prompt: 'Am I on the waitlist yet for massage?',
      surface: 'customer',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
      serviceName: 'massage',
    },
    {
      id: 'waitlist-position-customer',
      prompt: 'Show my waitlist status',
      surface: 'customer',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'did-join-waitlist-customer',
      prompt: 'Did I join the waitlist?',
      surface: 'customer',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'waitlist-request-status-customer',
      prompt: 'Status of my waitlist request',
      surface: 'customer',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'waiting-list-status-customer',
      prompt: 'Waiting list status please',
      surface: 'customer',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'am-i-on-waitlist-public',
      prompt: 'Am I on the waitlist?',
      surface: 'public',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'waitlist-status-public',
      prompt: 'What is my waitlist status?',
      surface: 'public',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'check-waitlist-public',
      prompt: 'Check my waitlist request',
      surface: 'public',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'still-on-waitlist-public',
      prompt: 'Am I still on the waiting list?',
      surface: 'public',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'waitlist-update-public',
      prompt: 'Any update on my waitlist?',
      surface: 'public',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'on-waitlist-yet-public',
      prompt: 'Am I on the waitlist yet for massage?',
      surface: 'public',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
      serviceName: 'massage',
    },
    {
      id: 'waitlist-position-public',
      prompt: 'Show my waitlist status',
      surface: 'public',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'did-join-waitlist-public',
      prompt: 'Did I join the waitlist?',
      surface: 'public',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'waitlist-request-status-public',
      prompt: 'Status of my waitlist request',
      surface: 'public',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'waiting-list-status-public',
      prompt: 'Waiting list status please',
      surface: 'public',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
  ];

export const CUSTOMER_WAITLIST_PROMPTS: readonly CustomerWaitlistPromptFixture[] =
  [...JOIN_WAITLIST_PROMPTS, ...CHECK_WAITLIST_STATUS_PROMPTS];

export const CUSTOMER_WAITLIST_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-check-availability',
    prompt: 'Notify me if something opens Friday',
    misclassifiedAction: 'check_availability',
    expectedAction: 'join_waitlist' as const,
  },
  {
    id: 'misclassified-book',
    prompt: 'Join the waitlist for massage',
    misclassifiedAction: 'book_appointment',
    expectedAction: 'join_waitlist' as const,
  },
  {
    id: 'misclassified-list-staff',
    prompt: 'Am I on the waitlist?',
    misclassifiedAction: 'list_waitlist_entries',
    expectedAction: 'check_waitlist_status' as const,
  },
  {
    id: 'misclassified-join-as-status',
    prompt: 'What is my waitlist status?',
    misclassifiedAction: 'join_waitlist',
    expectedAction: 'check_waitlist_status' as const,
  },
];
