import type { DecomposedIntentStep } from './intent-decomposition.types.js';
import { GOAL_STEP_INTENT_LABELS } from './ai-goal-execution.fixtures.js';

/** parity-3.5 — user-facing labels for multi-step plan preview. */
export const MULTI_STEP_INTENT_LABELS: Record<string, string> = {
  ...GOAL_STEP_INTENT_LABELS,
  list_bookings: 'list appointments',
  show_appointments: 'show appointments',
  cancel_bookings: 'cancel appointments',
  create_booking: 'book appointment',
  reschedule_booking: 'reschedule appointment',
  block_schedule: 'block schedule',
  clear_schedule: 'clear schedule',
  create_service: 'add service',
  mark_paid: 'mark paid',
  payment_sweep: 'collect payments',
};

export interface PlanPreviewRollbackProbe {
  id: string;
  steps: DecomposedIntentStep[];
  confirmed: boolean;
  expectsPreview: boolean;
  minPreviewSteps?: number;
}

/** parity-3.5 — multi-step preview + atomic rollback probes. */
export const PLAN_PREVIEW_ROLLBACK_PROBES: PlanPreviewRollbackProbe[] = [
  {
    id: 'goal-stylist-setup-preview',
    steps: [
      {
        action: 'assign_employee_services',
        params: { employeeName: 'Anna', serviceNames: ['haircut'] },
        reasoning: 'Step 1',
      },
      {
        action: 'apply_schedule',
        params: { employeeName: 'Anna', templateName: 'weekday' },
        reasoning: 'Step 2',
      },
      {
        action: 'create_direct_schedule',
        params: { employeeName: 'Anna' },
        reasoning: 'Step 3',
      },
    ],
    confirmed: false,
    expectsPreview: true,
    minPreviewSteps: 3,
  },
  {
    id: 'compound-assign-and-schedule-preview',
    steps: [
      {
        action: 'assign_employee_services',
        params: { employeeName: 'Anna', serviceNames: ['haircut'] },
        reasoning: 'Compound 1',
      },
      {
        action: 'apply_schedule',
        params: { employeeName: 'Anna', templateName: 'weekday' },
        reasoning: 'Compound 2',
      },
    ],
    confirmed: false,
    expectsPreview: true,
    minPreviewSteps: 2,
  },
  {
    id: 'confirmed-skips-preview',
    steps: [
      {
        action: 'assign_employee_services',
        params: { employeeName: 'Anna' },
        reasoning: 'Confirmed',
      },
      {
        action: 'create_direct_schedule',
        params: { employeeName: 'Anna' },
        reasoning: 'Confirmed',
      },
    ],
    confirmed: true,
    expectsPreview: false,
  },
  {
    id: 'read-only-compound-skips-preview',
    steps: [
      {
        action: 'list_bookings',
        params: { date: '2026-06-08' },
        reasoning: 'Read',
      },
      {
        action: 'summarize_day',
        params: { date: '2026-06-08' },
        reasoning: 'Read',
      },
    ],
    confirmed: false,
    expectsPreview: false,
  },
];

export const ATOMIC_ROLLBACK_UNDOABLE_PROBE = {
  id: 'all-undoable-agent-steps',
  agentSteps: [
    { action: 'assign_employee_services' },
    { action: 'create_direct_schedule' },
  ],
  expectsSupported: true,
} as const;

export const ATOMIC_ROLLBACK_BLOCKED_PROBE = {
  id: 'non-undoable-agent-step-blocks-atomic',
  agentSteps: [
    { action: 'assign_employee_services' },
    { action: 'apply_template' },
  ],
  expectsSupported: false,
  blockedAction: 'apply_template',
} as const;
