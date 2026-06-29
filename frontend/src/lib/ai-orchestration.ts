/** Query key prefixes invalidated after AI create/update/delete (and related mutations). */
export const AI_MUTATION_QUERY_KEYS = [
  'bookings',
  'booking',
  'provider-calendar',
  'services',
  'service-categories',
  'service-packages',
  'subscription-plans',
  'employees',
  'team-members',
  'customers',
  'customers-dashboard',
  'customer-detail',
  'block-schedules',
  'schedule-templates',
  'schedules',
  'slots',
  'agent-tasks',
  'agent-tasks-pending',
  'agent-tasks-undo-preview',
  'dashboard-overview',
  'appointments-dashboard',
  'business',
  'business-settings',
  'business-profile',
  'inventory',
  'multi-service-settings',
  'promo-codes',
  'loyalty-settings',
  'loyalty',
  'products',
  'clinic-test-types',
  'clinic-test-panels',
  'clinic-lab-queue',
  'clinic-booking-lab-orders',
  'patient-chart-orders',
  'patient-encounters',
  'patient-staff-notes',
  'integrations-zendesk',
  'integrations-distribution',
  'integrations-webhooks',
  'integrations-zapier',
  'integrations-accounting',
  'notification-settings',
  'email-templates',
  'time-off-requests',
  'plan-entitlements',
] as const;

export function invalidateDashboardQueries(
  queryClient: { invalidateQueries: (opts: { queryKey: string[] }) => void },
): void {
  for (const key of AI_MUTATION_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}

export const AI_WEEKLY_TEAM_SCHEDULE_EXAMPLE =
  'Apply schedule for all employees for their services this week between 9–19:00; make 12:00–13:00 unavailable';

export type { AiExampleTenantContext } from './ai-assistant-i18n';
export {
  buildAiCommandBarExamples,
  getLocalizedPageSuggestions,
  getLocalizedAiPageSuggestionGroups,
  type LocalizedAiPageSuggestionGroup,
  type AiTranslateFn,
} from './ai-assistant-i18n';

import {
  buildAiCommandBarExamples as buildLocalizedCommandBarExamples,
  getLocalizedPageSuggestions,
  getLocalizedAiPageSuggestionGroups,
  type AiTranslateFn,
} from './ai-assistant-i18n';

function englishCommandBarFallback(key: string, vars?: Record<string, string | number>): string {
  const fallbacks: Record<string, string> = {
    'ai.fallbackProvider': 'your provider',
    'ai.fallbackService': 'a service',
    'ai.prompts.weekdayTemplateAll': 'Apply weekday template to all providers this week',
    'ai.prompts.blockLunchWeek': 'Block lunch 12:00–13:00 for everyone Mon–Fri this week',
    'ai.prompts.fillGapsProviderWeek': 'Fill gaps between 9–19:00 for {provider} this week',
    'ai.prompts.howManyToday': 'How many appointments today?',
    'ai.prompts.weeklyTeamSchedule': AI_WEEKLY_TEAM_SCHEDULE_EXAMPLE,
    'ai.prompts.cancelBookingSlotProvider': 'Cancel booking today for {provider} from 13:00–14:00',
    'ai.prompts.bookNearestSlot': 'Book {service} today for {provider} at the nearest available time',
  };
  let text = fallbacks[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
    }
  }
  return text;
}

/** Static English fallback when locale is unavailable (tests, SSR). */
export const AI_COMMAND_BAR_EXAMPLES = buildLocalizedCommandBarExamples(
  null,
  englishCommandBarFallback,
);

export const AI_SCHEDULE_EXAMPLES = [
  'Apply weekday template to all providers this week',
  'Block lunch 12:00–13:00 for everyone Mon–Fri this week',
  'Fill gaps between 9–19:00 for Gevorg this week',
  'Block May 30 entirely for all providers',
  'Set up this week\'s schedule for my team',
  'Who has open slots today?',
  'Resolve scheduling conflicts this week',
];

export const AI_BOOKING_EXAMPLES = [
  'How many appointments today?',
  'Which appointment is the most expensive today?',
  'Which is the longest appointment today?',
  'Show all appointments for tomorrow',
  'Show cancelled appointments today',
  'What\'s coming up today?',
  'Who is the busiest provider today?',
  'Cancel all facemassage appointments tomorrow',
  'Cancel all Gevorg\'s appointments on 30th May with a reason that he is sick',
  'Move Maria\'s 14:00 appointment to 16:00',
  'Change Maria\'s appointment to hot stone massage',
  'Change service type to facemassage for Gevorg\'s 14:00 today',
  'Switch to deep tissue massage and move to tomorrow at 18:00',
  'Hide all cancelled appointments from the calendar today',
  'Remove done and no-show appointments for Gevorg from the schedule',
  'Unhide all hidden cancelled appointments for Gevorg today',
  'Restore hidden done appointments for all providers this week on the calendar',
  'Hide one cancelled appointment for Maria tomorrow at 14:00',
  'Clear all completed appointments from everyone\'s calendar this week',
  'Summarize today for all providers',
];

export const AI_CUSTOMER_EXAMPLES = [
  'Top 10 customers who paid the most',
  'Which customer has the most no-shows?',
  'Show at-risk customers',
  'Who are our VIP customers?',
  'Which customers book the most?',
  'Show new customers',
  'Which customers cancel the most?',
];

export const AI_STAFF_EXAMPLES = [
  'Who is the busiest provider today?',
  'Top providers by revenue this week',
  'Compare staff performance this month',
  'Who earned the most this week?',
];

export const AI_SERVICE_ANALYTICS_EXAMPLES = [
  'Most popular service this month',
  'Top services by revenue this week',
  'Which service is booked the most?',
  'Least booked services last month',
];

export const AI_LOOKUP_EXAMPLES = [
  'Tell me about Maria — when was her last visit?',
  'How many appointments does John have?',
  'Show new customers',
  'List our schedule templates',
  'Who works on our team?',
  'Who can do facemassage?',
  'What services can Gevorg perform?',
  'Who can do facemassage tomorrow?',
  'How many customers on the waitlist?',
  'Show waitlist customers',
];

export const AI_MULTILINGUAL_EXAMPLES = [
  'Որքան ամրագրումներ կան այսօր?',
  'Ցույց տուր չեղարկված ամրագրումները',
  'Ով կարող է անել facemassage?',
  'Сколько записей сегодня?',
  'Покажи отменённые записи',
  'Кто может делать facemassage?',
  'Сколько клиентов в листе ожидания?',
];

export const AI_AVAILABILITY_EXAMPLES = [
  'Which slots are available for Gevorg tomorrow?',
  'What is Gevorg\'s schedule on Friday?',
  'Who is free today between 14:00 and 18:00?',
  'Check availability for all providers tomorrow',
];

export const AI_SERVICE_EXAMPLES = [
  'What services do we offer?',
  'How much is facemassage?',
  'Most popular service this month',
  'Add services: facemassage 60min $50, haircut 30min $25',
];

/** Follow-up chains users commonly run in one thread */
export const AI_SCENARIO_CHAINS = [
  {
    title: 'Utilization drill-down',
    steps: [
      'Summarize utilization this week — who has the most gaps?',
      'Which exact days does Gevorg have gaps?',
      'Fill those gaps with his services',
    ],
  },
  {
    title: 'Today\'s operations',
    steps: [
      'How many appointments today?',
      'Which is the most expensive today?',
      'Who is the busiest provider today?',
      'Show cancelled appointments today',
    ],
  },
  {
    title: 'Book from availability',
    steps: [
      'Which slots are available for Gevorg tomorrow?',
      'Book facemassage at 10:00',
    ],
  },
  {
    title: 'Clean up calendar',
    steps: [
      'Show cancelled appointments today',
      'Hide all cancelled appointments from the calendar today',
      'Unhide hidden cancelled appointments for Gevorg today',
    ],
  },
  {
    title: 'View then cancel',
    steps: [
      'Show all appointments for tomorrow',
      'Cancel all facemassage appointments tomorrow',
    ],
  },
  {
    title: 'Customer health',
    steps: [
      'Summarize customer overview',
      'Top 10 customers who paid the most',
      'Which customer has the most no-shows?',
      'Show at-risk customers',
    ],
  },
  {
    title: 'Week setup',
    steps: [
      'Set up this week\'s schedule for my team',
      'Summarize utilization this week',
      'Fill all empty slots this week',
    ],
  },
  {
    title: 'Conflict recovery',
    steps: [
      'Who has conflicts this week?',
      'Resolve scheduling conflicts this week',
      'Reassign cancelled appointments this week',
    ],
  },
  {
    title: 'Service & staff analytics',
    steps: [
      'Most popular service this month',
      'Top providers by revenue this week',
      'Who is the busiest provider today?',
    ],
  },
  {
    title: 'Customer deep-dive',
    steps: [
      'Tell me about Maria — when was her last visit?',
      'Show Maria\'s appointments',
      'Top 10 customers who paid the most',
    ],
  },
  {
    title: 'Waitlist & recovery',
    steps: [
      'How many customers on the waitlist?',
      'Show waitlist customers',
      'Fill cancelled 14:00 slot from waitlist',
    ],
  },
  {
    title: 'Service assignments',
    steps: [
      'Who can do facemassage tomorrow?',
      'Book Gevorg at 10:00',
    ],
  },
];

export const AI_PAGE_SUGGESTIONS: Record<string, string[]> = {
  '/dashboard': [
    'How many appointments today?',
    'Summarize utilization this week',
    'Top 10 customers who paid the most',
    'What\'s coming up today?',
    'Resolve scheduling conflicts this week',
  ],
  '/dashboard/schedule': [
    'Apply weekday template to Gevorg this week',
    'List our schedule templates',
    'Block 12:00–13:00 lunch Mon–Fri for all providers',
    'Fill schedule gaps between 9–19:00 today',
    'Set up this week\'s schedule for my team',
    'Who has open slots this week?',
  ],
  '/dashboard/calendar': [
    'Show Gevorg\'s schedule tomorrow',
    'Which slots are available for Gevorg tomorrow?',
    'Fill gaps for all providers this week',
    'Resolve scheduling conflicts this week',
    'Who has conflicts this week?',
  ],
  '/dashboard/bookings': [
    'How many appointments today?',
    'Which appointment is the most expensive today?',
    'Show all appointments for today',
    'Show cancelled appointments today',
    'Hide all cancelled appointments from the calendar today',
    'Unhide hidden cancelled appointments for Gevorg today',
    'Restore hidden appointments for all providers this week',
    'Book facemassage with Gevorg tomorrow at 10:00',
    'Cancel all bookings for tomorrow',
    'Change service to hot stone massage for Maria\'s 14:00 today',
  ],
  '/dashboard/appointments': [
    'How many appointments today?',
    'Which is the longest appointment today?',
    'Show cancelled appointments today',
    'How many no-shows today?',
    'Summarize today for all providers',
    'Who is the busiest provider today?',
  ],
  '/dashboard/customers': [
    'Find customers with the most no-shows',
    'Re-engage inactive customers',
    'Which customer has the most no-shows?',
    'Show at-risk customers',
    'Top 10 customers who paid the most',
    'Show new customers',
    'Who are our VIP customers?',
    'Which customers cancel the most?',
    'How many customers on the waitlist?',
    'Show waitlist customers',
  ],
  '/dashboard/employees': [
    'Assign all massage services to Gevorg',
    'Summarize utilization this week',
    'Who is the busiest provider today?',
    'Top providers by revenue this week',
    'List our team members',
    'What services can Gevorg perform?',
    'Who can do facemassage tomorrow?',
  ],
  '/dashboard/services': [
    'What services do we offer?',
    'Most popular service this month',
    'How much is facemassage?',
    'Add services: facemassage 60min $50, haircut 30min $25',
    'Who can do facemassage?',
  ],
  '/dashboard/reports': [
    "Explain this week's drop in utilization",
    'Summarize utilization this week',
    'How many appointments this week?',
    'Total revenue this month',
    'Top services by revenue this month',
    'Top 10 customers who paid the most',
  ],
  '/dashboard/operations': [
    'How many appointments today?',
    'Total revenue this week',
    'Summarize utilization this week',
  ],
  '/dashboard/ai-ops': [
    'Optimize next week schedule',
    'Fill all empty slots this week',
    'Who has the most schedule gaps?',
    'Resolve scheduling conflicts this week',
    'Reassign cancelled appointments this week',
  ],
  '/dashboard/reviews': [
    'Which customer has the most no-shows?',
    'Show at-risk customers',
    'Top 10 customers who paid the most',
  ],
  '/dashboard/guide': [
    'How many appointments today?',
    'Summarize utilization this week',
    'Top 10 customers who paid the most',
  ],
};

export type AiPageSuggestionGroup = {
  id: string;
  label: string;
  items: string[];
};

/** Grouped Orchestrix prompts per page (shown in collapsible dropdowns). */
export const AI_PAGE_SUGGESTION_GROUPS: Record<string, AiPageSuggestionGroup[]> = {
  '/dashboard/bookings': [
    {
      id: 'overview',
      label: 'Today & overview',
      items: [
        'How many appointments today?',
        'Which appointment is the most expensive today?',
        'Show all appointments for today',
      ],
    },
    {
      id: 'cancelled',
      label: 'Cancelled & visibility',
      items: [
        'Show cancelled appointments today',
        'Hide all cancelled appointments from the calendar today',
        'Unhide hidden cancelled appointments for Gevorg today',
        'Restore hidden appointments for all providers this week',
      ],
    },
    {
      id: 'actions',
      label: 'Book, cancel & update',
      items: [
        'Book facemassage with Gevorg tomorrow at 10:00',
        'Cancel all bookings for tomorrow',
        'Change service to hot stone massage for Maria\'s 14:00 today',
      ],
    },
  ],
  '/dashboard/calendar': [
    {
      id: 'availability',
      label: 'Availability & schedule',
      items: [
        'Show Gevorg\'s schedule tomorrow',
        'Which slots are available for Gevorg tomorrow?',
        'Who has open slots this week?',
      ],
    },
    {
      id: 'optimize',
      label: 'Gaps & conflicts',
      items: [
        'Fill gaps for all providers this week',
        'Resolve scheduling conflicts this week',
        'Who has conflicts this week?',
      ],
    },
  ],
  '/dashboard/schedule': [
    {
      id: 'templates',
      label: 'Templates & setup',
      items: [
        'Apply weekday template to Gevorg this week',
        'List our schedule templates',
        'Set up this week\'s schedule for my team',
      ],
    },
    {
      id: 'blocks',
      label: 'Blocks & gaps',
      items: [
        'Block 12:00–13:00 lunch Mon–Fri for all providers',
        'Fill schedule gaps between 9–19:00 today',
        'Who has open slots this week?',
      ],
    },
  ],
  '/dashboard/customers': [
    {
      id: 'retention',
      label: 'Retention & re-engagement',
      items: [
        'Find customers with the most no-shows',
        'Re-engage inactive customers',
        'Which customer has the most no-shows?',
        'Show at-risk customers',
      ],
    },
    {
      id: 'segments',
      label: 'Segments & rankings',
      items: [
        'Top 10 customers who paid the most',
        'Show new customers',
        'Who are our VIP customers?',
        'Which customers cancel the most?',
        'How many customers on the waitlist?',
        'Show waitlist customers',
      ],
    },
  ],
  '/dashboard/reports': [
    {
      id: 'insights',
      label: 'Utilization & revenue',
      items: [
        "Explain this week's drop in utilization",
        'Summarize utilization this week',
        'How many appointments this week?',
        'Total revenue this month',
      ],
    },
    {
      id: 'rankings',
      label: 'Top performers',
      items: [
        'Top services by revenue this month',
        'Top 10 customers who paid the most',
        'Who is the busiest provider today?',
      ],
    },
  ],
};

export function getAiPageSuggestionGroups(
  route: string,
  t?: AiTranslateFn,
  ctx?: import('./ai-assistant-i18n').AssistantExampleTenantInput | null,
): AiPageSuggestionGroup[] {
  if (t) {
    return getLocalizedAiPageSuggestionGroups(route, t, ctx);
  }
  const grouped = AI_PAGE_SUGGESTION_GROUPS[route];
  if (grouped?.length) return grouped;
  const flat = AI_PAGE_SUGGESTIONS[route];
  if (!flat?.length) return [];
  return [{ id: 'commands', label: 'Quick commands', items: flat }];
}

/** Hints injected into AI session so the classifier prefers page-relevant actions */
export const AI_ROUTE_CONTEXT_HINTS: Record<string, string> = {
  '/dashboard':
    'Prefer: summarize_bookings, summarize_utilization, summarize_customers, resolve_conflicts, show_appointments today.',
  '/dashboard/schedule':
    'Prefer: apply_schedule, block_schedule, fill_unused_slots, setup_week_schedule, list_schedule_gaps.',
  '/dashboard/calendar':
    'Prefer: check_availability, show_appointments, fill_unused_slots, list_schedule_gaps, resolve_conflicts. Use calendar selection context when present.',
  '/dashboard/bookings':
    'Prefer: show_appointments, analyze_appointments, summarize_bookings, create_booking, cancel_bookings, reschedule_booking.',
  '/dashboard/appointments':
    'Prefer: show_appointments, analyze_appointments, summarize_bookings, summarize_day. Respect statusFilter/todayOnly context.',
  '/dashboard/customers':
    'Prefer: summarize_customers (no-shows, at-risk, VIP, top_spenders, new_customers, top bookers), summarize_waitlist.',
  '/dashboard/employees':
    'Prefer: assign_employee_services, lookup_service_assignment, summarize_utilization, check_availability, summarize_bookings busiest_provider.',
  '/dashboard/services':
    'Prefer: list_services, create_service, create_services, analyze_services, lookup_service_assignment providers_for_service.',
  '/dashboard/reports':
    'Prefer: summarize_utilization (compare weeks when user asks about drops or changes), summarize_bookings revenue/count, summarize_customers top_spenders.',
  '/dashboard/onboarding':
    'Prefer: list_services, create_services, apply_schedule, setup_week_schedule, list_schedule_templates. User is setting up a new business — suggest catalog and schedule steps.',
  '/dashboard/ai-ops':
    'Prefer: optimize_schedule, resolve_conflicts, reassign_cancelled, fill_unused_slots.',
  '/dashboard/reviews':
    'Prefer: summarize_customers no-shows, at_risk, top_spenders.',
};

export type AssistantMode = 'guide' | 'act';

export interface AiPageContext {
  route?: string;
  routeHint?: string | null;
  employeeName?: string | null;
  date?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  serviceName?: string | null;
  customerName?: string | null;
  timeSlot?: string | null;
  templateName?: string | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  allProviders?: boolean | null;
  lastAction?: string | null;
  lastMetric?: string | null;
  appointmentMetric?: string | null;
  customerMetric?: string | null;
  bookingMetric?: string | null;
  scheduleTab?: string | null;
  viewMode?: string | null;
  statusFilter?: string | null;
  todayOnly?: boolean | null;
  timeZone?: string | null;
  segmentFilter?: string | null;
  search?: string | null;
  selectionDate?: string | null;
  selectionTimeFrom?: string | null;
  selectionTimeTo?: string | null;
  selectionEmployeeId?: string | null;
  /** ai-guide-1.0.3 — optional guide vs act routing for assistant APIs. */
  assistantMode?: AssistantMode;
  /** ai-guide-1.3.4 — optional stable corpus topic when launching guide from /dashboard/guide#… */
  guideTopicId?: string;
}

let pageContext: AiPageContext = {};

export function setAiPageContext(ctx: AiPageContext) {
  pageContext = { ...pageContext, ...ctx };
  if (ctx.route) {
    pageContext.routeHint = AI_ROUTE_CONTEXT_HINTS[ctx.route] ?? null;
  }
}

export function getAiPageContext(): AiPageContext {
  return pageContext;
}

export function clearAiPageContext(keys?: (keyof AiPageContext)[]) {
  if (!keys) {
    pageContext = {};
    return;
  }
  const next = { ...pageContext };
  for (const key of keys) {
    delete next[key];
  }
  pageContext = next;
}

export function buildAiRequestContext(
  pathname: string,
  session: Partial<AiPageContext>,
  page: Partial<AiPageContext> = getAiPageContext(),
  overrides: Partial<AiPageContext> = {},
): AiPageContext {
  const route = pathname || page.route || session.route || overrides.route;
  return {
    ...session,
    ...page,
    ...overrides,
    route,
    routeHint: route ? (AI_ROUTE_CONTEXT_HINTS[route] ?? null) : null,
    timeZone: session.timeZone ?? page.timeZone ?? overrides.timeZone ?? getBrowserTimeZone(),
  };
}

export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function getSuggestionsForRoute(
  route: string,
  t?: AiTranslateFn,
  ctx?: import('./ai-assistant-i18n').AssistantExampleTenantInput | null,
): string[] {
  if (t) return getLocalizedPageSuggestions(route, t, ctx);
  return AI_PAGE_SUGGESTIONS[route] ?? AI_BOOKING_EXAMPLES.slice(0, 4);
}

/** All example prompts grouped for command bar / guide */
export const AI_ALL_EXAMPLE_GROUPS = [
  { label: 'Bookings & today', items: AI_BOOKING_EXAMPLES },
  { label: 'Schedule', items: AI_SCHEDULE_EXAMPLES },
  { label: 'Customers', items: AI_CUSTOMER_EXAMPLES },
  { label: 'Staff', items: AI_STAFF_EXAMPLES },
  { label: 'Service analytics', items: AI_SERVICE_ANALYTICS_EXAMPLES },
  { label: 'Availability', items: AI_AVAILABILITY_EXAMPLES },
  { label: 'Services & catalog', items: AI_SERVICE_EXAMPLES },
  { label: 'Lookup & reference', items: AI_LOOKUP_EXAMPLES },
  { label: 'Armenian & Russian', items: AI_MULTILINGUAL_EXAMPLES },
];
