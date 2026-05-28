/** Query keys invalidated after AI schedule/booking mutations */
export const AI_MUTATION_QUERY_KEYS = [
  'bookings',
  'provider-calendar',
  'services',
  'block-schedules',
  'schedule-templates',
  'agent-tasks',
  'dashboard-overview',
] as const;

export const AI_SCHEDULE_EXAMPLES = [
  'Apply weekday template to all providers this week',
  'Block lunch 12:00–13:00 for everyone Mon–Fri this week',
  'Fill gaps between 9–19:00 for Gevorg this week',
  'Block May 30 entirely for all providers',
  'Set up this week\'s schedule for my team',
];

export const AI_BOOKING_EXAMPLES = [
  'Show all appointments for tomorrow',
  'Cancel all facemassage appointments tomorrow',
  'Move Maria\'s 14:00 appointment to 16:00',
  'Summarize utilization this week',
];

export const AI_PAGE_SUGGESTIONS: Record<string, string[]> = {
  '/dashboard/schedule': [
    'Apply weekday template to Gevorg this week',
    'Block 12:00–13:00 lunch Mon–Fri for all providers',
    'Fill schedule gaps between 9–19:00 today',
  ],
  '/dashboard/calendar': [
    'Show Gevorg\'s schedule tomorrow',
    'Fill gaps for all providers this week',
    'Resolve scheduling conflicts this week',
  ],
  '/dashboard/bookings': [
    'Show all appointments for today',
    'Cancel all bookings for tomorrow',
    'Book facemassage with Gevorg tomorrow at 10:00',
  ],
  '/dashboard/appointments': [
    'Summarize today for all providers',
    'Show cancelled appointments this week',
  ],
  '/dashboard/employees': [
    'Assign all massage services to Gevorg',
  ],
  '/dashboard/services': [
    'Add services: facemassage 60min $50, haircut 30min $25',
  ],
  '/dashboard/ai-ops': [
    'Optimize next week schedule',
    'Fill all empty slots this week',
    'Who has the most schedule gaps?',
  ],
  '/dashboard': [],
};

export interface AiPageContext {
  route?: string;
  employeeName?: string | null;
  date?: string | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  templateName?: string | null;
}

let pageContext: AiPageContext = {};

export function setAiPageContext(ctx: AiPageContext) {
  pageContext = { ...pageContext, ...ctx };
}

export function getAiPageContext(): AiPageContext {
  return pageContext;
}

export function clearAiPageContext() {
  pageContext = {};
}
