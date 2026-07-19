import type { CommandResult } from './command-completion.types.js';

/**
 * Dashboard mutates that require `confirmed: true` before execution (e2e-bug.161).
 *
 * Policy (deliberate, not ad hoc):
 * - Bulk / multi-row booking & catalog ops (existing gates)
 * - Irreversible or destructive data changes (PII erase, deactivations, deletes)
 * - Financial configuration & money mutations
 * - Credential / payment-integration changes
 * - Compliance / regulatory mode toggles and breach notifications
 * - Catalog/settings mutates that previously executed ungated (e2e-bug.158/160)
 *
 * Single source of truth — used by `AiCommandService` and product-guide bulk checks.
 */
export const DASHBOARD_EXECUTION_CONFIRM_ACTIONS = [
  // Bulk / multi-impact (pre-existing gates)
  'cancel_bookings',
  'update_bookings',
  'bulk_smart_cancel',
  'clear_schedule',
  'hide_appointments_from_calendar',
  'setup_week_schedule',
  'create_services',
  'mark_no_shows',
  'no_show_recovery',
  'payment_sweep',
  'day_replan',
  'sick_day_replan',
  'import_services_from_menu',
  'update_service_prices',
  'configure_service_online_payment',
  'staff_service_matrix',
  'bulk_create_catalog',
  'create_package',
  'create_subscription_plan',
  'merge_customers',
  'delete_customer_data',
  'privacy_delete',
  // Irreversible PII / destructive catalog & schedule
  'admin_delete_customer_data',
  'deactivate_service',
  'deactivate_package',
  'deactivate_subscription_plan',
  'delete_schedule_templates',
  'delete_schedule_block',
  'delete_service_category',
  'delete_test_type',
  'delete_webhook',
  'unassign_employee_services',
  'transfer_employee_services',
  'deactivate_employee',
  'deactivate_resource',
  // Financial configuration & money
  'configure_business_currency',
  'configure_business_tax',
  'configure_stacked_tax_rules',
  'set_service_tax_rate',
  'configure_cash_payments',
  'configure_checkout_defaults',
  'configure_service_deposit_policy',
  'bulk_update_service_currency',
  'toggle_annual_billing',
  'adjust_gift_card_balance',
  'extend_gift_card_expiry',
  'refund_gift_card_order',
  'cancel_gift_card_order',
  'update_gift_card_settings',
  // Credentials / integrations
  'rotate_api_key',
  'create_api_key',
  'revoke_api_key',
  'configure_stripe_connect',
  'configure_openai_integration',
  'configure_zapier',
  'configure_zendesk',
  'configure_whatsapp_integration',
  // Compliance / regulatory
  'report_data_breach',
  'send_breach_notification',
  'enable_hipaa_mode',
  'configure_hipaa_session_timeout',
  'accept_hipaa_baa',
  'configure_privacy_retention',
  // Previously ungated catalog/settings that caused real mutations (e2e-bug.158/160)
  'update_service_duration_buffer',
  // Ad-hoc handler confirms — keep in the shared list so the pre-dispatch gate
  // is the single entry point (handlers may still re-check).
  'migrate_dashboard_date_display',
  'notify_patient_result_ready',
  'bulk_strip_disabled_locale_translations',
] as const;

const DASHBOARD_EXECUTION_CONFIRM_SET = new Set<string>(
  DASHBOARD_EXECUTION_CONFIRM_ACTIONS,
);

export function requiresDashboardExecutionConfirmation(
  action: string,
): boolean {
  return DASHBOARD_EXECUTION_CONFIRM_SET.has(action);
}

/** Never surface in confirmation previews — common LLM fabrications (e2e-bug.156). */
const PREVIEW_DENY_KEYS = new Set([
  'customerName',
  'customerNames',
  'customerId',
  'sessionCustomerId',
]);

const CATALOG_PRICE_PREVIEW_KEYS = [
  'serviceName',
  'serviceNames',
  'categoryName',
  'percentChange',
  'amountChange',
  'priceChangePercent',
  'priceChangeAmount',
  'onlyWithOnlinePayment',
  'allServices',
  'effectiveFrom',
] as const;

const CATALOG_DURATION_PREVIEW_KEYS = [
  'serviceName',
  'serviceNames',
  'categoryName',
  'durationMinutes',
  'bufferMinutes',
  'allServices',
] as const;

const CATALOG_CREATE_PREVIEW_KEYS = [
  'serviceName',
  'serviceNames',
  'categoryName',
  'services',
  'name',
  'price',
  'durationMinutes',
] as const;

const SCHEDULE_PREVIEW_KEYS = [
  'employeeName',
  'employeeNames',
  'templateName',
  'date',
  'dateFrom',
  'dateTo',
  'timeSlot',
  'timeFrom',
  'timeTo',
  'allProviders',
  'reason',
  'bookingFirstAvailable',
] as const;

const BOOKING_BULK_PREVIEW_KEYS = [
  'employeeName',
  'employeeNames',
  'serviceName',
  'serviceNames',
  'date',
  'dateFrom',
  'dateTo',
  'timeSlot',
  'timeFrom',
  'timeTo',
  'reason',
  'allProviders',
] as const;

/** Fallback allowlist when no action-specific list applies. */
const DEFAULT_PREVIEW_KEYS = [
  ...new Set<string>([
    ...CATALOG_PRICE_PREVIEW_KEYS,
    ...CATALOG_DURATION_PREVIEW_KEYS,
    ...SCHEDULE_PREVIEW_KEYS,
    ...BOOKING_BULK_PREVIEW_KEYS,
  ]),
];

const ACTION_PREVIEW_KEYS: Record<string, readonly string[]> = {
  update_service_prices: CATALOG_PRICE_PREVIEW_KEYS,
  create_services: CATALOG_CREATE_PREVIEW_KEYS,
  bulk_create_catalog: CATALOG_CREATE_PREVIEW_KEYS,
  import_services_from_menu: CATALOG_CREATE_PREVIEW_KEYS,
  update_service_duration_buffer: CATALOG_DURATION_PREVIEW_KEYS,
  configure_service_online_payment: [
    'serviceName',
    'serviceNames',
    'categoryName',
    'allServices',
    'prepaymentMode',
    'depositPercent',
  ],
  clear_schedule: SCHEDULE_PREVIEW_KEYS,
  setup_week_schedule: SCHEDULE_PREVIEW_KEYS,
  hide_appointments_from_calendar: SCHEDULE_PREVIEW_KEYS,
  day_replan: SCHEDULE_PREVIEW_KEYS,
  sick_day_replan: SCHEDULE_PREVIEW_KEYS,
  cancel_bookings: BOOKING_BULK_PREVIEW_KEYS,
  update_bookings: BOOKING_BULK_PREVIEW_KEYS,
  bulk_smart_cancel: BOOKING_BULK_PREVIEW_KEYS,
  mark_no_shows: BOOKING_BULK_PREVIEW_KEYS,
  no_show_recovery: BOOKING_BULK_PREVIEW_KEYS,
  payment_sweep: BOOKING_BULK_PREVIEW_KEYS,
};

/**
 * e2e-bug.156 — only action-relevant params reach confirmation UI.
 * Fabricated customerName / schedule template fields must not appear on
 * catalog price/create confirmations.
 */
export function sanitizeParamsForPreview(
  params: Record<string, unknown>,
  action?: string,
): Record<string, unknown> {
  const allowed = new Set(
    action && ACTION_PREVIEW_KEYS[action]
      ? ACTION_PREVIEW_KEYS[action]
      : DEFAULT_PREVIEW_KEYS,
  );
  const preview: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (PREVIEW_DENY_KEYS.has(key)) continue;
    if (!allowed.has(key)) continue;
    if (value == null || value === '') continue;
    preview[key] = value;
  }
  return preview;
}

function formatPreviewLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').toLowerCase();
}

/**
 * e2e-bug.156 — confirmation copy is built only from sanitized preview params.
 * LLM reasoning stays in details (for telemetry) and is never echoed into the
 * owner-facing summary, where it previously invented "for Test User using …".
 */
export function buildExecutionConfirmationResult(
  action: string,
  reasoning: string,
  prompt: string,
  params: Record<string, unknown>,
): CommandResult {
  const humanAction = action.replace(/_/g, ' ');
  const previewParams = sanitizeParamsForPreview(params, action);
  const detailLines = Object.entries(previewParams).map(
    ([k, v]) =>
      `${formatPreviewLabel(k)}: ${Array.isArray(v) ? v.join(', ') : v}`,
  );

  return {
    success: true,
    action,
    summary: [
      `Ready to run: ${humanAction}.`,
      detailLines.length > 0 ? detailLines.map((l) => `• ${l}`).join('\n') : '',
      'Confirm below to execute.',
    ]
      .filter(Boolean)
      .join('\n'),
    details: {
      requiresExecutionConfirmation: true,
      confirmationPrompt: prompt,
      interpretedAction: action,
      reasoning,
      previewParams,
    },
  };
}

export function isExecutionConfirmed(session?: {
  confirmed?: boolean;
  context?: Record<string, unknown>;
}): boolean {
  if (session?.confirmed === true) return true;
  return session?.context?.confirmed === true;
}
