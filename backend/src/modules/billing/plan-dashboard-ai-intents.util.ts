import type { PlanTierId } from './plan-limits.js';

/** Solo plan: simple booking ops only (see PLANS.md § AI). */
export const SOLO_DENIED_DASHBOARD_AI_INTENTS = new Set([
  'optimize_schedule',
  'day_replan',
  'bulk_smart_cancel',
  'setup_week_schedule',
  'swap_schedules',
  'rebalance_capacity',
  'holiday_mode',
  'onboard_provider_schedule',
  'clear_schedule',
  'resolve_conflicts',
  'reassign_cancelled',
  'fill_slot_from_waitlist',
  'payment_sweep',
  'mark_no_shows',
  'no_show_recovery',
  'sick_day_replan',
  'import_services_from_menu',
  'update_service_prices',
  'staff_service_matrix',
  'assign_employee_services',
  'create_direct_schedule',
  'apply_schedule',
  'create_schedule_template',
  'list_schedule_gaps',
  'fill_unused_slots',
  'summarize_utilization',
  'summarize_customers',
  'summarize_staff',
  'analyze_services',
  'hide_appointments_from_calendar',
  'unhide_appointments_from_calendar',
]);

export function isDashboardAiIntentAllowedByPlan(
  planTierId: PlanTierId,
  action: string,
): boolean {
  if (action === 'unknown' || action === 'error' || action === 'security_blocked') {
    return true;
  }
  if (planTierId !== 'solo') return true;
  return !SOLO_DENIED_DASHBOARD_AI_INTENTS.has(action);
}

export function getPlanDeniedDashboardIntents(planTierId: PlanTierId): string[] {
  if (planTierId !== 'solo') return [];
  return [...SOLO_DENIED_DASHBOARD_AI_INTENTS].sort();
}
