import type { ClassificationSurface } from './ai-classification-engine.types.js';

/** n99-2.6 — needless clarify fields trimmed when a safe default exists. */
export interface N99OverAskScenario {
  id: string;
  action: string;
  params: Record<string, unknown>;
  prompt?: string;
  surface?: ClassificationSurface;
  screenContext?: Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
  issues: Array<{ field: string; message: string }>;
  expectTrimmedFields: string[];
  expectAppliedDefaults?: Record<string, unknown>;
}

export const N99_OVER_ASK_RELATIVE_DATE_PROMPT =
  /\b(today|tomorrow|yesterday|this week|next week|tonight|this month|aysor|vagh@|vaxa|aysov|ays@|vagh|urbat|zavtra|segodnya|vchera)\b/i;

export const N99_OVER_ASK_NON_TODAY_PROMPT =
  /\b(yesterday|last week|last month|next month|on \d|\d{1,2}[/_-]\d{1,2}|20\d{2})\b/i;

export const N99_OVER_ASK_DATE_DEFAULT_ACTIONS = new Set([
  'show_appointments',
  'list_bookings',
  'check_availability',
  'summarize_day',
  'mark_no_shows',
  'day_replan',
  'no_show_recovery',
  'fill_unused_slots',
]);

export const N99_NO_CLARIFY_OVER_ASK_SCENARIOS: N99OverAskScenario[] = [
  {
    id: 'en-list-today-from-screen',
    action: 'list_bookings',
    params: {},
    screenContext: { date: '2026-06-09' },
    issues: [{ field: 'date', message: 'Date is required' }],
    expectTrimmedFields: ['date'],
  },
  {
    id: 'en-remind-screen-customer',
    action: 'send_reminder',
    params: { date: '2026-06-09' },
    screenContext: { customerName: 'Maria Lopez' },
    issues: [{ field: 'customerName', message: 'Customer is required' }],
    expectTrimmedFields: ['customerName'],
  },
  {
    id: 'en-list-today-from-prompt',
    action: 'list_bookings',
    params: {},
    prompt: "show today's appointments",
    issues: [{ field: 'date', message: 'Date is required' }],
    expectTrimmedFields: ['date'],
  },
  {
    id: 'en-show-tomorrow-prompt',
    action: 'show_appointments',
    params: {},
    prompt: 'show appointments tomorrow',
    issues: [{ field: 'date', message: 'Date is required' }],
    expectTrimmedFields: ['date'],
  },
  {
    id: 'en-summarize-day-implicit-today',
    action: 'summarize_day',
    params: {},
    prompt: 'how did we do today',
    issues: [{ field: 'date', message: 'Date is required' }],
    expectTrimmedFields: ['date'],
  },
  {
    id: 'en-check-availability-tomorrow',
    action: 'check_availability',
    params: { serviceName: 'Massage' },
    prompt: 'who is free tomorrow for massage',
    issues: [{ field: 'date', message: 'Date is required' }],
    expectTrimmedFields: ['date'],
  },
  {
    id: 'en-mark-no-shows-today',
    action: 'mark_no_shows',
    params: {},
    prompt: 'mark no-shows today',
    issues: [{ field: 'date', message: 'Date is required' }],
    expectTrimmedFields: ['date'],
  },
  {
    id: 'en-fill-gaps-this-week',
    action: 'fill_unused_slots',
    params: { employeeName: 'Gevorg Gasparyan' },
    prompt: 'fill gevorg gaps this week',
    issues: [{ field: 'date', message: 'Specify when to fill gaps' }],
    expectTrimmedFields: ['date'],
  },
  {
    id: 'en-cancel-screen-booking',
    action: 'cancel_bookings',
    params: {},
    screenContext: { bookingId: 'bk-screen-1', customerName: 'Maria Lopez' },
    issues: [{ field: 'date', message: 'Specify which bookings to cancel' }],
    expectTrimmedFields: ['date'],
  },
  {
    id: 'en-session-date-list',
    action: 'list_bookings',
    params: {},
    sessionContext: { date: '2026-06-10' },
    issues: [{ field: 'date', message: 'Date is required' }],
    expectTrimmedFields: ['date'],
  },
  {
    id: 'hy-list-today-prompt',
    action: 'list_bookings',
    params: {},
    prompt: 'ցույց տուր այսօրվա appointments-ը',
    issues: [{ field: 'date', message: 'Date is required' }],
    expectTrimmedFields: ['date'],
  },
  {
    id: 'customer-en-list-screen-date',
    action: 'list_bookings',
    params: {},
    surface: 'customer',
    screenContext: { date: '2026-06-11' },
    issues: [{ field: 'date', message: 'Date is required' }],
    expectTrimmedFields: ['date'],
  },
];

export const N99_OVER_ASK_VALIDATOR_SCENARIOS = [
  {
    id: 'validator-list-today-prompt',
    action: 'list_bookings',
    prompt: "list today's bookings",
    params: {},
    expectOk: true,
  },
  {
    id: 'validator-summarize-day-default',
    action: 'summarize_day',
    prompt: 'summarize the day',
    params: {},
    expectOk: true,
  },
  {
    id: 'validator-check-tomorrow',
    action: 'check_availability',
    prompt: 'any openings tomorrow',
    params: {},
    expectOk: true,
  },
  {
    id: 'validator-cancel-screen-booking',
    action: 'cancel_bookings',
    prompt: 'cancel this booking',
    params: { context: { bookingId: 'bk-1' } },
    expectOk: true,
  },
] as const;
