import {
  type AccessTier,
  isDashboardIntentAllowed,
  isProviderIntentAllowed,
  resolveAccessTier,
  tierAccessSummary,
} from './access-control.matrix.js';

export type { AccessTier } from './access-control.matrix.js';

export type AiSurface = 'dashboard' | 'provider';

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
  'resolve_conflicts',
  'reassign_cancelled',
  'mark_no_shows',
  'payment_sweep',
  'update_bookings',
  'day_replan',
  'unknown',
] as const;

/** Provider mobile intents. */
export const PROVIDER_INTENTS = [
  'cancel_bookings',
  'update_bookings',
  'list_bookings',
  'summarize_day',
  'reschedule_booking',
  'fill_unused_slots',
  'check_availability',
  'block_schedule',
  'summarize_utilization',
  'mark_no_shows',
  'payment_sweep',
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
  'assign_employee_services',
  'optimize_schedule',
  'resolve_conflicts',
  'reassign_cancelled',
  'mark_no_shows',
  'payment_sweep',
  'update_bookings',
  'day_replan',
]);

/** Map JWT membershipRole (or legacy role string) to access tier. */
export function normalizeActorRole(role?: string | null): AccessTier {
  return resolveAccessTier(role);
}

export function getAllowedIntents(surface: AiSurface, tier: AccessTier): readonly string[] {
  const base = surface === 'dashboard' ? DASHBOARD_INTENTS : PROVIDER_INTENTS;
  const allowed = (action: string) =>
    surface === 'dashboard'
      ? isDashboardIntentAllowed(tier, action)
      : isProviderIntentAllowed(tier, action);
  return base.filter((a) => allowed(a));
}

export function isIntentAllowed(surface: AiSurface, tier: AccessTier, action: string): boolean {
  if (action === 'unknown' || action === 'error' || action === 'security_blocked') return true;
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
    ].includes(action);
  }
  return DASHBOARD_MUTATING.has(action);
}

export function capabilityMatrixForPrompt(surface: AiSurface, tier: AccessTier): string {
  const allowed = getAllowedIntents(surface, tier);
  return `${tierAccessSummary(tier)}. Allowed AI actions (${surface}): ${allowed.join(', ')}`;
}
