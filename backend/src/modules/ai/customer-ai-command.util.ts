import type { CommandResult } from './command-completion.types.js';
import { CHECK_AND_BOOK_CLASSIFIER_RULES } from './ai-check-and-book.fixtures.js';
import { pickSharedBookingContextSlice } from './ai-compound-booking-context.util.js';
import { mergeCheckProvidersHandoffIntoContext } from './ai-check-book-handoff.util.js';
import { CLASSIFIER_MULTILINGUAL_RULES } from './ai-prompt-i18n.js';
import { CHECKOUT_CURRENCY_CLASSIFIER_RULES } from './ai-checkout-currency.fixtures.js';
import { CHECKOUT_TAX_CLASSIFIER_RULES } from './ai-checkout-tax.fixtures.js';
import { NOTIFICATION_CURRENCY_CLASSIFIER_RULES } from './ai-notification-currency.fixtures.js';
import { STRIPE_CHECKOUT_CURRENCY_CLASSIFIER_RULES } from './ai-stripe-checkout-currency.fixtures.js';
import { TENANT_CURRENCY_CLASSIFIER_RULES } from './ai-tenant-currency.fixtures.js';
import { BOOKING_LANGUAGES_CLASSIFIER_RULES } from './ai-booking-languages.fixtures.js';
import { BOOKING_DATE_FORMAT_CLASSIFIER_RULES } from './ai-booking-date-format.fixtures.js';
import { TOUR_BOOKING_CLASSIFIER_RULES } from './ai-tour-booking.fixtures.js';
import { TOUR_CAPACITY_CLASSIFIER_RULES } from './ai-tour-capacity.fixtures.js';
import { CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES } from './ai-checkout-recommendations.fixtures.js';
import { CHECKOUT_RECOMMENDATIONS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-checkout-recommendations-multilingual.fixtures.js';
import { CUSTOMER_DISMISS_RECOMMENDATIONS_CLASSIFIER_RULES } from './ai-dismiss-recommendations.fixtures.js';
import { DISMISS_RECOMMENDATIONS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-dismiss-recommendations-multilingual.fixtures.js';
import { CUSTOMER_BUY_GIFT_CARD_FOR_SOMEONE_CLASSIFIER_RULES } from './ai-buy-gift-card-for-someone.fixtures.js';
import { BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-buy-gift-card-for-someone-multilingual.fixtures.js';
import { CONSUMER_CHECKOUT_SUCCESS_CLASSIFIER_RULES } from './ai-consumer-checkout-success.fixtures.js';
import { CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-consumer-checkout-success-multilingual.fixtures.js';
import { CONSUMER_CHECKOUT_SUCCESS_EN_CLASSIFIER_RULES } from './ai-consumer-checkout-success-en.fixtures.js';
import { CONSUMER_CHECKOUT_TAX_CLASSIFIER_RULES } from './ai-consumer-checkout-tax.fixtures.js';
import { TAX_DISPLAY_EN_CLASSIFIER_RULES } from './ai-tax-display-en.fixtures.js';
import { DATA_RIGHTS_CLASSIFIER_RULES } from './ai-data-rights.fixtures.js';
import { CUSTOMER_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX } from './ai-clinic-v2-6.fixtures.js';
import { CUSTOMER_PACKAGE_BOOKING_CLASSIFIER_RULES } from './ai-consumer-package-booking.fixtures.js';
import { CONSUMER_ADOPTION_CLASSIFIER_RULES } from './ai-consumer-adoption.fixtures.js';
import { CUSTOMER_FIND_MY_SAVED_SALONS_CLASSIFIER_RULES } from './ai-find-my-saved-salons.util.js';
import { FIND_MY_SAVED_SALONS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-find-my-saved-salons-multilingual.fixtures.js';
import { CUSTOMER_SWITCH_SALON_TENANT_CLASSIFIER_RULES } from './ai-switch-salon-tenant.util.js';
import { SWITCH_SALON_TENANT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-switch-salon-tenant-multilingual.fixtures.js';
import { CUSTOMER_MANAGE_NOTIFICATION_PREFERENCES_CLASSIFIER_RULES } from './ai-manage-notification-preferences.fixtures.js';
import { CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_CLASSIFIER_RULES } from './ai-customer-enable-push-notifications.util.js';
import { CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-customer-enable-push-notifications-multilingual.fixtures.js';
import { CUSTOMER_EXPLAIN_PUSH_PERMISSION_CLASSIFIER_RULES } from './ai-explain-push-permission.util.js';
import { EXPLAIN_PUSH_PERMISSION_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-push-permission-multilingual.fixtures.js';
import { CUSTOMER_EXPLAIN_OFFLINE_MODE_CLASSIFIER_RULES } from './ai-explain-offline-mode.util.js';
import { EXPLAIN_OFFLINE_MODE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-offline-mode-multilingual.fixtures.js';
import { CUSTOMER_EXPLAIN_APP_UPDATE_REQUIRED_CLASSIFIER_RULES } from './ai-explain-app-update-required.util.js';
import { EXPLAIN_APP_UPDATE_REQUIRED_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-app-update-required-multilingual.fixtures.js';
import { CUSTOMER_EXPLAIN_ANALYTICS_CONSENT_CLASSIFIER_RULES } from './ai-explain-analytics-consent.util.js';
import { EXPLAIN_ANALYTICS_CONSENT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-analytics-consent-multilingual.fixtures.js';
import { CUSTOMER_EXPLAIN_HOME_SCREEN_WIDGET_CLASSIFIER_RULES } from './ai-explain-home-screen-widget.util.js';
import { EXPLAIN_HOME_SCREEN_WIDGET_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-home-screen-widget-multilingual.fixtures.js';
import { CUSTOMER_EXPLAIN_PATIENT_ALERT_CLASSIFIER_RULES } from './ai-explain-patient-alert.util.js';
import { EXPLAIN_PATIENT_ALERT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-patient-alert-multilingual.fixtures.js';
import { MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_CLASSIFIER_RULES } from './ai-manage-notification-preferences-multilingual.fixtures.js';
import { CUSTOMER_REBOOK_LAST_APPOINTMENT_CLASSIFIER_RULES } from './ai-rebook-last-appointment.util.js';
import { REBOOK_LAST_APPOINTMENT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-rebook-last-appointment-multilingual.fixtures.js';
import { CUSTOMER_EXPLAIN_MY_NOTIFICATIONS_CLASSIFIER_RULES } from './ai-explain-my-notifications.fixtures.js';
import { EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-my-notifications-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_HOW_TO_DOWNLOAD_APP_CLASSIFIER_RULES } from './ai-how-to-download-app.fixtures.js';
import { HOW_TO_DOWNLOAD_APP_MULTILINGUAL_CLASSIFIER_RULES } from './ai-how-to-download-app-multilingual.fixtures.js';
import { CUSTOMER_EXPLAIN_MULTI_SERVICE_CART_CLASSIFIER_RULES } from './ai-explain-multi-service-cart.fixtures.js';
import { EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-multi-service-cart-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_PACKAGE_SAVINGS_CLASSIFIER_RULES } from './ai-explain-package-savings.fixtures.js';
import { EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-package-savings-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES } from './ai-explain-subscription-vs-one-time.fixtures.js';
import { EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-subscription-vs-one-time-multilingual.fixtures.js';
import { CUSTOMER_BOOK_WITH_GIFT_CARD_CLASSIFIER_RULES } from './ai-book-with-gift-card.fixtures.js';
import { BOOK_WITH_GIFT_CARD_MULTILINGUAL_CLASSIFIER_RULES } from './ai-book-with-gift-card-multilingual.fixtures.js';
import { CUSTOMER_CANCEL_MY_BOOKING_CLASSIFIER_RULES } from './ai-cancel-my-booking.util.js';
import { CUSTOMER_GET_MANAGE_LINK_CLASSIFIER_RULES } from './ai-get-manage-link.util.js';
import { CUSTOMER_PUBLIC_RECOVER_LOST_MANAGE_LINK_CLASSIFIER_RULES } from './ai-recover-lost-manage-link.util.js';
import { RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_CLASSIFIER_RULES } from './ai-recover-lost-manage-link-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_SIGN_IN_TO_MANAGE_BOOKING_CLASSIFIER_RULES } from './ai-sign-in-to-manage-booking.util.js';
import { SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_CLASSIFIER_RULES } from './ai-sign-in-to-manage-booking-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_MANAGE_BOOKING_PAGE_CLASSIFIER_RULES } from './ai-explain-manage-booking-page.fixtures.js';
import { EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-manage-booking-page-multilingual.fixtures.js';
import { GET_MANAGE_LINK_MULTILINGUAL_CLASSIFIER_RULES } from './ai-get-manage-link-multilingual.fixtures.js';
import { CUSTOMER_NOTIFY_RUNNING_LATE_CLASSIFIER_RULES } from './ai-notify-running-late.util.js';
import { CUSTOMER_LEAVE_VISIT_REVIEW_CLASSIFIER_RULES } from './ai-leave-visit-review.util.js';
import { LEAVE_VISIT_REVIEW_MULTILINGUAL_CLASSIFIER_RULES } from './ai-leave-visit-review-multilingual.fixtures.js';
import { CUSTOMER_EXPLAIN_POST_VISIT_REVIEW_PROMPT_CLASSIFIER_RULES } from './ai-explain-post-visit-review-prompt.util.js';
import { EXPLAIN_POST_VISIT_REVIEW_PROMPT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-post-visit-review-prompt-multilingual.fixtures.js';
import { CUSTOMER_EXPLAIN_SHARE_REWARD_CLASSIFIER_RULES } from './ai-explain-share-reward.util.js';
import { EXPLAIN_SHARE_REWARD_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-share-reward-multilingual.fixtures.js';
import { CUSTOMER_REPORT_BOOKING_PROBLEM_CLASSIFIER_RULES } from './ai-report-booking-problem.util.js';
import { REPORT_BOOKING_PROBLEM_MULTILINGUAL_CLASSIFIER_RULES } from './ai-report-booking-problem-multilingual.fixtures.js';
import { CUSTOMER_SIGN_IN_AFTER_BOOKING_CLASSIFIER_RULES } from './ai-sign-in-after-booking.util.js';
import { SIGN_IN_AFTER_BOOKING_MULTILINGUAL_CLASSIFIER_RULES } from './ai-sign-in-after-booking-multilingual.fixtures.js';
import { NOTIFY_RUNNING_LATE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-notify-running-late-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_CUSTOMER_WAITLIST_CLASSIFIER_RULES } from './ai-customer-waitlist.util.js';
import { CUSTOMER_WAITLIST_MULTILINGUAL_CLASSIFIER_RULES } from './ai-customer-waitlist-multilingual.fixtures.js';
import { CUSTOMER_EXPLAIN_CANCEL_POLICY_CLASSIFIER_RULES } from './ai-explain-cancel-policy.util.js';
import { EXPLAIN_CANCEL_POLICY_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-cancel-policy-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_DEPOSIT_FORFEITURE_CLASSIFIER_RULES } from './ai-explain-deposit-forfeiture.util.js';
import { EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-deposit-forfeiture-multilingual.fixtures.js';
import { CUSTOMER_RESCHEDULE_MY_BOOKING_CLASSIFIER_RULES } from './ai-reschedule-my-booking.util.js';
import { CUSTOMER_APP_GUIDE_CLASSIFIER_RULES } from './ai-customer-product-guide.util.js';
import { CUSTOMER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES } from './ai-product-guide-empty-state.fixtures.js';
import { CUSTOMER_PUBLIC_PREPAYMENT_EXPLAIN_CLASSIFIER_RULES } from './ai-explain-prepayment.util.js';
import { CUSTOMER_PUBLIC_CASH_PAYMENT_CLASSIFIER_RULES } from './ai-cash-payment-checkout.util.js';
import { CUSTOMER_PUBLIC_PAY_ONLINE_CLASSIFIER_RULES } from './ai-pay-online-checkout.util.js';
import { CUSTOMER_PUBLIC_MULTI_SERVICE_CLASSIFIER_RULES } from './ai-multi-service-customer-public.util.js';
import { CUSTOMER_SUBSCRIPTION_MEMBERSHIP_CLASSIFIER_RULES } from './ai-subscription-membership-customer.util.js';
import { CUSTOMER_EXPLAIN_MY_SUBSCRIPTION_CLASSIFIER_RULES } from './ai-explain-my-subscription.fixtures.js';
import { EXPLAIN_MY_SUBSCRIPTION_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-my-subscription-multilingual.fixtures.js';
import { CUSTOMER_UPDATE_MY_PROFILE_CLASSIFIER_RULES } from './ai-update-my-profile.fixtures.js';
import { UPDATE_MY_PROFILE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-update-my-profile-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_APPLY_PROMO_CODE_CHECKOUT_CLASSIFIER_RULES } from './ai-apply-promo-code-checkout.util.js';
import { CUSTOMER_PUBLIC_PROMO_CODE_HELP_CLASSIFIER_RULES } from './ai-promo-code-help-customer-public.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SERVICE_PRICE_CLASSIFIER_RULES } from './ai-explain-service-price.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CLASSIFIER_RULES } from './ai-explain-payment-options-for-service.util.js';
import { CUSTOMER_PUBLIC_FIND_SOONEST_APPOINTMENT_CLASSIFIER_RULES } from './ai-find-soonest-appointment.util.js';
import { CUSTOMER_PUBLIC_COMPARE_SERVICES_CLASSIFIER_RULES } from './ai-compare-services.util.js';
import { COMPARE_SERVICES_MULTILINGUAL_CLASSIFIER_RULES } from './ai-compare-services-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_FILTER_SERVICES_NO_PREPAYMENT_CLASSIFIER_RULES } from './ai-filter-services-no-prepayment.util.js';
import { FILTER_SERVICES_NO_PREPAYMENT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-filter-services-no-prepayment-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_AMOUNT_DUE_NOW_CLASSIFIER_RULES } from './ai-explain-amount-due-now.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_GUEST_CHECKOUT_FIELDS_CLASSIFIER_RULES } from './ai-explain-guest-checkout-fields.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_WHY_SIGN_IN_CLASSIFIER_RULES } from './ai-explain-why-sign-in.util.js';
import { EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-why-sign-in-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_FIX_CHECKOUT_VALIDATION_ERROR_CLASSIFIER_RULES } from './ai-fix-checkout-validation-error.util.js';
import { CUSTOMER_PUBLIC_CONFIRM_MY_BOOKING_DETAILS_CLASSIFIER_RULES } from './ai-confirm-my-booking-details.util.js';
import { CUSTOMER_PUBLIC_ADD_BOOKING_TO_CALENDAR_CLASSIFIER_RULES } from './ai-add-booking-to-calendar.util.js';
import { CUSTOMER_PUBLIC_GET_DIRECTIONS_TO_SALON_CLASSIFIER_RULES } from './ai-get-directions-to-salon.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_PREPARATION_NOTES_CLASSIFIER_RULES } from './ai-explain-preparation-notes.util.js';
import { GET_DIRECTIONS_TO_SALON_MULTILINGUAL_CLASSIFIER_RULES } from './ai-get-directions-to-salon-multilingual.fixtures.js';
import { EXPLAIN_PREPARATION_NOTES_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-preparation-notes-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_BOOK_ANOTHER_SERVICE_CLASSIFIER_RULES } from './ai-book-another-service.util.js';
import { BOOK_ANOTHER_SERVICE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-book-another-service-multilingual.fixtures.js';
import { CUSTOMER_SHARE_MY_BOOKING_CLASSIFIER_RULES } from './ai-share-my-booking.util.js';
import { SHARE_MY_BOOKING_MULTILINGUAL_CLASSIFIER_RULES } from './ai-share-my-booking-multilingual.fixtures.js';
import { CUSTOMER_LIST_MY_UPCOMING_APPOINTMENTS_CLASSIFIER_RULES } from './ai-list-my-upcoming-appointments.util.js';
import { LIST_MY_UPCOMING_APPOINTMENTS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-list-my-upcoming-appointments-multilingual.fixtures.js';
import { CUSTOMER_RESUME_PENDING_PAYMENT_CLASSIFIER_RULES } from './ai-resume-pending-payment.util.js';
import { RESUME_PENDING_PAYMENT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-resume-pending-payment-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CLASSIFIER_RULES } from './ai-diagnose-stripe-checkout-failure.util.js';
import { DIAGNOSE_STRIPE_CHECKOUT_FAILURE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-diagnose-stripe-checkout-failure-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_PAY_AT_VENUE_FALLBACK_CLASSIFIER_RULES } from './ai-pay-at-venue-fallback.util.js';
import { PAY_AT_VENUE_FALLBACK_MULTILINGUAL_CLASSIFIER_RULES } from './ai-pay-at-venue-fallback-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_RESUME_BOOKING_DRAFT_CLASSIFIER_RULES } from './ai-resume-booking-draft.util.js';
import { RESUME_BOOKING_DRAFT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-resume-booking-draft-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SLOT_NO_LONGER_AVAILABLE_CLASSIFIER_RULES } from './ai-explain-slot-no-longer-available.util.js';
import { EXPLAIN_SLOT_NO_LONGER_AVAILABLE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-slot-no-longer-available-multilingual.fixtures.js';
import { CUSTOMER_EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_CLASSIFIER_RULES } from './ai-explain-multi-service-payment-return.util.js';
import { EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-multi-service-payment-return-multilingual.fixtures.js';
import { CUSTOMER_RETRY_FAILED_NETWORK_ACTION_CLASSIFIER_RULES } from './ai-retry-failed-network-action.util.js';
import { RETRY_FAILED_NETWORK_ACTION_MULTILINGUAL_CLASSIFIER_RULES } from './ai-retry-failed-network-action-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_VOICE_INPUT_CLASSIFIER_RULES } from './ai-explain-voice-input.util.js';
import { EXPLAIN_VOICE_INPUT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-voice-input-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_SPEAK_ASSISTANT_REPLY_CLASSIFIER_RULES } from './ai-speak-assistant-reply.util.js';
import { SPEAK_ASSISTANT_REPLY_MULTILINGUAL_CLASSIFIER_RULES } from './ai-speak-assistant-reply-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_GIVE_AI_FEEDBACK_CLASSIFIER_RULES } from './ai-give-ai-feedback.util.js';
import { GIVE_AI_FEEDBACK_MULTILINGUAL_CLASSIFIER_RULES } from './ai-give-ai-feedback-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_RTL_LAYOUT_CLASSIFIER_RULES } from './ai-explain-rtl-layout.util.js';
import { EXPLAIN_RTL_LAYOUT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-rtl-layout-multilingual.fixtures.js';
import { EXPLAIN_AMOUNT_DUE_NOW_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-amount-due-now-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CLASSIFIER_RULES } from './ai-explain-business-hours-and-location.util.js';
import { EXPLAIN_BUSINESS_HOURS_AND_LOCATION_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-business-hours-and-location-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SALON_PROFILE_CLASSIFIER_RULES } from './ai-explain-salon-profile.fixtures.js';
import { EXPLAIN_SALON_PROFILE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-salon-profile-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_PROVIDER_SPECIALTY_CLASSIFIER_RULES } from './ai-explain-provider-specialty.util.js';
import { EXPLAIN_PROVIDER_SPECIALTY_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-provider-specialty-multilingual.fixtures.js';
import { EXPLAIN_ANY_PROVIDER_OPTION_CLASSIFIER_RULES } from './ai-explain-any-provider-option.fixtures.js';
import { EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-any-provider-option-multilingual.fixtures.js';
import { PICK_PROVIDER_FOR_SERVICE_CLASSIFIER_RULES } from './ai-pick-provider-for-service.fixtures.js';
import { PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-pick-provider-for-service-multilingual.fixtures.js';
import { EXPLAIN_PROVIDER_AVAILABILITY_CLASSIFIER_RULES } from './ai-explain-provider-availability.fixtures.js';
import { EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-provider-availability-multilingual.fixtures.js';
import { SWITCH_PROVIDER_SAME_TIME_CLASSIFIER_RULES } from './ai-switch-provider-same-time.fixtures.js';
import { SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_CLASSIFIER_RULES } from './ai-switch-provider-same-time-multilingual.fixtures.js';
import { EXPLAIN_PROFESSIONAL_PROFILE_CLASSIFIER_RULES } from './ai-explain-professional-profile.fixtures.js';
import { EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-professional-profile-multilingual.fixtures.js';
import { CUSTOMER_LOYALTY_POINTS_BALANCE_CLASSIFIER_RULES } from './ai-loyalty-points-balance-customer.util.js';
import { CUSTOMER_EXPLAIN_LOYALTY_POINTS_CLASSIFIER_RULES } from './ai-explain-loyalty-points.fixtures.js';
import { EXPLAIN_LOYALTY_POINTS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-loyalty-points-multilingual.fixtures.js';
import { CUSTOMER_APPLY_LOYALTY_AT_CHECKOUT_CLASSIFIER_RULES } from './ai-apply-loyalty-at-checkout.fixtures.js';
import { APPLY_LOYALTY_AT_CHECKOUT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-apply-loyalty-at-checkout-multilingual.fixtures.js';
import {
  CUSTOMER_GROWTH_LOOPS_CLASSIFIER_RULES,
  GROWTH_LOOPS_MULTILINGUAL_CLASSIFIER_RULES,
} from './ai-growth-loops-customer.util.js';
import { CUSTOMER_PRIVACY_GDPR_CLASSIFIER_RULES } from './ai-privacy-gdpr-customer.util.js';
import { CUSTOMER_GIFT_CARD_CANCEL_CLASSIFIER_RULES } from './ai-gift-card-cancel-customer.util.js';
import { CUSTOMER_TRACK_PHYSICAL_GIFT_CARD_ORDER_CLASSIFIER_RULES } from './ai-track-physical-gift-card-order.fixtures.js';
import { TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_CLASSIFIER_RULES } from './ai-track-physical-gift-card-order-multilingual.fixtures.js';
import { CUSTOMER_CLAIM_GIFT_CARD_BALANCE_CLASSIFIER_RULES } from './ai-claim-gift-card-balance.fixtures.js';
import { CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-claim-gift-card-balance-multilingual.fixtures.js';
import { CUSTOMER_CANCEL_PACKAGE_VISIT_SELF_CLASSIFIER_RULES } from './ai-cancel-package-visit-self.util.js';
import { CANCEL_PACKAGE_VISIT_SELF_MULTILINGUAL_CLASSIFIER_RULES } from './ai-cancel-package-visit-self-multilingual.fixtures.js';
import { CUSTOMER_RESCHEDULE_PACKAGE_VISIT_SELF_CLASSIFIER_RULES } from './ai-reschedule-package-visit-self.util.js';
import { RESCHEDULE_PACKAGE_VISIT_SELF_MULTILINGUAL_CLASSIFIER_RULES } from './ai-reschedule-package-visit-self-multilingual.fixtures.js';
import { CUSTOMER_LIST_MY_PACKAGE_VISITS_CLASSIFIER_RULES } from './ai-list-my-package-visits-customer.util.js';
import { CUSTOMER_EXPLAIN_PACKAGE_VISIT_RULES_CLASSIFIER_RULES } from './ai-explain-package-visit-rules.util.js';
import { EXPLAIN_PACKAGE_VISIT_RULES_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-package-visit-rules-multilingual.fixtures.js';
import { CONSUMER_CLINIC_TEST_RESULTS_CLASSIFIER_RULES } from './ai-consumer-clinic-test-results.fixtures.js';
import { RESULTS_THEN_REBOOK_CLASSIFIER_RULES } from './ai-results-then-rebook-compound.fixtures.js';
import { RESULTS_THEN_REBOOK_MULTILINGUAL_CLASSIFIER_RULES } from './ai-results-then-rebook-compound-multilingual.fixtures.js';
import { CONSUMER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES } from './ai-clinic-lab-booking.fixtures.js';
import { CUSTOMER_BOOK_LAB_FROM_ORDER_CLASSIFIER_RULES } from './ai-book-lab-from-order.util.js';
import { BOOK_LAB_FROM_ORDER_MULTILINGUAL_CLASSIFIER_RULES } from './ai-book-lab-from-order-multilingual.fixtures.js';
import { CUSTOMER_BOOK_LAB_COLLECTION_NEAREST_CLASSIFIER_RULES } from './ai-book-lab-collection-nearest.fixtures.js';
import { BOOK_LAB_COLLECTION_NEAREST_MULTILINGUAL_CLASSIFIER_RULES } from './ai-book-lab-collection-nearest-multilingual.fixtures.js';
import { CUSTOMER_BOOK_TOUR_NEAREST_DEPARTURE_CLASSIFIER_RULES } from './ai-book-tour-nearest-departure.fixtures.js';
import { BOOK_TOUR_NEAREST_DEPARTURE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-book-tour-nearest-departure-multilingual.fixtures.js';
import { CLINIC_BOOKING_CLASSIFIER_RULES } from './ai-clinic-booking.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_LAB_PREP_CLASSIFIER_RULES } from './ai-explain-lab-prep.fixtures.js';
import { EXPLAIN_LAB_PREP_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-lab-prep-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_CLINIC_BOOKING_FIELDS_CLASSIFIER_RULES } from './ai-explain-clinic-booking-fields.fixtures.js';
import { EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-clinic-booking-fields-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_PUBLIC_INTAKE_FORM_CLASSIFIER_RULES } from './ai-explain-public-intake-form.fixtures.js';
import { EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-public-intake-form-multilingual.fixtures.js';
import { CUSTOMER_COMPLETE_INTAKE_AND_BOOK_CLASSIFIER_RULES } from './ai-complete-intake-and-book.fixtures.js';
import { COMPLETE_INTAKE_AND_BOOK_MULTILINGUAL_CLASSIFIER_RULES } from './ai-complete-intake-and-book-multilingual.fixtures.js';
import { INTAKE_LAB_BOOK_PAY_CLASSIFIER_RULES } from './ai-intake-lab-book-pay-compound.fixtures.js';
import { INTAKE_LAB_BOOK_PAY_MULTILINGUAL_CLASSIFIER_RULES } from './ai-intake-lab-book-pay-compound-multilingual.fixtures.js';
import { TOUR_GROUP_CHECKOUT_CLASSIFIER_RULES } from './ai-tour-group-checkout-compound.fixtures.js';
import { TOUR_GROUP_CHECKOUT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-tour-group-checkout-compound-multilingual.fixtures.js';
import { PROVIDER_SAME_DAY_MULTI_CLASSIFIER_RULES } from './ai-provider-same-day-multi-compound.fixtures.js';
import { PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_CLASSIFIER_RULES } from './ai-provider-same-day-multi-compound-multilingual.fixtures.js';
import { CUSTOMER_TRACK_LAB_ORDER_STATUS_CLASSIFIER_RULES } from './ai-track-lab-order-status.fixtures.js';
import { TRACK_LAB_ORDER_STATUS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-track-lab-order-status-multilingual.fixtures.js';
import { CUSTOMER_LIST_MY_DOCUMENTS_CLASSIFIER_RULES } from './ai-list-my-documents.fixtures.js';
import { LIST_MY_DOCUMENTS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-list-my-documents-multilingual.fixtures.js';
import { CUSTOMER_EXPLAIN_ABNORMAL_RESULT_FLAG_CLASSIFIER_RULES } from './ai-explain-abnormal-result-flag.fixtures.js';
import { EXPLAIN_ABNORMAL_RESULT_FLAG_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-abnormal-result-flag-multilingual.fixtures.js';
import { CUSTOMER_NOTIFY_WHEN_RESULTS_READY_CLASSIFIER_RULES } from './ai-notify-when-results-ready.fixtures.js';
import { NOTIFY_WHEN_RESULTS_READY_MULTILINGUAL_CLASSIFIER_RULES } from './ai-notify-when-results-ready-multilingual.fixtures.js';
import { BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES } from './ai-budget-service-discovery.fixtures.js';
import { CUSTOMER_PUBLIC_FIND_SERVICES_UNDER_BUDGET_CLASSIFIER_RULES } from './ai-find-services-under-budget.fixtures.js';
import { FIND_SERVICES_UNDER_BUDGET_MULTILINGUAL_CLASSIFIER_RULES } from './ai-find-services-under-budget-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_FIND_EVENING_WEEKEND_SLOTS_CLASSIFIER_RULES } from './ai-find-evening-weekend-slots.fixtures.js';
import { FIND_EVENING_WEEKEND_SLOTS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-find-evening-weekend-slots-multilingual.fixtures.js';
import { DISCOVER_BOOK_AND_PAY_CLASSIFIER_RULES } from './ai-discover-book-and-pay-compound.fixtures.js';
import { REBOOK_AND_PAY_CLASSIFIER_RULES } from './ai-rebook-and-pay-compound.fixtures.js';
import { SUBSCRIPTION_FIRST_VISIT_CLASSIFIER_RULES } from './ai-subscription-first-visit-compound.fixtures.js';
import { SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-subscription-first-visit-compound-multilingual.fixtures.js';
import { CANCEL_AND_REBOOK_CLASSIFIER_RULES } from './ai-cancel-and-rebook-compound.fixtures.js';
import { CANCEL_PACKAGE_REBOOK_SINGLE_CLASSIFIER_RULES } from './ai-cancel-package-rebook-single-compound.fixtures.js';
import { CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-cancel-package-rebook-single-compound-multilingual.fixtures.js';
import { GIFT_CARD_CHECKOUT_CLASSIFIER_RULES } from './ai-gift-card-checkout-compound.fixtures.js';
import { MULTI_SERVICE_DAY_CLASSIFIER_RULES } from './ai-multi-service-day-compound.fixtures.js';
import { GUEST_BOOK_AND_MANAGE_CLASSIFIER_RULES } from './ai-guest-book-and-manage-compound.fixtures.js';
import { GUEST_PAY_CASH_MANAGE_CLASSIFIER_RULES } from './ai-guest-pay-cash-manage-compound.fixtures.js';
import { GUEST_PAY_CASH_MANAGE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-guest-pay-cash-manage-compound-multilingual.fixtures.js';
import { FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES } from './ai-flexible-availability.fixtures.js';
import { SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES } from './ai-service-rank-discovery.fixtures.js';
import { TOUR_DAY_SLOTS_CLASSIFIER_RULES } from './ai-tour-day-slots.fixtures.js';
import { TOUR_MEETING_POINT_CLASSIFIER_RULES } from './ai-tour-meeting-point.fixtures.js';
import { EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-tour-meeting-point-multilingual.fixtures.js';
import { CUSTOMER_TOUR_BOOKING_RECORD_CLASSIFIER_RULES } from './ai-tour-booking-record.fixtures.js';
import { CUSTOMER_AVAILABILITY_DISAMBIGUATION_RULES } from './ai-intent-disambiguation.fixtures.js';
import {
  CUSTOMER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import type { PublicAssistantResult } from '../public-booking/public-booking-assistant.service.js';

/** Anonymous public-booking assistant intents routed via PublicBookingAssistantService.
 *  Documented in `ai-capability.matrix.ts` as `CUSTOMER_PUBLIC_DELEGATED_INTENTS`. */
export const PUBLIC_ONLY_ASSISTANT_ACTIONS = [
  'list_providers',
  'list_services',
  'find_services_under_budget',
  'find_evening_weekend_slots',
  'check_availability',
  'explain_provider_availability',
  'recommend_specialists',
  'business_info',
  'book_appointment',
  'booking_help',
] as const;

export type PublicOnlyAssistantAction =
  (typeof PUBLIC_ONLY_ASSISTANT_ACTIONS)[number];

export const CUSTOMER_SURFACE_INTENT_UNION = [
  ...new Set([...CUSTOMER_INTENTS, ...PUBLIC_INTENTS]),
] as const;

export function isPublicOnlyAssistantAction(
  action: string,
): action is PublicOnlyAssistantAction {
  return (PUBLIC_ONLY_ASSISTANT_ACTIONS as readonly string[]).includes(action);
}

export function isCustomerSurfaceIntent(action: string): boolean {
  if (
    action === 'unknown' ||
    action === 'error' ||
    action === 'security_blocked'
  )
    return true;
  return CUSTOMER_SURFACE_INTENT_UNION.includes(action);
}

export function publicAssistantResultToCommandResult(
  result: PublicAssistantResult,
): CommandResult {
  return {
    success: result.success,
    action: result.action,
    summary: result.summary,
    details: {
      sessionContext: result.sessionContext,
      navigate: result.navigate,
      bookingId: result.bookingId,
      ...(result.details ?? {}),
    },
  };
}

const PUBLIC_ASSISTANT_UI_DETAIL_KEYS = [
  'availability',
  'availableProviders',
  'providers',
  'serviceName',
  'serviceId',
  'date',
  'timeOfDay',
  'notBeforeTime',
  'checkProvidersHandoff',
  'slots',
  'serviceNames',
  'serviceIds',
] as const;

function serializePublicAssistantSessionContext(
  sessionContext: unknown,
): PublicAssistantResult['sessionContext'] {
  if (!sessionContext || typeof sessionContext !== 'object') return undefined;
  const out: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(
    sessionContext as Record<string, unknown>,
  )) {
    if (value == null || value === '') {
      out[key] = null;
      continue;
    }
    if (key === 'completedSteps' && Array.isArray(value)) {
      out[key] = JSON.stringify(value);
      continue;
    }
    out[key] = typeof value === 'string' ? value : String(value);
  }
  return out;
}

export function commandResultToPublicAssistantResult(
  result: CommandResult,
): PublicAssistantResult {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const assistantDetails: Record<string, unknown> = {};
  for (const key of PUBLIC_ASSISTANT_UI_DETAIL_KEYS) {
    if (details[key] !== undefined) {
      assistantDetails[key] = details[key];
    }
  }
  return {
    success: result.success,
    action: result.action ?? 'unknown',
    summary: result.summary,
    sessionContext: serializePublicAssistantSessionContext(
      details.sessionContext,
    ),
    navigate: details.navigate as PublicAssistantResult['navigate'],
    bookingId: details.bookingId as string | undefined,
    guide: result.guide,
    details:
      Object.keys(assistantDetails).length > 0 ? assistantDetails : undefined,
  };
}

export function buildCustomerClassifierSchema(): string {
  const customerActions = CUSTOMER_INTENTS.filter(
    (id) => id !== 'unknown',
  ).join(' | ');
  const publicActions = PUBLIC_ONLY_ASSISTANT_ACTIONS.join(' | ');
  return `You are a customer-facing booking assistant (public web + consumer app).
Classify the user's message and extract parameters. Return JSON:

{
  "action": ${customerActions} | ${publicActions} | unknown,
  "params": {
    "employeeName": "string or null",
    "allProviders": "boolean or null — true when no named provider and user asks who is free / any provider",
    "bookingFirstAvailable": "boolean or null — true for nearest/first/soonest/next/earliest/ASAP; leave timeSlot null",
    "serviceName": "string or null",
    "serviceNames": ["string"] or null,
    "packageName": "string or null",
    "packageId": "string or null",
    "bookingId": "string or null",
    "promoCode": "string or null",
    "loyaltyPointsToRedeem": "number or null — loyalty points to apply at checkout when user names an amount",
    "giftCardCode": "string or null",
    "date": "DD/MM/YYYY or null",
    "timeSlot": "HH:MM or null — omit when bookingFirstAvailable=true",
    "timeFrom": "HH:MM or null — earliest hour for flexible booking (e.g. after 16:00)",
    "timeOfDay": "morning | afternoon | evening | null",
    "availabilityWindows": [{"date": "DD/MM/YYYY or null", "weekdays": ["monday", "friday", etc.] or null, "timeOfDay": "morning | afternoon | evening | null", "timeFrom": "HH:MM or null", "timeSlot": "HH:MM or null", "employeeName": "string or null — named specialist for that OR window only"}] or null — OR alternatives (tomorrow evening OR Friday afternoon); each window scanned independently",
    "serviceCategory": "string or null — keyword to filter service type names (e.g. haircut, massage)",
    "maxPrice": "number or null — inclusive catalog display-price ceiling when the user states a budget",
    "serviceRank": "highest_price | lowest_price | most_popular | null — rank catalog services for list_services (premium/cheapest/popular service, not specialist ratings)",
    "serviceTier": "standard | premium | null — filter catalog rows by entity metadata tier",
    "paymentMethod": "cash | online | gift_card | null",
    "customerName": "string or null",
    "customerEmail": "string or null",
    "customerPhone": "string or null",
    "topicId": "string or null — optional consumer guide playbook id (consumer-tabs, consumer-account, consumer-packages-gift-cards) for explain_app_feature / guide_user_flow / explain_current_screen"
  },
  "reasoning": "one short sentence"
}

Rules:
- Use public assistant actions (list_providers, check_availability, book_appointment, etc.) for anonymous discovery/booking on the public page.
- Use customer self-service actions (book_package, list_my_appointments, cancel_my_booking, promo_code_help, etc.) for logged-in account flows.
- Check-then-book compound prompts (who is free + book nearest/soonest/ASAP) are executed as multi-step flows automatically — classify the first step as check_providers_for_service when only listing providers, or book_nearest_slot when only booking flexibly; never return create_booking/book_appointment with a missing timeSlot unless bookingFirstAvailable=true.
- Never invent catalog names; use context when provided.
- Default to "unknown" when unclear.
${CHECK_AND_BOOK_CLASSIFIER_RULES}
${CUSTOMER_AVAILABILITY_DISAMBIGUATION_RULES}
${BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_FIND_SERVICES_UNDER_BUDGET_CLASSIFIER_RULES}
${FIND_SERVICES_UNDER_BUDGET_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_FIND_EVENING_WEEKEND_SLOTS_CLASSIFIER_RULES}
${FIND_EVENING_WEEKEND_SLOTS_MULTILINGUAL_CLASSIFIER_RULES}
${DISCOVER_BOOK_AND_PAY_CLASSIFIER_RULES}
${REBOOK_AND_PAY_CLASSIFIER_RULES}
${SUBSCRIPTION_FIRST_VISIT_CLASSIFIER_RULES}
${SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_CLASSIFIER_RULES}
${CANCEL_AND_REBOOK_CLASSIFIER_RULES}
${CANCEL_PACKAGE_REBOOK_SINGLE_CLASSIFIER_RULES}
${CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_CLASSIFIER_RULES}
${GIFT_CARD_CHECKOUT_CLASSIFIER_RULES}
${MULTI_SERVICE_DAY_CLASSIFIER_RULES}
${PROVIDER_SAME_DAY_MULTI_CLASSIFIER_RULES}
${PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_CLASSIFIER_RULES}
${GUEST_BOOK_AND_MANAGE_CLASSIFIER_RULES}
${GUEST_PAY_CASH_MANAGE_CLASSIFIER_RULES}
${GUEST_PAY_CASH_MANAGE_MULTILINGUAL_CLASSIFIER_RULES}
${FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES}
${SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES}
${CHECKOUT_CURRENCY_CLASSIFIER_RULES}
${CHECKOUT_TAX_CLASSIFIER_RULES}
${TENANT_CURRENCY_CLASSIFIER_RULES}
${NOTIFICATION_CURRENCY_CLASSIFIER_RULES}
${STRIPE_CHECKOUT_CURRENCY_CLASSIFIER_RULES}
${BOOKING_LANGUAGES_CLASSIFIER_RULES}
${BOOKING_DATE_FORMAT_CLASSIFIER_RULES}
${TOUR_BOOKING_CLASSIFIER_RULES}
${TOUR_DAY_SLOTS_CLASSIFIER_RULES}
${TOUR_CAPACITY_CLASSIFIER_RULES}
${TOUR_MEETING_POINT_CLASSIFIER_RULES}
${EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_TOUR_BOOKING_RECORD_CLASSIFIER_RULES}
${CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES}
${CHECKOUT_RECOMMENDATIONS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_DISMISS_RECOMMENDATIONS_CLASSIFIER_RULES}
${DISMISS_RECOMMENDATIONS_MULTILINGUAL_CLASSIFIER_RULES}
${CONSUMER_CHECKOUT_SUCCESS_CLASSIFIER_RULES}
${CONSUMER_CHECKOUT_SUCCESS_EN_CLASSIFIER_RULES}
${CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CLASSIFIER_RULES}
${CONSUMER_CHECKOUT_TAX_CLASSIFIER_RULES}
${TAX_DISPLAY_EN_CLASSIFIER_RULES}
${DATA_RIGHTS_CLASSIFIER_RULES}
${CONSUMER_CLINIC_TEST_RESULTS_CLASSIFIER_RULES}
${RESULTS_THEN_REBOOK_CLASSIFIER_RULES}
${RESULTS_THEN_REBOOK_MULTILINGUAL_CLASSIFIER_RULES}
${CONSUMER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES}
${CUSTOMER_BOOK_LAB_FROM_ORDER_CLASSIFIER_RULES}
${BOOK_LAB_FROM_ORDER_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_BOOK_LAB_COLLECTION_NEAREST_CLASSIFIER_RULES}
${BOOK_LAB_COLLECTION_NEAREST_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_BOOK_TOUR_NEAREST_DEPARTURE_CLASSIFIER_RULES}
${BOOK_TOUR_NEAREST_DEPARTURE_MULTILINGUAL_CLASSIFIER_RULES}
${CLINIC_BOOKING_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_LAB_PREP_CLASSIFIER_RULES}
${EXPLAIN_LAB_PREP_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_CLINIC_BOOKING_FIELDS_CLASSIFIER_RULES}
${EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_PUBLIC_INTAKE_FORM_CLASSIFIER_RULES}
${EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_COMPLETE_INTAKE_AND_BOOK_CLASSIFIER_RULES}
${COMPLETE_INTAKE_AND_BOOK_MULTILINGUAL_CLASSIFIER_RULES}
${INTAKE_LAB_BOOK_PAY_CLASSIFIER_RULES}
${INTAKE_LAB_BOOK_PAY_MULTILINGUAL_CLASSIFIER_RULES}
${TOUR_GROUP_CHECKOUT_CLASSIFIER_RULES}
${TOUR_GROUP_CHECKOUT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_TRACK_LAB_ORDER_STATUS_CLASSIFIER_RULES}
${TRACK_LAB_ORDER_STATUS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_LIST_MY_DOCUMENTS_CLASSIFIER_RULES}
${LIST_MY_DOCUMENTS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_ABNORMAL_RESULT_FLAG_CLASSIFIER_RULES}
${EXPLAIN_ABNORMAL_RESULT_FLAG_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_NOTIFY_WHEN_RESULTS_READY_CLASSIFIER_RULES}
${NOTIFY_WHEN_RESULTS_READY_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX}
${CUSTOMER_PACKAGE_BOOKING_CLASSIFIER_RULES}
${CONSUMER_ADOPTION_CLASSIFIER_RULES}
${CUSTOMER_FIND_MY_SAVED_SALONS_CLASSIFIER_RULES}
${FIND_MY_SAVED_SALONS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_SWITCH_SALON_TENANT_CLASSIFIER_RULES}
${SWITCH_SALON_TENANT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_REBOOK_LAST_APPOINTMENT_CLASSIFIER_RULES}
${REBOOK_LAST_APPOINTMENT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_GROWTH_LOOPS_CLASSIFIER_RULES}
${GROWTH_LOOPS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_MY_NOTIFICATIONS_CLASSIFIER_RULES}
${EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_MANAGE_NOTIFICATION_PREFERENCES_CLASSIFIER_RULES}
${MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_CLASSIFIER_RULES}
${CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_PUSH_PERMISSION_CLASSIFIER_RULES}
${EXPLAIN_PUSH_PERMISSION_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_OFFLINE_MODE_CLASSIFIER_RULES}
${EXPLAIN_OFFLINE_MODE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_APP_UPDATE_REQUIRED_CLASSIFIER_RULES}
${EXPLAIN_APP_UPDATE_REQUIRED_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_ANALYTICS_CONSENT_CLASSIFIER_RULES}
${EXPLAIN_ANALYTICS_CONSENT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_HOME_SCREEN_WIDGET_CLASSIFIER_RULES}
${EXPLAIN_HOME_SCREEN_WIDGET_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_PATIENT_ALERT_CLASSIFIER_RULES}
${EXPLAIN_PATIENT_ALERT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_APP_GUIDE_CLASSIFIER_RULES}
${CUSTOMER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_PREPAYMENT_EXPLAIN_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_CASH_PAYMENT_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_PAY_ONLINE_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CLASSIFIER_RULES}
${DIAGNOSE_STRIPE_CHECKOUT_FAILURE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_PAY_AT_VENUE_FALLBACK_CLASSIFIER_RULES}
${PAY_AT_VENUE_FALLBACK_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_RESUME_BOOKING_DRAFT_CLASSIFIER_RULES}
${RESUME_BOOKING_DRAFT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_SLOT_NO_LONGER_AVAILABLE_CLASSIFIER_RULES}
${EXPLAIN_SLOT_NO_LONGER_AVAILABLE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_CLASSIFIER_RULES}
${EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_RETRY_FAILED_NETWORK_ACTION_CLASSIFIER_RULES}
${RETRY_FAILED_NETWORK_ACTION_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_VOICE_INPUT_CLASSIFIER_RULES}
${EXPLAIN_VOICE_INPUT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_SPEAK_ASSISTANT_REPLY_CLASSIFIER_RULES}
${SPEAK_ASSISTANT_REPLY_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_GIVE_AI_FEEDBACK_CLASSIFIER_RULES}
${GIVE_AI_FEEDBACK_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_RTL_LAYOUT_CLASSIFIER_RULES}
${EXPLAIN_RTL_LAYOUT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_RESUME_PENDING_PAYMENT_CLASSIFIER_RULES}
${RESUME_PENDING_PAYMENT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_MULTI_SERVICE_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_MULTI_SERVICE_CART_CLASSIFIER_RULES}
${EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_PACKAGE_SAVINGS_CLASSIFIER_RULES}
${EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES}
${EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_BOOK_WITH_GIFT_CARD_CLASSIFIER_RULES}
${BOOK_WITH_GIFT_CARD_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_BUY_GIFT_CARD_FOR_SOMEONE_CLASSIFIER_RULES}
${BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_SUBSCRIPTION_MEMBERSHIP_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_MY_SUBSCRIPTION_CLASSIFIER_RULES}
${EXPLAIN_MY_SUBSCRIPTION_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_UPDATE_MY_PROFILE_CLASSIFIER_RULES}
${UPDATE_MY_PROFILE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_PROMO_CODE_HELP_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_APPLY_PROMO_CODE_CHECKOUT_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_SERVICE_PRICE_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_FIND_SOONEST_APPOINTMENT_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_COMPARE_SERVICES_CLASSIFIER_RULES}
${COMPARE_SERVICES_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_FILTER_SERVICES_NO_PREPAYMENT_CLASSIFIER_RULES}
${FILTER_SERVICES_NO_PREPAYMENT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_AMOUNT_DUE_NOW_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_GUEST_CHECKOUT_FIELDS_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_WHY_SIGN_IN_CLASSIFIER_RULES}
${EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_FIX_CHECKOUT_VALIDATION_ERROR_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_CONFIRM_MY_BOOKING_DETAILS_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_ADD_BOOKING_TO_CALENDAR_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_BOOK_ANOTHER_SERVICE_CLASSIFIER_RULES}
${BOOK_ANOTHER_SERVICE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_SHARE_MY_BOOKING_CLASSIFIER_RULES}
${SHARE_MY_BOOKING_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_SHARE_REWARD_CLASSIFIER_RULES}
${EXPLAIN_SHARE_REWARD_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_LIST_MY_UPCOMING_APPOINTMENTS_CLASSIFIER_RULES}
${LIST_MY_UPCOMING_APPOINTMENTS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_GET_DIRECTIONS_TO_SALON_CLASSIFIER_RULES}
${GET_DIRECTIONS_TO_SALON_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_PREPARATION_NOTES_CLASSIFIER_RULES}
${EXPLAIN_PREPARATION_NOTES_MULTILINGUAL_CLASSIFIER_RULES}
${EXPLAIN_AMOUNT_DUE_NOW_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CLASSIFIER_RULES}
${EXPLAIN_BUSINESS_HOURS_AND_LOCATION_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_SALON_PROFILE_CLASSIFIER_RULES}
${EXPLAIN_SALON_PROFILE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_PROVIDER_SPECIALTY_CLASSIFIER_RULES}
${EXPLAIN_PROVIDER_SPECIALTY_MULTILINGUAL_CLASSIFIER_RULES}
${EXPLAIN_ANY_PROVIDER_OPTION_CLASSIFIER_RULES}
${EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_CLASSIFIER_RULES}
${PICK_PROVIDER_FOR_SERVICE_CLASSIFIER_RULES}
${PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_CLASSIFIER_RULES}
${EXPLAIN_PROVIDER_AVAILABILITY_CLASSIFIER_RULES}
${EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_CLASSIFIER_RULES}
${SWITCH_PROVIDER_SAME_TIME_CLASSIFIER_RULES}
${SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_CLASSIFIER_RULES}
${EXPLAIN_PROFESSIONAL_PROFILE_CLASSIFIER_RULES}
${EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_LOYALTY_POINTS_BALANCE_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_LOYALTY_POINTS_CLASSIFIER_RULES}
${EXPLAIN_LOYALTY_POINTS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_APPLY_LOYALTY_AT_CHECKOUT_CLASSIFIER_RULES}
${APPLY_LOYALTY_AT_CHECKOUT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PRIVACY_GDPR_CLASSIFIER_RULES}
${CUSTOMER_GIFT_CARD_CANCEL_CLASSIFIER_RULES}
${CUSTOMER_CLAIM_GIFT_CARD_BALANCE_CLASSIFIER_RULES}
${CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_TRACK_PHYSICAL_GIFT_CARD_ORDER_CLASSIFIER_RULES}
${TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_CANCEL_PACKAGE_VISIT_SELF_CLASSIFIER_RULES}
${CANCEL_PACKAGE_VISIT_SELF_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_RESCHEDULE_PACKAGE_VISIT_SELF_CLASSIFIER_RULES}
${RESCHEDULE_PACKAGE_VISIT_SELF_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_LIST_MY_PACKAGE_VISITS_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_PACKAGE_VISIT_RULES_CLASSIFIER_RULES}
${EXPLAIN_PACKAGE_VISIT_RULES_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_HOW_TO_DOWNLOAD_APP_CLASSIFIER_RULES}
${HOW_TO_DOWNLOAD_APP_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_CANCEL_MY_BOOKING_CLASSIFIER_RULES}
${CUSTOMER_GET_MANAGE_LINK_CLASSIFIER_RULES}
${GET_MANAGE_LINK_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_RECOVER_LOST_MANAGE_LINK_CLASSIFIER_RULES}
${RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_SIGN_IN_TO_MANAGE_BOOKING_CLASSIFIER_RULES}
${SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_MANAGE_BOOKING_PAGE_CLASSIFIER_RULES}
${EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_NOTIFY_RUNNING_LATE_CLASSIFIER_RULES}
${NOTIFY_RUNNING_LATE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_LEAVE_VISIT_REVIEW_CLASSIFIER_RULES}
${LEAVE_VISIT_REVIEW_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_POST_VISIT_REVIEW_PROMPT_CLASSIFIER_RULES}
${EXPLAIN_POST_VISIT_REVIEW_PROMPT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_REPORT_BOOKING_PROBLEM_CLASSIFIER_RULES}
${REPORT_BOOKING_PROBLEM_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_SIGN_IN_AFTER_BOOKING_CLASSIFIER_RULES}
${SIGN_IN_AFTER_BOOKING_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_CUSTOMER_WAITLIST_CLASSIFIER_RULES}
${CUSTOMER_WAITLIST_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_CANCEL_POLICY_CLASSIFIER_RULES}
${EXPLAIN_CANCEL_POLICY_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_DEPOSIT_FORFEITURE_CLASSIFIER_RULES}
${EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_RESCHEDULE_MY_BOOKING_CLASSIFIER_RULES}

${CLASSIFIER_MULTILINGUAL_RULES}`;
}

export function mergeCustomerCompoundContext(
  context: Record<string, unknown>,
  result: CommandResult,
): Record<string, unknown> {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const next = { ...context };
  if (details.sessionContext && typeof details.sessionContext === 'object') {
    Object.assign(next, details.sessionContext);
  }
  for (const key of [
    'cartServiceIds',
    'bookingId',
    'packageId',
    'packageName',
    'manageUrl',
    'promoCode',
    'loyaltyPointsToRedeem',
    'giftCardCode',
    'paymentMethod',
    'useSubscriptionId',
    'serviceId',
    'employeeId',
  ]) {
    if (details[key] !== undefined) next[key] = details[key];
  }
  Object.assign(next, pickSharedBookingContextSlice(details));
  const sessionSlice = pickSharedBookingContextSlice(
    (details.sessionContext as Record<string, unknown> | undefined) ?? {},
  );
  Object.assign(next, sessionSlice);
  return mergeCheckProvidersHandoffIntoContext(next, result);
}
