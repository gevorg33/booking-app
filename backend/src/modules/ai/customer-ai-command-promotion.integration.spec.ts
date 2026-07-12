import { rescueCheckoutRecommendationsCustomerPublicIntent } from './ai-checkout-recommendations-customer-public.util.js';
import { CUSTOMER_INTENT_PROMOTION_INTEGRATION_ROWS } from './ai-customer-intent-promotion-coverage.util.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { rescueCustomerCrmIntent } from './ai-customer-crm.util.js';
import { rescueConsumerClinicTestResultsIntent } from './ai-consumer-clinic-test-results.util.js';
import { rescueConsumerClinicLabBookingIntent } from './ai-clinic-lab-booking.util.js';
import { rescueExplainDataRightsIntent } from './ai-data-rights.util.js';
import { rescueExplainLoyaltyPointsIntent } from './ai-explain-loyalty-points.util.js';
import { rescueExplainPrepaymentIntent } from './ai-explain-prepayment.util.js';
import { rescueExplainShareRewardIntent } from './ai-explain-share-reward.util.js';
import { rescueShareMyBookingIntent } from './ai-share-my-booking.util.js';
import { rescueGiftCardCancelCustomerIntent } from './ai-gift-card-cancel-customer.util.js';
import { rescueGrowthLoopsCustomerIntent } from './ai-growth-loops-customer.util.js';
import { rescueListMyPackageVisitsCustomerIntent } from './ai-list-my-package-visits-customer.util.js';
import { rescueLoyaltyPointsBalanceCustomerIntent } from './ai-loyalty-points-balance-customer.util.js';
import { rescueMultiServiceCustomerPublicIntent } from './ai-multi-service-customer-public.util.js';
import { rescuePackageVisitSelfCustomerIntent } from './ai-package-visit-self-customer.util.js';
import { rescuePayOnlineCheckoutIntent } from './ai-pay-online-checkout.util.js';
import { rescuePrivacyGdprCustomerIntent } from './ai-privacy-gdpr-customer.util.js';
import { rescuePromoCodeHelpCustomerPublicIntent } from './ai-promo-code-help-customer-public.util.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';
import { rescueMembershipCustomerIntent } from './ai-subscription-membership-customer.util.js';
import { rescueTourCustomerPublicIntent } from './ai-tour-customer-public.util.js';
import { rescueUpdateMyProfileIntent } from './ai-update-my-profile.util.js';

type PromotionRescueFn = (
  prompt: string,
  misclassifiedAction: string,
) => { action: string } | null;

const PROMOTION_RESCUE_BY_INTENT: Record<string, PromotionRescueFn> = {
  cancel_my_booking: (prompt, action) =>
    rescueSelfServiceBookingIntent(prompt, action),
  reschedule_my_booking: (prompt, action) =>
    rescueSelfServiceBookingIntent(prompt, action),
  change_provider_on_reschedule: (prompt, action) =>
    rescueSelfServiceBookingIntent(prompt, action),
  pay_online: (prompt, action) => rescuePayOnlineCheckoutIntent(prompt, action),
  explain_why_stripe_required: (prompt, action) =>
    rescueExplainPrepaymentIntent(prompt, action),
  book_multi_service: (prompt, action) =>
    rescueMultiServiceCustomerPublicIntent(prompt, action),
  check_multi_service_availability: (prompt, action) =>
    rescueMultiServiceCustomerPublicIntent(prompt, action),
  promo_code_help: (prompt, action) =>
    rescuePromoCodeHelpCustomerPublicIntent(prompt, action),
  use_subscription_credit: (prompt, action) =>
    rescueMembershipCustomerIntent(prompt, action),
  my_subscriptions: (prompt, action) =>
    rescueMembershipCustomerIntent(prompt, action),
  select_subscription_plan: (prompt, action) =>
    rescueMembershipCustomerIntent(prompt, action),
  discover_subscription_plans: (prompt, action) =>
    rescueMembershipCustomerIntent(prompt, action),
  loyalty_points_balance: (prompt, action) =>
    rescueLoyaltyPointsBalanceCustomerIntent(prompt, action),
  privacy_export: (prompt, action) =>
    rescuePrivacyGdprCustomerIntent(prompt, action),
  privacy_delete: (prompt, action) =>
    rescuePrivacyGdprCustomerIntent(prompt, action),
  request_gift_card_cancel: (prompt, action) =>
    rescueGiftCardCancelCustomerIntent(prompt, action),
  cancel_package_visit_self: (prompt, action) =>
    rescuePackageVisitSelfCustomerIntent(prompt, action),
  reschedule_package_visit_self: (prompt, action) =>
    rescuePackageVisitSelfCustomerIntent(prompt, action),
  list_my_package_visits: (prompt, action) =>
    rescueListMyPackageVisitsCustomerIntent(prompt, action),
  explain_tour_booking: (prompt, action) =>
    rescueTourCustomerPublicIntent(prompt, action),
  explain_tour_day_slots: (prompt, action) =>
    rescueTourCustomerPublicIntent(prompt, action),
  diagnose_tour_capacity: (prompt, action) =>
    rescueTourCustomerPublicIntent(prompt, action),
  explain_tour_booking_record: (prompt, action) =>
    rescueTourCustomerPublicIntent(prompt, action),
  explain_tour_meeting_point: (prompt, action) =>
    rescueTourCustomerPublicIntent(prompt, action),
  explain_checkout_recommendations: (prompt, action) =>
    rescueCheckoutRecommendationsCustomerPublicIntent(prompt, action),
  refer_a_friend: (prompt, action) =>
    rescueGrowthLoopsCustomerIntent(prompt, action),
  share_salon_link: (prompt, action) =>
    rescueGrowthLoopsCustomerIntent(prompt, action),
  manage_notification_preferences: (prompt, action) =>
    rescueConsumerAdoptionIntent(prompt, action),
  explain_my_notifications: (prompt, action) =>
    rescueConsumerAdoptionIntent(prompt, action),
  explain_data_rights: (prompt, action) =>
    rescueExplainDataRightsIntent(prompt, action),
  explain_loyalty_points: (prompt, action) =>
    rescueExplainLoyaltyPointsIntent(prompt, action),
  share_my_booking: (prompt, action) =>
    rescueShareMyBookingIntent(prompt, action),
  explain_share_reward: (prompt, action) =>
    rescueExplainShareRewardIntent(prompt, action),
  subscription_usage: (prompt, action) =>
    rescueCustomerCrmIntent(prompt, action),
  request_gift_card_modify: (prompt, action) =>
    rescueCustomerCrmIntent(prompt, action),
  list_my_test_results: (prompt, action) =>
    rescueConsumerClinicTestResultsIntent(prompt, action),
  explain_result_status: (prompt, action) =>
    rescueConsumerClinicTestResultsIntent(prompt, action),
  list_my_lab_booking_requests: (prompt, action) =>
    rescueConsumerClinicLabBookingIntent(prompt, action),
  book_lab_collection: (prompt, action) =>
    rescueConsumerClinicLabBookingIntent(prompt, action),
  explain_patient_alert: (prompt, action) =>
    rescueConsumerAdoptionIntent(prompt, action),
  explain_app_update_required: (prompt, action) =>
    rescueConsumerAdoptionIntent(prompt, action),
  cancel_all_upcoming_bookings: (prompt, action) =>
    rescueSelfServiceBookingIntent(prompt, action),
  update_my_profile: (prompt, action) =>
    rescueUpdateMyProfileIntent(prompt, action),
};

describe('customer-ai-command promotion integration (ai-cmd-customer-4.0.2)', () => {
  it.each(
    CUSTOMER_INTENT_PROMOTION_INTEGRATION_ROWS.map((row) => [row.id, row]),
  )('rescues promoted intent $0', (_id, row) => {
    const rescue = PROMOTION_RESCUE_BY_INTENT[row.intent];
    expect(rescue).toBeDefined();
    expect(rescue(row.prompt, 'unknown')?.action).toBe(row.intent);
  });
});
