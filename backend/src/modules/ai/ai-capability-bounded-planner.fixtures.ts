import type { AccessTier } from './access-control.matrix.js';
import type { AiSurface } from './ai-capability.matrix.js';
import type { PlanTierId } from '../billing/plan-limits.js';

export interface CapabilityPlannerBounds {
  surface: AiSurface;
  accessTier: AccessTier;
  planTierId?: PlanTierId;
}

/** parity-3.1 — representative capability-bounded planner probes. */
export const CAPABILITY_PLANNER_PROBE_SCENARIOS = [
  {
    id: 'staff-dashboard-excludes-payment-sweep',
    bounds: {
      surface: 'dashboard' as const,
      accessTier: 'staff' as const,
      planTierId: 'solo' as const,
    },
    deniedAction: 'payment_sweep',
    allowedAction: 'list_bookings',
  },
  {
    id: 'owner-dashboard-includes-list-employees',
    bounds: {
      surface: 'dashboard' as const,
      accessTier: 'owner' as const,
      planTierId: 'solo' as const,
    },
    deniedAction: null,
    allowedAction: 'list_employees',
  },
  {
    id: 'client-customer-book-package',
    bounds: {
      surface: 'customer' as const,
      accessTier: 'client' as const,
      planTierId: 'solo' as const,
    },
    deniedAction: 'create_booking',
    allowedAction: 'book_package',
  },
  {
    id: 'staff-provider-excludes-payment-sweep',
    bounds: {
      surface: 'provider' as const,
      accessTier: 'staff' as const,
      planTierId: 'solo' as const,
    },
    deniedAction: 'payment_sweep',
    allowedAction: 'list_bookings',
  },
] as const;

export const CAPABILITY_PLANNER_OUT_OF_SCOPE_PLAN = {
  intent: 'staff list employees attempt',
  steps: [
    {
      id: 's1',
      action: 'list_bookings',
      description: 'List bookings',
      params: { date: '2026-06-08' },
      dependsOn: [],
    },
    {
      id: 's2',
      action: 'list_employees',
      description: 'List staff directory',
      params: {},
      dependsOn: ['s1'],
    },
  ],
} as const;
