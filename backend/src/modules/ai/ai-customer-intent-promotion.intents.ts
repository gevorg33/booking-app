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
  'explain_tour_booking_record',
  'explain_tour_meeting_point',
  'explain_checkout_recommendations',
  'refer_a_friend',
  'share_salon_link',
  // ai-cmd-customer-6.1 — subscription plan discover/select promotion
  'select_subscription_plan',
  'discover_subscription_plans',
  // ai-cmd-customer-6.3 — reschedule-with-provider-change promotion
  'change_provider_on_reschedule',
  // ai-cmd-customer-6.5 — notification-preferences + data-rights promotion
  'manage_notification_preferences',
  'explain_my_notifications',
  'explain_data_rights',
  // ai-cmd-customer-6.6 — loyalty points explainer promotion
  'explain_loyalty_points',
  // ai-cmd-customer-6.6 — share-my-booking + share-reward explainer promotion
  'share_my_booking',
  'explain_share_reward',
  // ai-cmd-customer-6.6 — subscription usage ledger promotion
  'subscription_usage',
  // ai-cmd-customer-6.7 — gift card modify-request promotion
  'request_gift_card_modify',
  // ai-cmd-customer-6.8 — patient lab results promotion
  'list_my_test_results',
  'explain_result_status',
  // ai-cmd-customer-6.8 — patient lab-to-book promotion
  'list_my_lab_booking_requests',
  'book_lab_collection',
  // ai-cmd-customer-6.8 — patient alert explainer promotion
  'explain_patient_alert',
  // ai-cmd-customer-6.11 — app update gate explainer promotion
  'explain_app_update_required',
  // ai-cmd-customer-6.12 — bulk cancel-all-upcoming-bookings (new intent)
  'cancel_all_upcoming_bookings',
  // ai-cmd-customer-6.14.3 — update_my_profile promotion (name/phone API shipped)
  'update_my_profile',
] as const;

export type CustomerIntentPromotionIntent =
  (typeof CUSTOMER_INTENT_PROMOTION_INTENT_LIST)[number];
