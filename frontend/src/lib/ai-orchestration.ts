/** Query keys invalidated after AI schedule/booking mutations */
export const AI_MUTATION_QUERY_KEYS = [
  'bookings',
  'provider-calendar',
  'services',
  'block-schedules',
  'schedule-templates',
  'agent-tasks',
  'dashboard-overview',
  'appointments-dashboard',
  'customers-dashboard',
] as const;

export const AI_WEEKLY_TEAM_SCHEDULE_EXAMPLE =
  'Apply schedule for all employees for their services this week between 9–19:00; make 12:00–13:00 unavailable';

export interface AiExampleTenantContext {
  employees: Array<{ id: string; name: string; serviceIds?: string[]; isActive?: boolean }>;
  services: Array<{ id: string; name: string; isActive?: boolean }>;
}

function pickExampleEmployee(ctx: AiExampleTenantContext) {
  return ctx.employees.find((e) => e.isActive !== false && e.name?.trim()) ?? null;
}

function pickExampleService(ctx: AiExampleTenantContext, employee: { serviceIds?: string[] } | null) {
  const services = ctx.services.filter((s) => s.isActive !== false && s.name?.trim());
  if (employee?.serviceIds?.length) {
    const assigned = services.find((s) => employee.serviceIds!.includes(s.id));
    if (assigned) return assigned;
  }
  return services[0] ?? null;
}

/** Command-bar suggestions using the tenant's real providers and services. */
export function buildAiCommandBarExamples(ctx?: AiExampleTenantContext | null): string[] {
  const employee = ctx ? pickExampleEmployee(ctx) : null;
  const service = ctx ? pickExampleService(ctx, employee) : null;
  const provider = employee?.name?.trim() || 'your provider';
  const serviceName = service?.name?.trim() || 'a service';

  return [
    'Apply weekday template to all providers this week',
    'Block lunch 12:00–13:00 for everyone Mon–Fri this week',
    `Fill gaps between 9–19:00 for ${provider} this week`,
    'How many appointments today?',
    AI_WEEKLY_TEAM_SCHEDULE_EXAMPLE,
    `Cancel booking today for ${provider} from 13:00–14:00`,
    `Book ${serviceName} today for ${provider} at the nearest available time`,
  ];
}

/** Static fallback when tenant catalog is not loaded yet. */
export const AI_COMMAND_BAR_EXAMPLES = buildAiCommandBarExamples();

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
    'Top 10 customers who paid the most',
    'Which customer has the most no-shows?',
    'Show at-risk customers',
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
    'Prefer: summarize_utilization, summarize_bookings revenue/count, summarize_customers top_spenders.',
  '/dashboard/ai-ops':
    'Prefer: optimize_schedule, resolve_conflicts, reassign_cancelled, fill_unused_slots.',
  '/dashboard/reviews':
    'Prefer: summarize_customers no-shows, at_risk, top_spenders.',
};

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
): AiPageContext {
  const route = pathname || page.route || session.route;
  return {
    ...session,
    ...page,
    route,
    routeHint: route ? (AI_ROUTE_CONTEXT_HINTS[route] ?? null) : null,
    timeZone: session.timeZone ?? page.timeZone ?? getBrowserTimeZone(),
  };
}

export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function getSuggestionsForRoute(route: string): string[] {
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
