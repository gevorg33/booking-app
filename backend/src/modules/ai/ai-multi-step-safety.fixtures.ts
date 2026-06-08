import type { DecomposedIntentStep } from './intent-decomposition.types.js';

export const MULTI_STEP_SAFETY_DESTRUCTIVE_ACTIONS = new Set([
  'cancel_bookings',
  'bulk_smart_cancel',
  'clear_schedule',
  'hide_appointments_from_calendar',
  'update_bookings',
  'mark_no_shows',
  'payment_sweep',
  'day_replan',
  'sick_day_replan',
  'bulk_create_catalog',
  'staff_service_matrix',
]);

export interface MultiStepSafetyProbe {
  id: string;
  parentAction: 'goal_execution' | 'compound_intent';
  steps: DecomposedIntentStep[];
  bookingIds?: string[];
  expectBlastGate: boolean;
  expectDryRun: boolean;
  proposeOnlyStep?: string;
}

/** parity-3.6 — blast-radius caps + propose-only dry-run for multi-step plans. */
export const MULTI_STEP_SAFETY_PROBES: MultiStepSafetyProbe[] = [
  {
    id: 'compound-cancel-and-hide-over-cap',
    parentAction: 'compound_intent',
    steps: [
      {
        action: 'cancel_bookings',
        params: {
          bookingIds: Array.from({ length: 30 }, (_, i) => `bk-${i}`),
        },
        reasoning: 'Bulk cancel',
      },
      {
        action: 'hide_appointments_from_calendar',
        params: { statusFilter: 'cancelled' },
        reasoning: 'Hide cancelled',
      },
    ],
    expectBlastGate: true,
    expectDryRun: true,
  },
  {
    id: 'compound-payment-sweep-propose-only',
    parentAction: 'compound_intent',
    steps: [
      {
        action: 'list_bookings',
        params: { date: '2026-06-08' },
        reasoning: 'Read',
      },
      {
        action: 'payment_sweep',
        params: { date: '2026-06-08' },
        reasoning: 'Sweep',
      },
    ],
    expectBlastGate: false,
    expectDryRun: true,
    proposeOnlyStep: 'payment_sweep',
  },
  {
    id: 'destructive-multi-step-dry-run',
    parentAction: 'compound_intent',
    steps: [
      {
        action: 'cancel_bookings',
        params: { bookingIds: ['bk-1', 'bk-2'] },
        reasoning: 'Cancel',
      },
      {
        action: 'hide_appointments_from_calendar',
        params: { bookingIds: ['bk-1', 'bk-2'] },
        reasoning: 'Hide',
      },
    ],
    expectBlastGate: false,
    expectDryRun: true,
  },
];
