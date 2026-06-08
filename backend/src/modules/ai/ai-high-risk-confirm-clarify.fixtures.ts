import type { ClassificationSurface } from './ai-classification-engine.types.js';

export const HIGH_RISK_CONFIRM_ACTIONS = new Set([
  'cancel_bookings',
  'bulk_smart_cancel',
  'update_bookings',
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
  'staff_service_matrix',
  'bulk_create_catalog',
  'create_package',
  'create_subscription_plan',
  'merge_customers',
  'delete_customer_data',
  'privacy_delete',
]);

export interface HighRiskConfirmScenario {
  id: string;
  surface: ClassificationSurface;
  action: string;
  params: Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
  expectClarify: boolean;
  expectSummaryIncludes?: string[];
  expectRequiresConfirmation?: boolean;
}

/** acc-4.6 — proactive plain-language confirm before bulk/destructive execution. */
export const HIGH_RISK_CONFIRM_SCENARIOS: HighRiskConfirmScenario[] = [
  {
    id: 'dash-cancel-twelve-notify',
    surface: 'dashboard',
    action: 'cancel_bookings',
    params: {
      bookingIds: Array.from({ length: 12 }, (_, index) => `bk-${index + 1}`),
      notifyCustomers: true,
      employeeName: 'Maria',
      date: '2026-06-08',
    },
    expectClarify: true,
    expectRequiresConfirmation: true,
    expectSummaryIncludes: ['12 bookings', '12 customers', 'proceed'],
  },
  {
    id: 'dash-bulk-smart-cancel',
    surface: 'dashboard',
    action: 'bulk_smart_cancel',
    params: { limit: 5, notifyCustomers: true },
    expectClarify: true,
    expectSummaryIncludes: ['5 bookings', '5 customers'],
  },
  {
    id: 'dash-clear-schedule',
    surface: 'dashboard',
    action: 'clear_schedule',
    params: { employeeName: 'Gevorg', date: '2026-06-09' },
    expectClarify: true,
    expectSummaryIncludes: ['clear', 'Gevorg', 'proceed'],
  },
  {
    id: 'dash-merge-customers',
    surface: 'dashboard',
    action: 'merge_customers',
    params: { customerName: 'Jane Doe', targetCustomerName: 'Jane Smith' },
    expectClarify: true,
    expectSummaryIncludes: ['merges customer', 'proceed'],
  },
  {
    id: 'dash-privacy-delete',
    surface: 'dashboard',
    action: 'privacy_delete',
    params: { customerName: 'John Smith' },
    expectClarify: true,
    expectSummaryIncludes: ['delete', 'proceed'],
  },
  {
    id: 'dash-already-confirmed-skips',
    surface: 'dashboard',
    action: 'cancel_bookings',
    params: { bookingIds: ['bk-1', 'bk-2'], notifyCustomers: true },
    sessionContext: { confirmed: true },
    expectClarify: false,
  },
  {
    id: 'dash-safe-action-skips',
    surface: 'dashboard',
    action: 'list_bookings',
    params: { date: '2026-06-08' },
    expectClarify: false,
  },
];
