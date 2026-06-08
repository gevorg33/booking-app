import type { ClassificationSurface } from './ai-classification-engine.types.js';

/** n99-2.8 — ambiguous/destructive must clarify; counts toward n99-1, not no-clarify failures. */
export type NoClarifyGuardReason =
  | 'ambiguous_or_unknown'
  | 'low_action_confidence'
  | 'high_risk_action'
  | 'destructive_scope_unconfirmed'
  | 'blast_radius_over_cap';

export interface N99AmbiguousDestructiveScenario {
  id: string;
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  surface?: ClassificationSurface;
  actionConfidence?: number;
  sessionContext?: Record<string, unknown>;
  expectBlocked: boolean;
  expectBlockReason?: NoClarifyGuardReason;
  expectClarify?: boolean;
  expectCountsTowardClarifySuccess?: boolean;
}

export const N99_AMBIGUOUS_DESTRUCTIVE_SCENARIOS: N99AmbiguousDestructiveScenario[] = [
  {
    id: 'en-bulk-cancel-low-confidence',
    prompt: 'cancel all appointments tomorrow',
    action: 'cancel_bookings',
    params: { date: '2026-06-09', allAppointments: true },
    surface: 'dashboard',
    actionConfidence: 0.72,
    expectBlocked: true,
    expectBlockReason: 'high_risk_action',
    expectClarify: true,
    expectCountsTowardClarifySuccess: true,
  },
  {
    id: 'en-ambiguous-intent',
    prompt: 'change it',
    action: 'unknown',
    params: {},
    surface: 'dashboard',
    actionConfidence: 0.55,
    expectBlocked: true,
    expectBlockReason: 'ambiguous_or_unknown',
    expectClarify: true,
    expectCountsTowardClarifySuccess: true,
  },
  {
    id: 'hy-high-risk-no-autofill',
    prompt: 'չեղարկել բոլորը',
    action: 'cancel_bookings',
    params: { allAppointments: true },
    surface: 'dashboard',
    actionConfidence: 0.7,
    expectBlocked: true,
    expectBlockReason: 'high_risk_action',
    expectClarify: true,
    expectCountsTowardClarifySuccess: true,
  },
  {
    id: 'en-clear-schedule-unconfirmed',
    prompt: 'clear gevorg schedule tomorrow',
    action: 'clear_schedule',
    params: { employeeName: 'Gevorg', date: '2026-06-09' },
    surface: 'dashboard',
    actionConfidence: 0.88,
    expectBlocked: true,
    expectBlockReason: 'destructive_scope_unconfirmed',
    expectClarify: true,
    expectCountsTowardClarifySuccess: true,
  },
  {
    id: 'en-merge-customers-low-confidence',
    prompt: 'merge jane accounts',
    action: 'merge_customers',
    params: { customerName: 'Jane Doe', targetCustomerName: 'Jane Smith' },
    surface: 'dashboard',
    actionConfidence: 0.64,
    expectBlocked: true,
    expectBlockReason: 'low_action_confidence',
    expectClarify: true,
    expectCountsTowardClarifySuccess: true,
  },
  {
    id: 'provider-cancel-all-low-confidence',
    prompt: 'cancel everyone today',
    action: 'cancel_bookings',
    params: { date: '2026-06-09', allAppointments: true },
    surface: 'provider',
    actionConfidence: 0.71,
    expectBlocked: true,
    expectBlockReason: 'high_risk_action',
    expectClarify: true,
    expectCountsTowardClarifySuccess: true,
  },
  {
    id: 'customer-reschedule-low-confidence',
    prompt: 'move my appointment',
    action: 'reschedule_booking',
    params: {},
    surface: 'customer',
    actionConfidence: 0.6,
    expectBlocked: true,
    expectBlockReason: 'low_action_confidence',
    expectClarify: true,
    expectCountsTowardClarifySuccess: true,
  },
  {
    id: 'public-ambiguous-book',
    prompt: 'book something',
    action: 'unknown',
    params: {},
    surface: 'public',
    actionConfidence: 0.5,
    expectBlocked: true,
    expectBlockReason: 'ambiguous_or_unknown',
    expectClarify: true,
    expectCountsTowardClarifySuccess: true,
  },
  {
    id: 'ru-bulk-update-low-confidence',
    prompt: 'отменить все записи завтра',
    action: 'cancel_bookings',
    params: { date: '2026-06-09', allAppointments: true },
    surface: 'dashboard',
    actionConfidence: 0.69,
    expectBlocked: true,
    expectBlockReason: 'high_risk_action',
    expectClarify: true,
    expectCountsTowardClarifySuccess: true,
  },
  {
    id: 'en-blast-radius-over-cap',
    prompt: 'cancel these 26 bookings',
    action: 'cancel_bookings',
    params: {
      bookingIds: Array.from({ length: 26 }, (_, index) => `bk-${index + 1}`),
    },
    surface: 'dashboard',
    actionConfidence: 0.9,
    expectBlocked: true,
    expectBlockReason: 'blast_radius_over_cap',
    expectClarify: true,
    expectCountsTowardClarifySuccess: true,
  },
  {
    id: 'en-confirmed-high-risk-passes',
    prompt: 'cancel these 3 bookings',
    action: 'cancel_bookings',
    params: {
      bookingIds: ['bk-1', 'bk-2', 'bk-3'],
    },
    surface: 'dashboard',
    actionConfidence: 0.9,
    sessionContext: { confirmed: true },
    expectBlocked: false,
  },
  {
    id: 'en-safe-read-low-confidence',
    prompt: 'show schedule',
    action: 'show_appointments',
    params: {},
    surface: 'dashboard',
    actionConfidence: 0.58,
    expectBlocked: true,
    expectBlockReason: 'low_action_confidence',
    expectClarify: true,
    expectCountsTowardClarifySuccess: true,
  },
];

/** @deprecated — use N99_AMBIGUOUS_DESTRUCTIVE_SCENARIOS */
export const N99_NO_CLARIFY_GUARDRAIL_SCENARIOS = N99_AMBIGUOUS_DESTRUCTIVE_SCENARIOS;
