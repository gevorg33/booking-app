import { MemberRole } from '../business/entities/business-member.entity.js';
import {
  ALL_PRODUCT_GUIDE_INTENTS,
  isAnyProductGuideIntent,
} from './ai-product-guide-completion.util.js';
import { APP_GUIDE_INTENTS } from './ai-product-guide.util.js';
import {
  META_PRODUCT_GUIDE_INTENTS,
  PROVIDER_META_GUIDE_INTENTS,
} from './ai-meta-product-guide.fixtures.js';
import {
  CUSTOMER_PUBLIC_EMPTY_STATE_GUIDE_INTENTS,
  DASHBOARD_EMPTY_STATE_GUIDE_INTENTS,
  EMPTY_STATE_GUIDE_INTENTS,
  PROVIDER_EMPTY_STATE_GUIDE_INTENTS,
} from './ai-product-guide-empty-state.fixtures.js';
import { isEmptyStateGuideIntentOnSurface } from './ai-product-guide-empty-state-intent.util.js';
import { PROVIDER_PRODUCT_GUIDE_INTENTS } from './ai-provider-product-guide.util.js';

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

/**
 * e2e-bug.163 — intents that contradict TIER_DATA_ACCESS.staff
 * (no crm_insights / revenue_analytics / owner_operations).
 * Kept as an explicit set so the deny-list stays auditable against the
 * documented data-access model.
 */
export const STAFF_DENIED_CRM_REVENUE_FINANCE_INTENTS = [
  // Full CRM / PII roster (crm_insights — not limited_customer_info)
  'list_customers',
  'lookup_customer',
  'list_customer_subscriptions',
  'subscription_usage_history',
  'list_customer_gift_cards',
  'list_customer_bookings',
  'customer_no_show_history',
  'extend_subscription',
  'cancel_subscription_admin',
  'merge_customers',
  'export_customer_data',
  'delete_customer_data',
  'send_reengagement_message',
  'tag_customer',
  'update_customer',
  'lookup_booking_tax_metadata',
  'summarize_customer_tax_paid',
  // Revenue / finance analytics
  'revenue_forecast',
  'commission_report',
  'summarize_pl',
  'export_commissions',
  'export_accounting',
  'list_subscription_revenue',
  'summarize_unpaid',
  'record_expense',
  'delete_expense',
  'list_expenses',
  'create_commission_rule',
  'delete_commission_rule',
  'payout_export',
  'export_analytics_report',
  // Gift-card financial mutations / balance access
  'adjust_gift_card_balance',
  'extend_gift_card_expiry',
  'refund_gift_card_order',
  'cancel_gift_card_order',
  'validate_gift_card',
  'gift_card_balance',
  'update_gift_card_settings',
  'extend_cancel_window',
  'resolve_gift_card_change_request',
] as const;

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
    'list_agent_tasks',
    'rebook_all_from_agent_task',
    'undo_latest_agent_task',
    'approve_agent_task',
    'retry_agent_step',
    'get_dashboard_overview',
    'update_business_profile',
    'set_business_type',
    'apply_onboarding_catalog',
    'apply_onboarding_schedule',
    'skip_onboarding_schedule',
    'apply_onboarding_playbook',
    'complete_onboarding',
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
    'list_customers',
    'lookup_booking_tax_metadata',
    'summarize_customer_tax_paid',
    'summarize_waitlist',
    'lookup_service_assignment',
    'list_services',
    'list_employees',
    'list_templates',
    'list_schedule_blocks',
    'get_provider_calendar',
    'create_schedule_template',
    'update_schedule_template',
    'delete_schedule_templates',
    'duplicate_schedule_template',
    'delete_schedule_block',
    'apply_and_fill',
    'update_team_member_role',
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
    'summarize_ai_briefing',
    'summarize_ai_weekly_report',
    'explain_ai_audit_log',
    'explain_ai_usage_analytics',
    'explain_ai_capabilities',
    'summarize_ai_settings',
    'configure_ai_autopilot',
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
    'start_billing_checkout',
    'confirm_billing_checkout',
    'explain_plan_entitlements',
    'summarize_loyalty_program',
    'upload_patient_result',
    'explain_patient_results',
    'configure_test_reference_range',
    'list_abnormal_results',
    'enter_test_result',
    'release_test_result',
    'transition_specimen',
    'explain_lab_result_history',
    'update_clinical_profile',
    'dismiss_patient_alert',
    'release_patient_document',
    'create_encounter_addendum',
    'update_encounter_by_booking',
    'list_customer_staff_notes',
    'add_customer_staff_note',
    'staff_submit_intake_answers',
    'create_questionnaire',
    'update_questionnaire',
    'publish_questionnaire',
    'create_test_type',
    'update_test_type',
    'delete_test_type',
    'create_test_panel',
    'update_test_panel',
    'set_test_panel_items',
    'import_clinic_catalog_csv',
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
    'start_billing_checkout',
    'confirm_billing_checkout',
    'explain_plan_entitlements',
    'explain_ai_audit_log',
    'explain_ai_usage_analytics',
    'explain_ai_capabilities',
    'summarize_ai_settings',
    'configure_ai_autopilot',
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
    'list_schedule_blocks',
    'get_provider_calendar',
    'create_schedule_template',
    'update_schedule_template',
    'delete_schedule_templates',
    'duplicate_schedule_template',
    'delete_schedule_block',
    'apply_and_fill',
    'update_team_member_role',
    'create_questionnaire',
    'update_questionnaire',
    'publish_questionnaire',
    'create_test_type',
    'update_test_type',
    'delete_test_type',
    'create_test_panel',
    'update_test_panel',
    'set_test_panel_items',
    'import_clinic_catalog_csv',
    'bulk_smart_cancel',
    'list_agent_tasks',
    'rebook_all_from_agent_task',
    'undo_latest_agent_task',
    'approve_agent_task',
    'retry_agent_step',
    'get_dashboard_overview',
    'update_business_profile',
    'set_business_type',
    'apply_onboarding_catalog',
    'apply_onboarding_schedule',
    'skip_onboarding_schedule',
    'apply_onboarding_playbook',
    'complete_onboarding',
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
    'explain_enterprise_trust',
    'explain_strategy_eval',
    'update_strategy_eval',
    'configure_stacked_tax_rules',
    'set_service_tax_rate',
    'configure_business_languages',
    'configure_referral_program',
    'configure_staff_message_templates',
    'create_external_doctor',
    'update_external_doctor',
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
    ...STAFF_DENIED_CRM_REVENUE_FINANCE_INTENTS,
  ]),
  manager: new Set(['optimize_schedule', 'update_team_member_role']),
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

const REVENUE_FINANCE_ACTIONS = new Set<string>([
  'payment_sweep',
  'summarize_utilization',
  'revenue_forecast',
  'commission_report',
  'summarize_pl',
  'export_commissions',
  'export_accounting',
  'list_subscription_revenue',
  'summarize_unpaid',
  'record_expense',
  'delete_expense',
  'list_expenses',
  'create_commission_rule',
  'delete_commission_rule',
  'payout_export',
  'export_analytics_report',
  'adjust_gift_card_balance',
  'extend_gift_card_expiry',
  'refund_gift_card_order',
  'cancel_gift_card_order',
  'validate_gift_card',
  'gift_card_balance',
  'update_gift_card_settings',
  'extend_cancel_window',
  'resolve_gift_card_change_request',
]);

/** Revenue / financial intents or metrics — manager+ only. */
export function isRevenueRelatedRequest(
  action: string,
  params: Record<string, unknown>,
  prompt: string,
): boolean {
  if (REVENUE_FINANCE_ACTIONS.has(action)) return true;
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

const CRM_INSIGHTS_ACTIONS = new Set<string>([
  'list_customers',
  'lookup_customer',
  'summarize_customers',
  'list_customer_subscriptions',
  'subscription_usage_history',
  'list_customer_gift_cards',
  'list_customer_bookings',
  'customer_no_show_history',
  'extend_subscription',
  'cancel_subscription_admin',
  'merge_customers',
  'export_customer_data',
  'delete_customer_data',
  'send_reengagement_message',
  'tag_customer',
  'update_customer',
  'lookup_booking_tax_metadata',
  'summarize_customer_tax_paid',
]);

/** Full CRM / customer PII roster — manager+ only (e2e-bug.163). */
export function isCrmInsightsRequest(action: string): boolean {
  return CRM_INSIGHTS_ACTIONS.has(action);
}

/** Staff directory / cross-provider analytics — manager+ only. */
export function isStaffDirectoryRequest(action: string): boolean {
  return action === 'list_employees';
}

/** Read-only product guide intents — never revenue-scoped (ai-guide-1.8.5). */
export {
  ALL_PRODUCT_GUIDE_INTENTS,
  isAnyProductGuideIntent,
  PRODUCT_GUIDE_INTENT_SET,
} from './ai-product-guide-completion.util.js';

export const APP_GUIDE_INTENT_SET = new Set<string>(APP_GUIDE_INTENTS);
export const PROVIDER_PRODUCT_GUIDE_INTENT_SET = new Set<string>(
  PROVIDER_PRODUCT_GUIDE_INTENTS,
);
export const META_PRODUCT_GUIDE_INTENT_SET = new Set<string>(
  META_PRODUCT_GUIDE_INTENTS,
);
export const PROVIDER_META_GUIDE_INTENT_SET = new Set<string>(
  PROVIDER_META_GUIDE_INTENTS,
);
export const EMPTY_STATE_GUIDE_INTENT_SET = new Set<string>(
  EMPTY_STATE_GUIDE_INTENTS,
);
export const DASHBOARD_EMPTY_STATE_GUIDE_INTENT_SET = new Set<string>(
  DASHBOARD_EMPTY_STATE_GUIDE_INTENTS,
);
export const PROVIDER_EMPTY_STATE_GUIDE_INTENT_SET = new Set<string>(
  PROVIDER_EMPTY_STATE_GUIDE_INTENTS,
);
export const CUSTOMER_PUBLIC_EMPTY_STATE_GUIDE_INTENT_SET = new Set<string>(
  CUSTOMER_PUBLIC_EMPTY_STATE_GUIDE_INTENTS,
);

export type ProductGuideSurface =
  | 'dashboard'
  | 'provider'
  | 'customer'
  | 'public';

export function isAppGuideIntentOnSurface(
  action: string,
  surface: ProductGuideSurface,
): boolean {
  if (!APP_GUIDE_INTENT_SET.has(action)) return false;
  return (
    surface === 'dashboard' || surface === 'customer' || surface === 'public'
  );
}

export function isProviderProductGuideIntentOnSurface(
  action: string,
  surface: ProductGuideSurface,
): boolean {
  return (
    surface === 'provider' && PROVIDER_PRODUCT_GUIDE_INTENT_SET.has(action)
  );
}

export function isMetaProductGuideIntentOnSurface(
  action: string,
  surface: ProductGuideSurface,
): boolean {
  if (!META_PRODUCT_GUIDE_INTENT_SET.has(action)) return false;
  if (action === 'explain_ai_settings') return surface === 'dashboard';
  if (surface === 'dashboard') return true;
  return surface === 'provider' && PROVIDER_META_GUIDE_INTENT_SET.has(action);
}

export function isEmptyStateProductGuideIntentOnSurface(
  action: string,
  surface: ProductGuideSurface,
): boolean {
  if (!EMPTY_STATE_GUIDE_INTENT_SET.has(action)) return false;
  return isEmptyStateGuideIntentOnSurface(action, surface);
}

/** Tier + surface gate for unified product guide intents (ai-guide-1.8.5). */
export function isProductGuideIntentAllowed(
  tier: AccessTier,
  surface: ProductGuideSurface,
  action: string,
): boolean {
  if (isAppGuideIntentOnSurface(action, surface)) {
    if (surface === 'dashboard') return isDashboardIntentAllowed(tier, action);
    if (surface === 'customer') return isCustomerIntentAllowed(tier, action);
    return tier === 'client';
  }
  if (isMetaProductGuideIntentOnSurface(action, surface)) {
    if (surface === 'dashboard') return isDashboardIntentAllowed(tier, action);
    return isProviderIntentAllowed(tier, action);
  }
  if (isEmptyStateProductGuideIntentOnSurface(action, surface)) {
    if (surface === 'dashboard') return isDashboardIntentAllowed(tier, action);
    if (surface === 'provider') return isProviderIntentAllowed(tier, action);
    if (surface === 'customer') return isCustomerIntentAllowed(tier, action);
    return tier === 'client';
  }
  if (isProviderProductGuideIntentOnSurface(action, surface)) {
    return isProviderIntentAllowed(tier, action);
  }
  return false;
}

/** Intents that staff must scope to their own employeeId when linked. */
export const STAFF_SCOPED_INTENTS = new Set([
  'list_bookings',
  'show_appointments',
  'voice_summarize_next_client',
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
