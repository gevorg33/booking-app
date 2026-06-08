import type { CommandSurface } from './ai-command-registry.types.js';
import type { AccessTier } from './access-control.matrix.js';
import type { PlanTierId } from '../billing/plan-limits.js';

/** parity-3.2 — NL goal scenarios (dashboard agent mode). */
export const GOAL_EXECUTION_SCENARIOS = [
  {
    id: 'stylist-end-to-end-en',
    surface: 'dashboard' as const,
    prompt: 'Set up my new stylist Anna end-to-end from weekday template and assign haircut and color',
    recipeId: 'dashboard_new_stylist_setup',
    orderedActions: [
      'assign_employee_services',
      'apply_schedule',
      'create_direct_schedule',
      'fill_unused_slots',
    ],
    paramChecks: [{ stepIndex: 0, key: 'employeeName', value: 'Anna' }],
  },
  {
    id: 'provider-full-setup',
    surface: 'dashboard' as const,
    prompt:
      'Onboard new provider Jake completely — assign massage and facial, apply weekday template, enable online booking',
    recipeId: 'dashboard_new_stylist_setup',
    minSteps: 3,
    actions: [
      'assign_employee_services',
      'apply_schedule',
      'fill_unused_slots',
    ],
  },
  {
    id: 'stylist-setup-hy',
    surface: 'dashboard' as const,
    prompt: 'Նոր stylist-ը ամբողջությամբ կարգավորիր weekday template-ից',
    recipeId: 'dashboard_new_stylist_setup',
    minSteps: 2,
  },
] as const;

export const GOAL_EXECUTION_PROBE_BOUNDS = {
  ownerBusiness: {
    surface: 'dashboard' as const,
    accessTier: 'owner' as const,
    planTierId: 'business' as const,
  },
  staffBusiness: {
    surface: 'dashboard' as const,
    accessTier: 'staff' as const,
    planTierId: 'business' as const,
  },
} as const;

export interface GoalPlannerBounds {
  surface: CommandSurface;
  accessTier: AccessTier;
  planTierId?: PlanTierId;
}

/** Documented mapping from product language → registry intent ids (parity-3.2). */
export const GOAL_STEP_INTENT_LABELS: Record<string, string> = {
  assign_employee_services: 'assign services',
  apply_schedule: 'set schedule',
  create_direct_schedule: 'set bookable hours',
  fill_unused_slots: 'enable online booking slots',
};
