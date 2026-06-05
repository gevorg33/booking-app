import {
  type AccessTier,
  isDashboardIntentAllowed,
  isProviderIntentAllowed,
  resolveAccessTier,
  tierAccessSummary,
} from './access-control.matrix.js';
import { PUBLIC_ASSISTANT_INTENTS } from './ai-sprint25.util.js';
import {
  getPlanDeniedDashboardIntents,
  isDashboardAiIntentAllowedByPlan,
} from '../billing/plan-dashboard-ai-intents.util.js';
import type { PlanTierId } from '../billing/plan-limits.js';

export type { AccessTier } from './access-control.matrix.js';

export type AiSurface = 'dashboard' | 'provider' | 'public';

/** @deprecated Use AccessTier — kept for backward-compatible exports */
export type AiActorRole = AccessTier;

/** Dashboard intents (full Orchestrix). */
export const DASHBOARD_INTENTS = [
  'create_booking',
  'create_service',
  'create_services',
  'cancel_bookings',
  'bulk_smart_cancel',
  'hide_appointments_from_calendar',
  'unhide_appointments_from_calendar',
  'fill_slot_from_waitlist',
  'list_bookings',
  'show_appointments',
  'check_availability',
  'reschedule_booking',
  'summarize_day',
  'summarize_bookings',
  'analyze_appointments',
  'analyze_services',
  'summarize_staff',
  'lookup_customer',
  'summarize_waitlist',
  'lookup_service_assignment',
  'list_services',
  'list_employees',
  'list_templates',
  'create_schedule_template',
  'optimize_schedule',
  'fill_unused_slots',
  'list_schedule_gaps',
  'apply_schedule',
  'block_schedule',
  'clear_schedule',
  'create_direct_schedule',
  'assign_employee_services',
  'summarize_utilization',
  'summarize_customers',
  'setup_week_schedule',
  'swap_schedules',
  'rebalance_capacity',
  'holiday_mode',
  'onboard_provider_schedule',
  'resolve_conflicts',
  'reassign_cancelled',
  'mark_no_shows',
  'no_show_recovery',
  'payment_sweep',
  'update_bookings',
  'day_replan',
  'sick_day_replan',
  'import_services_from_menu',
  'update_service_prices',
  'staff_service_matrix',
  'check_schedule_compliance',
  'revenue_forecast',
  'unknown',
] as const;

/** Provider mobile intents. */
export const PROVIDER_INTENTS = [
  'cancel_bookings',
  'update_bookings',
  'list_bookings',
  'show_appointments',
  'summarize_day',
  'reschedule_booking',
  'fill_unused_slots',
  'check_availability',
  'block_schedule',
  'summarize_utilization',
  'mark_no_shows',
  'payment_sweep',
  'coordinate_waitlist_offer',
  'unknown',
] as const;

const DASHBOARD_MUTATING = new Set([
  'create_booking',
  'create_service',
  'create_services',
  'cancel_bookings',
  'bulk_smart_cancel',
  'hide_appointments_from_calendar',
  'unhide_appointments_from_calendar',
  'fill_slot_from_waitlist',
  'reschedule_booking',
  'fill_unused_slots',
  'apply_schedule',
  'create_schedule_template',
  'block_schedule',
  'clear_schedule',
  'create_direct_schedule',
  'setup_week_schedule',
  'swap_schedules',
  'rebalance_capacity',
  'holiday_mode',
  'onboard_provider_schedule',
  'assign_employee_services',
  'optimize_schedule',
  'resolve_conflicts',
  'reassign_cancelled',
  'mark_no_shows',
  'no_show_recovery',
  'payment_sweep',
  'update_bookings',
  'day_replan',
  'sick_day_replan',
  'import_services_from_menu',
  'update_service_prices',
  'staff_service_matrix',
]);

/** Map JWT membershipRole (or legacy role string) to access tier. */
export function normalizeActorRole(role?: string | null): AccessTier {
  return resolveAccessTier(role);
}

export function getAllowedIntents(surface: AiSurface, tier: AccessTier): readonly string[] {
  if (surface === 'public') return PUBLIC_ASSISTANT_INTENTS;
  const base = surface === 'dashboard' ? DASHBOARD_INTENTS : PROVIDER_INTENTS;
  const allowed = (action: string) =>
    surface === 'dashboard'
      ? isDashboardIntentAllowed(tier, action)
      : isProviderIntentAllowed(tier, action);
  return base.filter((a) => allowed(a));
}

export function getEffectiveAllowedIntents(
  surface: AiSurface,
  accessTier: AccessTier,
  planTierId: PlanTierId = 'solo',
): readonly string[] {
  return getAllowedIntents(surface, accessTier).filter((action) =>
    surface === 'dashboard'
      ? isDashboardAiIntentAllowedByPlan(planTierId, action)
      : true,
  );
}

export interface AiCapabilitiesView {
  surface: AiSurface;
  accessTier: AccessTier;
  planTierId: PlanTierId;
  allowedIntents: readonly string[];
  planDeniedIntents: readonly string[];
  hints: string;
}

export function buildCapabilitiesView(
  surface: AiSurface,
  membershipRole: string | undefined,
  planTierId: PlanTierId,
): AiCapabilitiesView {
  const accessTier = normalizeActorRole(membershipRole);
  return {
    surface,
    accessTier,
    planTierId,
    allowedIntents: getEffectiveAllowedIntents(surface, accessTier, planTierId),
    planDeniedIntents:
      surface === 'dashboard' ? getPlanDeniedDashboardIntents(planTierId) : [],
    hints: capabilityMatrixForPrompt(surface, accessTier),
  };
}

export function isIntentAllowed(surface: AiSurface, tier: AccessTier, action: string): boolean {
  if (action === 'unknown' || action === 'error' || action === 'security_blocked') return true;
  if (surface === 'public') {
    return (PUBLIC_ASSISTANT_INTENTS as readonly string[]).includes(action);
  }
  return surface === 'dashboard'
    ? isDashboardIntentAllowed(tier, action)
    : isProviderIntentAllowed(tier, action);
}

export function isMutatingIntent(surface: AiSurface, action: string): boolean {
  if (surface === 'provider') {
    return [
      'cancel_bookings',
      'update_bookings',
      'reschedule_booking',
      'fill_unused_slots',
      'block_schedule',
      'mark_no_shows',
      'payment_sweep',
      'coordinate_waitlist_offer',
    ].includes(action);
  }
  return DASHBOARD_MUTATING.has(action);
}

export function capabilityMatrixForPrompt(surface: AiSurface, tier: AccessTier): string {
  if (surface === 'public') {
    return `Public booking assistant. Allowed actions: ${PUBLIC_ASSISTANT_INTENTS.join(', ')}`;
  }
  const allowed = getAllowedIntents(surface, tier);
  return `${tierAccessSummary(tier)}. Allowed AI actions (${surface}): ${allowed.join(', ')}`;
}
