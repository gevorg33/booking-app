/**
 * e2e-bug.75 — CRM list rescues (`my_appointments` / `my_subscriptions`) must not
 * clobber an already-correct self-service, intake, or payment classification.
 * Leaf module (no imports) to avoid cycles with ai-customer-crm / self-service.
 */
const PROTECTED_FROM_CRM_LIST_STEAL = new Set<string>([
  'list_my_appointments',
  'my_appointments',
  'my_subscriptions',
  'cancel_my_booking',
  'reschedule_my_booking',
  'cancel_all_upcoming_bookings',
  'cancel_package_visit_self',
  'reschedule_package_visit_self',
  'reschedule_package_lines',
  'confirm_my_booking_details',
  'add_booking_to_calendar',
  'share_my_booking',
  'notify_running_late',
  'leave_visit_review',
  'report_booking_problem',
  'join_waitlist',
  'check_waitlist_status',
  'get_manage_link',
  'recover_lost_manage_link',
  'sign_in_to_manage_booking',
  'explain_manage_booking_page',
  'cancel_booking_with_token',
  'reschedule_booking_with_token',
  'cancel_package_visit_with_token',
  'reschedule_package_visit_with_token',
  'cancel_my_subscription',
  'use_subscription_credit',
  'select_subscription_plan',
  'purchase_subscription_checkout',
  'explain_my_subscription',
  'subscription_usage',
  'start_pre_visit_intake',
  'create_intake_draft',
  'get_intake_flow_status',
  'submit_intake_answers',
  'complete_intake_and_book',
  'book_another_service',
  'book_nearest_slot',
  'pay_online',
  'pay_cash_at_visit',
  'choose_payment_method',
  'book_package',
  'book_multi_service',
  'book_with_cash',
  'book_with_gift_card',
]);

export function isProtectedFromCrmListSteal(action: string): boolean {
  return PROTECTED_FROM_CRM_LIST_STEAL.has(action);
}
