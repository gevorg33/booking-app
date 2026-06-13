import { MemberRole } from '../business/entities/business-member.entity.js';

/**
 * Product access tiers (maps to typical roles in the booking platform).
 *
 * | Tier    | Typical user              |
 * |---------|---------------------------|
 * | client  | Customer / public booking |
 * | staff   | Service provider, front desk contributor |
 * | manager | Manager, admin (team ops) |
 * | owner   | Business owner            |
 */
export type AccessTier = 'client' | 'staff' | 'manager' | 'owner';

export type DataCategory =
  | 'own_bookings'
  | 'public_services'
  | 'assigned_bookings'
  | 'limited_customer_info'
  | 'all_bookings'
  | 'staff_schedules'
  | 'staff_directory'
  | 'revenue_analytics'
  | 'crm_insights'
  | 'owner_operations';

/** What each tier may access (data categories). */
export const TIER_DATA_ACCESS: Record<AccessTier, ReadonlySet<DataCategory>> = {
  client: new Set(['own_bookings', 'public_services']),
  staff: new Set([
    'own_bookings',
    'public_services',
    'assigned_bookings',
    'limited_customer_info',
  ]),
  manager: new Set([
    'own_bookings',
    'public_services',
    'assigned_bookings',
    'limited_customer_info',
    'all_bookings',
    'staff_schedules',
    'staff_directory',
    'revenue_analytics',
    'crm_insights',
    'owner_operations',
  ]),
  owner: new Set([
    'own_bookings',
    'public_services',
    'assigned_bookings',
    'limited_customer_info',
    'all_bookings',
    'staff_schedules',
    'staff_directory',
    'revenue_analytics',
    'crm_insights',
    'owner_operations',
  ]),
};

export function resolveAccessTier(membershipRole?: string | null): AccessTier {
  switch ((membershipRole ?? '').toLowerCase()) {
    case MemberRole.OWNER:
    case 'owner':
      return 'owner';
    case MemberRole.ADMIN:
    case 'admin':
      return 'owner';
    case MemberRole.MANAGER:
    case 'manager':
      return 'manager';
    case MemberRole.STAFF:
    case 'staff':
    case MemberRole.CONTRIBUTOR:
    case 'contributor':
      return 'staff';
    default:
      return 'client';
  }
}

export function canAccessDataCategory(
  tier: AccessTier,
  category: DataCategory,
): boolean {
  return TIER_DATA_ACCESS[tier].has(category);
}

export function tierAccessSummary(tier: AccessTier): string {
  const labels: Record<AccessTier, string> = {
    client: 'Client — own bookings and public services only',
    staff:
      'Staff — assigned bookings and limited customer info; no revenue or owner data',
    manager: 'Manager — revenue, staff schedules, analytics, CRM insights',
    owner:
      'Owner — full business access including financials and owner operations',
  };
  return labels[tier];
}

/** Dashboard AI intents blocked per tier (deny-list). */
export const DASHBOARD_DENIED_BY_TIER: Record<
  AccessTier,
  ReadonlySet<string>
> = {
  client: new Set([
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
    'lookup_booking_tax_metadata',
    'summarize_customer_tax_paid',
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
    'unassign_employee_services',
    'transfer_employee_services',
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
    'create_employee',
    'update_employee',
    'invite_staff_member',
    'deactivate_employee',
    'configure_online_booking',
    'list_waitlist_entries',
    'offer_waitlist_slot',
    'open_billing_settings',
    'summarize_loyalty_program',
    'upload_patient_result',
    'explain_patient_results',
    'configure_test_reference_range',
    'list_abnormal_results',
  ]),
  staff: new Set([
    'list_employees',
    'summarize_staff',
    'analyze_services',
    'summarize_customers',
    'summarize_utilization',
    'summarize_waitlist',
    'optimize_schedule',
    'setup_week_schedule',
    'assign_employee_services',
    'unassign_employee_services',
    'transfer_employee_services',
    'create_employee',
    'update_employee',
    'invite_staff_member',
    'deactivate_employee',
    'configure_online_booking',
    'list_waitlist_entries',
    'offer_waitlist_slot',
    'open_billing_settings',
    'summarize_loyalty_program',
    'create_services',
    'create_service',
    'resolve_conflicts',
    'reassign_cancelled',
    'day_replan',
    'sick_day_replan',
    'payment_sweep',
    'mark_no_shows',
    'no_show_recovery',
    'update_bookings',
    'import_services_from_menu',
    'update_service_prices',
    'staff_service_matrix',
    'list_templates',
    'create_schedule_template',
    'bulk_smart_cancel',
    'hide_appointments_from_calendar',
    'unhide_appointments_from_calendar',
    'configure_business_currency',
    'configure_business_tax',
    'configure_privacy_retention',
    'configure_granular_consent',
    'enable_hipaa_mode',
    'configure_hipaa_session_timeout',
    'accept_hipaa_baa',
    'admin_delete_customer_data',
    'report_data_breach',
    'send_breach_notification',
    'list_breach_incidents',
    'view_phi_access_audit',
    'list_sub_processors',
    'explain_gdpr_checklist',
    'open_compliance_dashboard',
    'configure_stacked_tax_rules',
    'set_service_tax_rate',
    'configure_business_languages',
    'configure_business_date_format',
    'configure_package_localized_names',
    'configure_tour_service',
    'configure_clinic_service',
    'configure_recommendation_product',
    'link_recommended_products',
    'apply_tour_playbook',
    'apply_clinic_playbook',
    'bulk_strip_disabled_locale_translations',
    'migrate_dashboard_date_display',
    'notify_patient_result_ready',
    'bulk_update_service_currency',
  ]),
  manager: new Set(['optimize_schedule']),
  owner: new Set(),
};

/** Provider mobile intents blocked per tier. */
export const PROVIDER_DENIED_BY_TIER: Record<
  AccessTier,
  ReadonlySet<string>
> = {
  client: new Set([
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
  ]),
  staff: new Set([
    'payment_sweep',
    'summarize_utilization',
    'coordinate_waitlist_offer',
    'team_whos_next',
    'team_floor_status',
  ]),
  manager: new Set(),
  owner: new Set(),
};

export function isDashboardIntentAllowed(
  tier: AccessTier,
  action: string,
): boolean {
  if (
    action === 'unknown' ||
    action === 'error' ||
    action === 'security_blocked'
  )
    return true;
  return !DASHBOARD_DENIED_BY_TIER[tier].has(action);
}

export function isProviderIntentAllowed(
  tier: AccessTier,
  action: string,
): boolean {
  if (
    action === 'unknown' ||
    action === 'error' ||
    action === 'security_blocked'
  )
    return true;
  return !PROVIDER_DENIED_BY_TIER[tier].has(action);
}

/** Logged-in customer self-service — client tier only (ai-cmd-0.2). */
export function isCustomerIntentAllowed(
  tier: AccessTier,
  action: string,
): boolean {
  if (
    action === 'unknown' ||
    action === 'error' ||
    action === 'security_blocked'
  )
    return true;
  return tier === 'client';
}

/** Revenue / financial intents or metrics — manager+ only. */
export function isRevenueRelatedRequest(
  action: string,
  params: Record<string, unknown>,
  prompt: string,
): boolean {
  if (['payment_sweep', 'summarize_utilization'].includes(action)) return true;
  if (action === 'summarize_bookings') {
    const metric = String(params.bookingMetric ?? '').toLowerCase();
    if (metric === 'revenue' || metric === 'unpaid') return true;
    if (
      /revenue|earnings?|unpaid|how much.*(made|earned)|total.*(\$|usd)/i.test(
        prompt,
      )
    )
      return true;
  }
  if (action === 'analyze_services') {
    if (
      params.serviceMetric === 'top_revenue' ||
      /revenue|sales|earned/i.test(prompt)
    )
      return true;
  }
  if (action === 'summarize_staff') return true;
  if (action === 'summarize_customers') return true;
  return false;
}

/** Staff directory / cross-provider analytics — manager+ only. */
export function isStaffDirectoryRequest(action: string): boolean {
  return action === 'list_employees';
}

/** Intents that staff must scope to their own employeeId when linked. */
export const STAFF_SCOPED_INTENTS = new Set([
  'list_bookings',
  'show_appointments',
  'summarize_day',
  'cancel_bookings',
  'reschedule_booking',
  'block_schedule',
  'fill_unused_slots',
  'suggest_waitlist_for_gap',
  'add_retail_to_booking',
  'send_client_message',
  'block_my_time',
  'request_time_off',
  'check_availability',
]);
