export type AiSurface = 'dashboard' | 'provider';
export type AiActorRole = 'owner' | 'manager' | 'receptionist' | 'provider' | 'contributor';

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
  'day_replan',
]);

const ROLE_DENIED_DASHBOARD: Record<AiActorRole, Set<string>> = {
  owner: new Set(),
  manager: new Set(),
  receptionist: new Set(['optimize_schedule', 'assign_employee_services', 'create_services']),
  provider: new Set([
    'optimize_schedule',
    'assign_employee_services',
    'create_services',
    'create_service',
    'setup_week_schedule',
    'resolve_conflicts',
    'reassign_cancelled',
    'day_replan',
    'payment_sweep',
  ]),
  contributor: new Set(['optimize_schedule', 'day_replan', 'payment_sweep']),
};

const ROLE_DENIED_PROVIDER: Record<AiActorRole, Set<string>> = {
  owner: new Set(),
  manager: new Set(),
  receptionist: new Set(),
  provider: new Set(['day_replan', 'payment_sweep']),
  contributor: new Set(['day_replan', 'payment_sweep', 'summarize_utilization']),
};

export function normalizeActorRole(role?: string | null): AiActorRole {
  const r = (role ?? 'owner').toLowerCase();
  if (r === 'manager' || r === 'receptionist' || r === 'provider' || r === 'contributor') {
    return r;
  }
  return 'owner';
}

export function getAllowedIntents(surface: AiSurface, role: AiActorRole): readonly string[] {
  const base = surface === 'dashboard' ? DASHBOARD_INTENTS : PROVIDER_INTENTS;
  const denied =
    surface === 'dashboard' ? ROLE_DENIED_DASHBOARD[role] : ROLE_DENIED_PROVIDER[role];
  return base.filter((a) => !denied.has(a));
}

export function isIntentAllowed(
  surface: AiSurface,
  role: AiActorRole,
  action: string,
): boolean {
  if (action === 'unknown' || action === 'error') return true;
  return getAllowedIntents(surface, role).includes(action);
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

export function capabilityMatrixForPrompt(surface: AiSurface, role: AiActorRole): string {
  const allowed = getAllowedIntents(surface, role);
  return `Allowed actions for this user (${surface}, role=${role}): ${allowed.join(', ')}`;
}
