import type { CommandSurface } from './ai-command-registry.types.js';

/** Customer/public self-service — product checkout/manage UI owns confirm (parity-2.6). */
export const PARITY_26_CUSTOMER_PUBLIC_PREVIEW_EXEMPT = new Set([
  'book_package',
  'book_appointment',
  'book_nearest_slot',
  'cancel_my_booking',
  'reschedule_my_booking',
  'choose_payment_method',
  'buy_gift_card',
  'buy_gift_card_physical',
  'submit_review',
  'manage_notification_preferences',
  'redeem_gift_card',
  'apply_promo_code',
  'loyalty_redeem',
  'explain_data_rights',
  'request_data_export',
  'request_data_deletion',
]);

/** Provider ephemeral push/offline actions — no calendar preview diff (parity-2.6). */
export const PARITY_26_PROVIDER_EPHEMERAL_MUTATIONS = new Set([
  'dismiss_push',
  'retry_offline_action',
  'confirm_booking_from_push',
  'suggest_reschedule_from_push',
  'collect_cash_confirm',
]);

/** Settings handlers that return requiresExecutionConfirmation in-domain (parity-2.6). */
export const PARITY_26_HANDLER_PREVIEW_CONFIRM_ACTIONS = new Set([
  'configure_business_currency',
  'configure_business_tax',
  'configure_business_languages',
  'configure_business_date_format',
  'configure_stacked_tax_rules',
  'set_service_tax_rate',
  'bulk_update_service_currency',
  'configure_package_localized_names',
  'configure_provider_push_date_format',
  'migrate_dashboard_date_display',
  'bulk_strip_disabled_locale_translations',
]);

/** Destructive/bulk intents that must honor blast-radius caps (acc-5.7). */
export const PARITY_26_DESTRUCTIVE_BLAST_RADIUS_ACTIONS = new Set([
  'cancel_bookings',
  'bulk_smart_cancel',
  'clear_schedule',
  'hide_appointments_from_calendar',
  'update_bookings',
  'mark_no_shows',
  'no_show_recovery',
  'payment_sweep',
  'day_replan',
  'sick_day_replan',
  'setup_week_schedule',
  'create_services',
  'import_services_from_menu',
  'update_service_prices',
  'staff_service_matrix',
  'bulk_create_catalog',
  'merge_customers',
  'delete_customer_data',
  'privacy_delete',
  'admin_delete_customer_data',
]);

export const PARITY_26_PROBE_SCENARIOS = [
  {
    id: 'create-booking-medium-preview',
    action: 'create_booking',
    surface: 'dashboard' as const,
    expectPreviewConfirm: true,
    expectPostExec: true,
    expectUndoable: true,
  },
  {
    id: 'cancel-bookings-high-risk-blast',
    action: 'cancel_bookings',
    surface: 'dashboard' as const,
    expectPreviewConfirm: true,
    expectDestructiveBlast: true,
    expectPostExec: true,
    expectUndoable: true,
  },
  {
    id: 'clear-schedule-high-risk-non-undoable',
    action: 'clear_schedule',
    surface: 'dashboard' as const,
    expectPreviewConfirm: true,
    expectDestructiveBlast: true,
    expectUndoable: false,
    expectNonUndoable: true,
  },
  {
    id: 'mark-paid-post-exec-non-undoable',
    action: 'mark_paid',
    surface: 'provider' as const,
    expectPreviewConfirm: true,
    expectPostExec: true,
    expectUndoable: false,
    expectNonUndoable: true,
  },
  {
    id: 'book-package-customer-exempt',
    action: 'book_package',
    surface: 'customer' as const,
    expectPreviewConfirm: true,
    expectCustomerExempt: true,
  },
  {
    id: 'list-bookings-read-only',
    action: 'list_bookings',
    surface: 'dashboard' as const,
    expectMutating: false,
  },
  {
    id: 'blast-radius-thirty-cancels',
    action: 'cancel_bookings',
    params: { bookingIds: Array.from({ length: 30 }, (_, i) => `bk-${i}`) },
    expectBlastGate: true,
  },
] as const;

export function isCustomerPublicOnlySurface(
  surfaces: readonly CommandSurface[],
): boolean {
  return (
    surfaces.length > 0 &&
    surfaces.every((surface) => surface === 'customer' || surface === 'public')
  );
}
