/** Flat promotion intent list — shared by coverage + audit without importing coverage.util (ai-cmd-customer-4.0.2). */
export const CUSTOMER_INTENT_PROMOTION_INTENT_LIST = [
  'cancel_my_booking',
  'reschedule_my_booking',
  'pay_online',
  'explain_why_stripe_required',
  'book_multi_service',
  'check_multi_service_availability',
  'promo_code_help',
  'use_subscription_credit',
  'my_subscriptions',
  'loyalty_points_balance',
  'privacy_export',
  'privacy_delete',
  'request_gift_card_cancel',
  'cancel_package_visit_self',
  'reschedule_package_visit_self',
  'list_my_package_visits',
  'explain_tour_booking',
  'explain_tour_day_slots',
  'diagnose_tour_capacity',
  'explain_checkout_recommendations',
  'refer_a_friend',
  'share_salon_link',
] as const;

export type CustomerIntentPromotionIntent =
  (typeof CUSTOMER_INTENT_PROMOTION_INTENT_LIST)[number];
