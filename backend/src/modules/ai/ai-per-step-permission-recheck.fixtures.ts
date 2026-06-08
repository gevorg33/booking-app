import type { PlanTierId } from '../billing/plan-limits.js';
import type { CapabilityPlannerBounds } from './ai-capability-bounded-planner.util.js';
import type { DecomposedIntentStep } from './intent-decomposition.types.js';

export interface PerStepPermissionEscalationProbe {
  id: string;
  bounds: CapabilityPlannerBounds;
  steps: DecomposedIntentStep[];
  deniedAtStepIndex: number;
  deniedAction: string;
  allowedBeforeDenial: number;
}

/** parity-3.4 — chained in-scope steps must not smuggle privileged actions at execute time. */
export const PER_STEP_PERMISSION_ESCALATION_PROBES: PerStepPermissionEscalationProbe[] =
  [
    {
      id: 'staff-compound-list-employees-after-bookings',
      bounds: {
        surface: 'dashboard',
        accessTier: 'staff',
        planTierId: 'solo',
      },
      steps: [
        {
          action: 'list_bookings',
          params: { date: '2026-06-08' },
          reasoning: 'In-scope read',
        },
        {
          action: 'list_employees',
          params: {},
          reasoning: 'Privilege escalation attempt',
        },
      ],
      deniedAtStepIndex: 1,
      deniedAction: 'list_employees',
      allowedBeforeDenial: 1,
    },
    {
      id: 'staff-compound-payment-sweep-after-summarize',
      bounds: {
        surface: 'dashboard',
        accessTier: 'staff',
        planTierId: 'solo',
      },
      steps: [
        {
          action: 'summarize_day',
          params: { date: '2026-06-08' },
          reasoning: 'In-scope read',
        },
        {
          action: 'payment_sweep',
          params: { date: '2026-06-08' },
          reasoning: 'Payment sweep escalation',
        },
      ],
      deniedAtStepIndex: 1,
      deniedAction: 'payment_sweep',
      allowedBeforeDenial: 1,
    },
    {
      id: 'staff-provider-payment-sweep-after-bookings',
      bounds: {
        surface: 'provider',
        accessTier: 'staff',
        planTierId: 'solo',
      },
      steps: [
        {
          action: 'list_bookings',
          params: { date: '2026-06-08' },
          reasoning: 'In-scope provider read',
        },
        {
          action: 'payment_sweep',
          params: { date: '2026-06-08' },
          reasoning: 'Payment sweep escalation',
        },
      ],
      deniedAtStepIndex: 1,
      deniedAction: 'payment_sweep',
      allowedBeforeDenial: 1,
    },
  ];

export const PER_STEP_RUNTIME_BOUNDS_PROBE = {
  id: 'runtime-staff-bounds-block-owner-step',
  planTimeBounds: {
    surface: 'dashboard' as const,
    accessTier: 'owner' as const,
    planTierId: 'solo' as PlanTierId,
  },
  executeTimeBounds: {
    surface: 'dashboard' as const,
    accessTier: 'staff' as const,
    planTierId: 'solo' as PlanTierId,
  },
  steps: [
    {
      action: 'list_bookings',
      params: { date: '2026-06-08' },
      reasoning: 'Still in-scope for staff',
    },
    {
      action: 'list_employees',
      params: {},
      reasoning: 'Owner-only at execute time',
    },
  ] satisfies DecomposedIntentStep[],
  deniedAtStepIndex: 1,
  deniedAction: 'list_employees',
} as const;
