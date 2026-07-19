/** ai-cmd-customer-6.13 — every `public-api.ts` (web + consumer app) export maps to a
 *  customer/public AI intent, is dashboard-only, or is explicitly marked `no-ai`. Mirrors
 *  the provider-side gate in `provider-exp-ai-parity.fixtures.ts` (prov-exp-11). */

export type CustomerPublicApiAiParityCoverage =
  | { kind: 'customer-ai'; intents: readonly string[] }
  | { kind: 'public-ai'; intents: readonly string[] }
  | { kind: 'dashboard-only'; reason: string }
  | { kind: 'no-ai'; reason: string };

export interface CustomerPublicApiParityEntry {
  id: string;
  /** Canonical export name — the frontend widget and consumer app may both wrap the
   *  same backend route under different names; `aliasOf` records the sibling export. */
  exportName: string;
  aliasOf?: string;
  apiModule: string;
  coverage: CustomerPublicApiAiParityCoverage;
  notes?: string;
}

export const CUSTOMER_PUBLIC_API_AI_PARITY: readonly CustomerPublicApiParityEntry[] =
  [
    // ai-cmd-customer-6.1 — discovery & catalog
    {
      id: 'capi-profile',
      exportName: 'getPublicProfile',
      aliasOf: 'fetchPublicProfile',
      apiModule: 'public-booking',
      coverage: { kind: 'public-ai', intents: ['business_info'] },
    },
    {
      id: 'capi-app-install',
      exportName: 'getPublicAppInstall',
      apiModule: 'public-booking',
      coverage: {
        kind: 'no-ai',
        reason: 'Static app-install banner config, no assistant action',
      },
    },
    {
      id: 'capi-providers',
      exportName: 'getPublicProviders',
      aliasOf: 'fetchPublicProviders',
      apiModule: 'public-booking',
      coverage: { kind: 'public-ai', intents: ['list_providers'] },
    },
    {
      id: 'capi-provider-slots',
      exportName: 'getPublicProviderSlots',
      apiModule: 'public-booking',
      coverage: { kind: 'public-ai', intents: ['check_availability'] },
    },
    {
      id: 'capi-provider-reviews',
      exportName: 'getPublicProviderReviews',
      aliasOf: 'fetchPublicProviderReviews',
      apiModule: 'reviews',
      coverage: { kind: 'public-ai', intents: ['list_provider_reviews'] },
    },
    {
      id: 'capi-submit-provider-review',
      exportName: 'submitProviderPortalReview',
      aliasOf: 'submitPublicProviderReview',
      apiModule: 'reviews',
      coverage: { kind: 'public-ai', intents: ['submit_provider_review'] },
    },
    {
      id: 'capi-services',
      exportName: 'getPublicServices',
      aliasOf: 'fetchPublicServices',
      apiModule: 'public-booking',
      coverage: { kind: 'public-ai', intents: ['list_services'] },
    },
    {
      id: 'capi-services-for-slot',
      exportName: 'getPublicServicesForSlot',
      aliasOf: 'fetchPublicServicesForSlot',
      apiModule: 'public-booking',
      coverage: { kind: 'public-ai', intents: ['check_availability'] },
    },
    {
      id: 'capi-service-slot-providers',
      exportName: 'getPublicServiceSlotProviders',
      aliasOf: 'fetchServiceSlotProviders',
      apiModule: 'public-booking',
      coverage: { kind: 'public-ai', intents: ['pick_provider_for_service'] },
    },
    {
      id: 'capi-service-day-slots',
      exportName: 'getPublicServiceDaySlots',
      aliasOf: 'fetchServiceDaySlots',
      apiModule: 'public-booking',
      coverage: { kind: 'public-ai', intents: ['check_availability'] },
    },
    {
      id: 'capi-service-bookable-dates',
      exportName: 'getPublicServiceBookableDates',
      aliasOf: 'fetchServiceBookableDates',
      apiModule: 'public-booking',
      coverage: { kind: 'public-ai', intents: ['check_availability'] },
    },
    {
      id: 'capi-promotions',
      exportName: 'fetchPublicPromotions',
      apiModule: 'public-booking',
      coverage: { kind: 'public-ai', intents: ['list_public_promotions'] },
    },
    {
      id: 'capi-nearest-slot',
      exportName: 'fetchNearestBookableSlot',
      apiModule: 'public-booking',
      coverage: { kind: 'customer-ai', intents: ['book_nearest_slot'] },
    },
    // ai-cmd-customer-6.1 — packages & multi-service preview
    {
      id: 'capi-packages',
      exportName: 'getPublicPackages',
      aliasOf: 'fetchPublicPackages',
      apiModule: 'service-packages',
      coverage: { kind: 'public-ai', intents: ['discover_packages'] },
    },
    {
      id: 'capi-package',
      exportName: 'getPublicPackage',
      aliasOf: 'fetchPublicPackage',
      apiModule: 'service-packages',
      coverage: { kind: 'public-ai', intents: ['discover_packages'] },
    },
    {
      id: 'capi-package-slots',
      exportName: 'suggestPublicPackageSlots',
      apiModule: 'service-packages',
      coverage: { kind: 'customer-ai', intents: ['check_package_availability'] },
    },
    {
      id: 'capi-package-block-slots',
      exportName: 'getPublicPackageBlockSlots',
      aliasOf: 'fetchPackageBlockSlots',
      apiModule: 'service-packages',
      coverage: {
        kind: 'public-ai',
        intents: ['check_package_line_availability'],
      },
    },
    {
      id: 'capi-suggest-package-block',
      exportName: 'suggestPublicPackageBlock',
      aliasOf: 'suggestPackageBlock',
      apiModule: 'service-packages',
      coverage: { kind: 'public-ai', intents: ['suggest_package_block'] },
    },
    {
      id: 'capi-package-providers',
      exportName: 'getPublicPackageProviders',
      aliasOf: 'fetchPackageProviders',
      apiModule: 'service-packages',
      coverage: { kind: 'customer-ai', intents: ['check_package_availability'] },
    },
    {
      id: 'capi-quote-package',
      exportName: 'quotePublicPackage',
      apiModule: 'payments',
      coverage: { kind: 'customer-ai', intents: ['get_package_quote'] },
    },
    {
      id: 'capi-book-package',
      exportName: 'bookPublicPackage',
      apiModule: 'service-packages',
      coverage: { kind: 'customer-ai', intents: ['book_package'] },
    },
    {
      id: 'capi-package-checkout',
      exportName: 'createPublicPackageCheckout',
      apiModule: 'payments',
      coverage: { kind: 'public-ai', intents: ['pay_online'] },
    },
    {
      id: 'capi-preview-multi-service',
      exportName: 'previewPublicMultiService',
      apiModule: 'public-booking',
      coverage: { kind: 'public-ai', intents: ['preview_multi_service_cart'] },
    },
    {
      id: 'capi-preview-multi-service-alias',
      exportName: 'quotePublicMultiServicePreview',
      aliasOf: 'previewPublicMultiService',
      apiModule: 'public-booking',
      coverage: { kind: 'public-ai', intents: ['preview_multi_service_cart'] },
      notes: 'Consumer-app alias that delegates straight to previewPublicMultiService',
    },
    {
      id: 'capi-multi-service-block-slots',
      exportName: 'getPublicMultiServiceBlockSlots',
      apiModule: 'multi-service-bookings',
      coverage: {
        kind: 'public-ai',
        intents: ['check_multi_service_availability'],
      },
    },
    {
      id: 'capi-suggest-multi-service-block',
      exportName: 'suggestPublicMultiServiceBlock',
      apiModule: 'multi-service-bookings',
      coverage: {
        kind: 'public-ai',
        intents: ['check_multi_service_availability'],
      },
    },
    {
      id: 'capi-multi-service-providers',
      exportName: 'getPublicMultiServiceProviders',
      apiModule: 'multi-service-bookings',
      coverage: {
        kind: 'public-ai',
        intents: ['check_multi_service_availability'],
      },
    },
    {
      id: 'capi-suggest-multi-service-lines',
      exportName: 'suggestPublicMultiServiceLines',
      apiModule: 'multi-service-bookings',
      coverage: {
        kind: 'public-ai',
        intents: ['check_multi_service_availability'],
      },
    },
    {
      id: 'capi-book-multi-service',
      exportName: 'bookPublicMultiService',
      apiModule: 'multi-service-bookings',
      coverage: { kind: 'public-ai', intents: ['book_multi_service'] },
    },
    {
      id: 'capi-multi-service-checkout',
      exportName: 'createPublicMultiServiceCheckout',
      apiModule: 'payments',
      coverage: { kind: 'public-ai', intents: ['pay_online'] },
    },
    {
      id: 'capi-quote-multi-service',
      exportName: 'quotePublicMultiService',
      apiModule: 'payments',
      coverage: { kind: 'customer-ai', intents: ['get_multi_service_quote'] },
    },
    // ai-cmd-customer-6.2 — checkout
    {
      id: 'capi-quote-booking',
      exportName: 'quotePublicBooking',
      apiModule: 'payments',
      coverage: { kind: 'customer-ai', intents: ['get_booking_quote'] },
    },
    {
      id: 'capi-create-booking',
      exportName: 'createPublicBooking',
      aliasOf: 'createBooking',
      apiModule: 'public-booking',
      coverage: { kind: 'public-ai', intents: ['book_appointment'] },
    },
    {
      id: 'capi-book-with-cash',
      exportName: 'createPublicBooking',
      apiModule: 'public-booking',
      coverage: { kind: 'customer-ai', intents: ['book_with_cash'] },
      notes: 'Same booking-creation call with paymentMethod=cash',
    },
    {
      id: 'capi-book-with-gift-card',
      exportName: 'createPublicBooking',
      apiModule: 'public-booking',
      coverage: { kind: 'customer-ai', intents: ['book_with_gift_card'] },
      notes: 'Same booking-creation call with paymentMethod=gift_card',
    },
    {
      id: 'capi-select-subscription-plan',
      exportName: 'createPublicBooking',
      apiModule: 'public-booking',
      coverage: { kind: 'customer-ai', intents: ['select_subscription_plan'] },
      notes: 'Same booking-creation call with a purchasePlanId field',
    },
    {
      id: 'capi-booking-checkout',
      exportName: 'createPublicBookingCheckout',
      apiModule: 'payments',
      coverage: { kind: 'public-ai', intents: ['pay_online'] },
    },
    {
      id: 'capi-confirm-payment',
      exportName: 'confirmPublicBookingPayment',
      apiModule: 'payments',
      coverage: { kind: 'customer-ai', intents: ['confirm_stripe_payment'] },
    },
    {
      id: 'capi-gift-card-quote',
      exportName: 'quotePublicGiftCardPurchase',
      apiModule: 'payments',
      coverage: { kind: 'customer-ai', intents: ['get_gift_card_quote'] },
    },
    {
      id: 'capi-gift-card-checkout',
      exportName: 'createPublicGiftCardCheckout',
      apiModule: 'payments',
      coverage: { kind: 'customer-ai', intents: ['buy_gift_card'] },
    },
    {
      id: 'capi-gift-card-purchase',
      exportName: 'purchasePublicGiftCard',
      apiModule: 'payments',
      coverage: { kind: 'customer-ai', intents: ['buy_gift_card'] },
    },
    {
      id: 'capi-checkout-recommendations',
      exportName: 'getCheckoutRecommendations',
      aliasOf: 'fetchCheckoutRecommendations',
      apiModule: 'ai-command',
      coverage: {
        kind: 'customer-ai',
        intents: ['explain_checkout_recommendations'],
      },
    },
    {
      id: 'capi-checkout-recommendation-event',
      exportName: 'recordProductRecommendationEvent',
      aliasOf: 'recordCheckoutRecommendationEvent',
      apiModule: 'ai-command',
      coverage: {
        kind: 'no-ai',
        reason: 'Background analytics event, no user-facing intent',
      },
    },
    // ai-cmd-customer-6.3 — booking management
    {
      id: 'capi-my-bookings',
      exportName: 'getPublicCustomerBookings',
      aliasOf: 'fetchMyBookings',
      apiModule: 'public-booking',
      coverage: { kind: 'customer-ai', intents: ['my_appointments'] },
    },
    {
      id: 'capi-cancel-booking',
      exportName: 'cancelPublicCustomerBooking',
      aliasOf: 'cancelCustomerBooking',
      apiModule: 'public-booking',
      coverage: { kind: 'customer-ai', intents: ['cancel_my_booking'] },
    },
    {
      id: 'capi-cancel-booking-token',
      exportName: 'cancelPublicBookingWithToken',
      aliasOf: 'cancelBookingWithToken',
      apiModule: 'public-booking',
      coverage: { kind: 'customer-ai', intents: ['cancel_booking_with_token'] },
    },
    {
      id: 'capi-reschedule-booking',
      exportName: 'reschedulePublicCustomerBooking',
      aliasOf: 'rescheduleCustomerBooking',
      apiModule: 'public-booking',
      coverage: {
        kind: 'customer-ai',
        intents: ['reschedule_my_booking', 'change_provider_on_reschedule'],
      },
    },
    {
      id: 'capi-reschedule-booking-token',
      exportName: 'reschedulePublicBookingWithToken',
      aliasOf: 'rescheduleBookingWithToken',
      apiModule: 'public-booking',
      coverage: {
        kind: 'customer-ai',
        intents: ['reschedule_booking_with_token'],
      },
    },
    {
      id: 'capi-booking-manage-context',
      exportName: 'getPublicBookingManageContext',
      aliasOf: 'fetchBookingManageContext',
      apiModule: 'public-booking',
      coverage: {
        kind: 'customer-ai',
        intents: [
          'get_manage_link',
          'explain_manage_booking_page',
          'explain_manage_booking_context',
        ],
      },
    },
    {
      id: 'capi-cancel-package-visit',
      exportName: 'cancelPublicCustomerPackageVisit',
      aliasOf: 'cancelCustomerPackageVisit',
      apiModule: 'public-booking',
      coverage: { kind: 'customer-ai', intents: ['cancel_package_visit_self'] },
    },
    {
      id: 'capi-cancel-package-visit-token',
      exportName: 'cancelPublicPackageVisitWithToken',
      aliasOf: 'cancelPackageVisitWithToken',
      apiModule: 'public-booking',
      coverage: {
        kind: 'customer-ai',
        intents: ['cancel_package_visit_with_token'],
      },
    },
    {
      id: 'capi-reschedule-package-visit',
      exportName: 'reschedulePublicCustomerPackageVisit',
      aliasOf: 'rescheduleCustomerPackageVisit',
      apiModule: 'public-booking',
      coverage: {
        kind: 'customer-ai',
        intents: ['reschedule_package_visit_self', 'reschedule_package_lines'],
      },
    },
    {
      id: 'capi-reschedule-package-visit-token',
      exportName: 'reschedulePublicPackageVisitWithToken',
      aliasOf: 'reschedulePackageVisitWithToken',
      apiModule: 'public-booking',
      coverage: {
        kind: 'customer-ai',
        intents: ['reschedule_package_visit_with_token'],
      },
    },
    // ai-cmd-customer-6.4 — pre-visit intake
    {
      id: 'capi-intake-config',
      exportName: 'getPublicPreVisitIntakeConfig',
      aliasOf: 'fetchPublicPreVisitIntakeConfig',
      apiModule: 'clinic-pre-visit-intakes',
      coverage: { kind: 'public-ai', intents: ['explain_public_intake_form'] },
    },
    {
      id: 'capi-intake-draft',
      exportName: 'createPublicPreVisitIntakeDraft',
      apiModule: 'clinic-pre-visit-intakes',
      coverage: { kind: 'public-ai', intents: ['create_intake_draft'] },
    },
    {
      id: 'capi-intake-flow',
      exportName: 'getPublicPreVisitIntakeFlow',
      aliasOf: 'fetchPublicPreVisitIntakeFlow',
      apiModule: 'clinic-pre-visit-intakes',
      coverage: { kind: 'public-ai', intents: ['get_intake_flow_status'] },
    },
    {
      id: 'capi-intake-start',
      exportName: 'startPublicPreVisitIntake',
      apiModule: 'clinic-pre-visit-intakes',
      coverage: { kind: 'public-ai', intents: ['start_pre_visit_intake'] },
    },
    {
      id: 'capi-intake-answer',
      exportName: 'submitPublicPreVisitIntakeAnswer',
      apiModule: 'clinic-pre-visit-intakes',
      coverage: { kind: 'public-ai', intents: ['submit_intake_answers'] },
    },
    // ai-cmd-customer-6.5 — account, auth, locale, privacy
    {
      id: 'capi-login',
      exportName: 'loginPublicCustomer',
      aliasOf: 'loginWithGoogle',
      apiModule: 'public-booking',
      coverage: {
        kind: 'public-ai',
        intents: ['sign_in_with_google', 'sign_in_with_apple', 'sign_in_with_phone'],
      },
    },
    {
      id: 'capi-customer-me',
      exportName: 'getPublicCustomerMe',
      apiModule: 'public-booking',
      coverage: { kind: 'customer-ai', intents: ['my_profile'] },
    },
    {
      id: 'capi-preferred-locale-get',
      exportName: 'fetchMyPreferredLocale',
      apiModule: 'public-booking',
      coverage: { kind: 'customer-ai', intents: ['get_my_locale'] },
    },
    {
      id: 'capi-preferred-locale-update',
      exportName: 'updatePublicCustomerPreferredLocale',
      aliasOf: 'updateMyPreferredLocale',
      apiModule: 'public-booking',
      coverage: { kind: 'customer-ai', intents: ['update_my_locale'] },
    },
    {
      id: 'capi-notification-prefs-get',
      exportName: 'fetchMyNotificationPreferences',
      apiModule: 'notifications',
      coverage: { kind: 'customer-ai', intents: ['explain_my_notifications'] },
    },
    {
      id: 'capi-notification-prefs-update',
      exportName: 'updateMyNotificationPreferences',
      apiModule: 'notifications',
      coverage: {
        kind: 'customer-ai',
        intents: ['manage_notification_preferences'],
      },
    },
    {
      id: 'capi-privacy-export',
      exportName: 'exportPublicCustomerData',
      apiModule: 'customer-crm',
      coverage: { kind: 'customer-ai', intents: ['privacy_export'] },
    },
    {
      id: 'capi-privacy-delete',
      exportName: 'deletePublicCustomerData',
      apiModule: 'customer-crm',
      coverage: { kind: 'customer-ai', intents: ['privacy_delete'] },
    },
    {
      id: 'capi-support-ticket',
      exportName: 'createPostBookingSupportTicket',
      apiModule: 'customer-crm',
      coverage: {
        kind: 'customer-ai',
        intents: [
          'contact_support',
          'open_ticket_for_order',
          'report_booking_problem',
        ],
      },
    },
    // ai-cmd-customer-6.6 — loyalty, rewards, referrals, share
    {
      id: 'capi-referral-program',
      exportName: 'getPublicCustomerReferralProgram',
      aliasOf: 'fetchMyReferralProgram',
      apiModule: 'consumer-adoption',
      coverage: { kind: 'customer-ai', intents: ['explain_rewards_wallet'] },
    },
    {
      id: 'capi-claim-referral',
      exportName: 'claimPublicReferralCode',
      aliasOf: 'claimReferralCode',
      apiModule: 'consumer-adoption',
      coverage: { kind: 'customer-ai', intents: ['claim_referral_code'] },
    },
    {
      id: 'capi-share-rewards',
      exportName: 'fetchMyShareRewards',
      apiModule: 'consumer-adoption',
      coverage: { kind: 'customer-ai', intents: ['explain_rewards_wallet'] },
    },
    {
      id: 'capi-claim-share-reward',
      exportName: 'claimShareReward',
      apiModule: 'consumer-adoption',
      coverage: { kind: 'customer-ai', intents: ['claim_share_reward'] },
    },
    {
      id: 'capi-customer-loyalty',
      exportName: 'getPublicCustomerLoyalty',
      apiModule: 'consumer-adoption',
      coverage: { kind: 'customer-ai', intents: ['explain_rewards_wallet'] },
    },
    {
      id: 'capi-my-rewards',
      exportName: 'fetchMyRewards',
      apiModule: 'consumer-adoption',
      coverage: { kind: 'customer-ai', intents: ['explain_rewards_wallet'] },
    },
    // ai-cmd-customer-6.7 — gift cards
    {
      id: 'capi-gift-card-catalog',
      exportName: 'getPublicGiftCardCatalog',
      apiModule: 'gift-cards',
      coverage: {
        kind: 'customer-ai',
        intents: ['discover_gift_card_products', 'buy_gift_card'],
      },
    },
    {
      id: 'capi-claim-gift-card',
      exportName: 'claimPublicGiftCard',
      apiModule: 'gift-cards',
      coverage: { kind: 'customer-ai', intents: ['claim_gift_card_balance'] },
    },
    {
      id: 'capi-my-gift-cards',
      exportName: 'getPublicCustomerGiftCards',
      apiModule: 'gift-cards',
      coverage: { kind: 'customer-ai', intents: ['my_gift_cards'] },
    },
    {
      id: 'capi-gift-card-cancel-request',
      exportName: 'submitPublicGiftCardCancelRequest',
      apiModule: 'gift-cards',
      coverage: { kind: 'customer-ai', intents: ['request_gift_card_cancel'] },
    },
    {
      id: 'capi-gift-card-modify-request',
      exportName: 'submitPublicGiftCardModifyRequest',
      apiModule: 'gift-cards',
      coverage: { kind: 'customer-ai', intents: ['request_gift_card_modify'] },
    },
    // ai-cmd-customer-6.8 — clinic
    {
      id: 'capi-clinic-test-results',
      exportName: 'getPublicCustomerClinicTestResults',
      aliasOf: 'fetchMyClinicTestResults',
      apiModule: 'clinic-test-results',
      coverage: { kind: 'customer-ai', intents: ['list_my_test_results'] },
    },
    {
      id: 'capi-clinic-lab-booking-requests',
      exportName: 'getPublicCustomerClinicLabBookingRequests',
      aliasOf: 'fetchMyClinicLabBookingRequests',
      apiModule: 'clinic-test-results',
      coverage: {
        kind: 'customer-ai',
        intents: ['list_my_lab_booking_requests'],
      },
    },
    {
      id: 'capi-clinic-documents',
      exportName: 'getPublicCustomerClinicDocuments',
      aliasOf: 'fetchMyClinicDocuments',
      apiModule: 'clinic-test-results',
      coverage: {
        kind: 'customer-ai',
        intents: ['list_my_documents', 'open_clinic_document'],
      },
    },
    {
      id: 'capi-clinic-patient-alerts',
      exportName: 'getPublicCustomerClinicPatientAlerts',
      aliasOf: 'fetchMyClinicPatientAlerts',
      apiModule: 'consumer-adoption',
      coverage: { kind: 'customer-ai', intents: ['explain_patient_alert'] },
    },
    {
      id: 'capi-dismiss-clinic-patient-alert',
      exportName: 'dismissPublicCustomerClinicPatientAlert',
      aliasOf: 'dismissMyClinicPatientAlert',
      apiModule: 'clinic-test-results',
      coverage: { kind: 'customer-ai', intents: ['dismiss_patient_alert'] },
    },
    // ai-cmd-customer-6.9 — reviews & support
    {
      id: 'capi-review-context',
      exportName: 'getPublicReviewContext',
      apiModule: 'reviews',
      coverage: { kind: 'customer-ai', intents: ['submit_review_with_token'] },
    },
    {
      id: 'capi-submit-review-token',
      exportName: 'submitPublicReview',
      apiModule: 'reviews',
      coverage: { kind: 'customer-ai', intents: ['submit_review_with_token'] },
    },
    {
      id: 'capi-submit-my-booking-review',
      exportName: 'submitCustomerReview',
      apiModule: 'public-booking',
      coverage: { kind: 'customer-ai', intents: ['leave_visit_review'] },
    },
    // ai-cmd-customer-6.10 — checkout upsell (dismiss_recommendations is client-only, no REST)
    // ai-cmd-customer-6.11 — push, mobile config, analytics
    {
      id: 'capi-register-push',
      exportName: 'registerConsumerNativePush',
      apiModule: 'consumer-adoption',
      coverage: { kind: 'customer-ai', intents: ['register_customer_push'] },
    },
    {
      id: 'capi-push-delivery-ack',
      exportName: 'ackConsumerPushDelivery',
      apiModule: 'notifications',
      coverage: {
        kind: 'no-ai',
        reason: 'Background push delivery telemetry, no user-facing intent',
      },
    },
    {
      id: 'capi-push-status',
      exportName: 'fetchConsumerNativePushStatus',
      apiModule: 'consumer-adoption',
      coverage: {
        kind: 'customer-ai',
        intents: ['explain_push_registration_status'],
      },
    },
    {
      id: 'capi-mobile-app-config',
      exportName: 'fetchMobileAppConfig',
      apiModule: 'ai-command',
      coverage: {
        kind: 'no-ai',
        reason:
          'App shell version gate consumed before AI is available; proposed explain_app_update_gate not yet shipped (4.13.4)',
      },
    },
    {
      id: 'capi-analytics-events',
      exportName: 'recordAppAnalyticsEvents',
      apiModule: 'notifications',
      coverage: {
        kind: 'no-ai',
        reason: 'Background app analytics events, no user-facing intent',
      },
    },
    {
      id: 'capi-guide-telemetry',
      exportName: 'ingestPublicGuideTelemetryEvents',
      apiModule: 'ai-command',
      coverage: {
        kind: 'no-ai',
        reason: 'Background assistant guide telemetry, no user-facing intent',
      },
    },
    {
      id: 'capi-assistant-gateway',
      exportName: 'sendPublicAssistantMessage',
      apiModule: 'ai-command',
      coverage: {
        kind: 'no-ai',
        reason:
          'The assistant dispatch gateway itself — routes to every other row here, not a mapped intent',
      },
    },
    // Local client-side helpers — not API calls
    {
      id: 'capi-set-token',
      exportName: 'setPublicCustomerToken',
      apiModule: 'public-booking',
      coverage: {
        kind: 'no-ai',
        reason: 'Local token storage helper, not a backend call',
      },
    },
    {
      id: 'capi-prepayment-due',
      exportName: 'prepaymentDue',
      apiModule: 'payments',
      coverage: {
        kind: 'no-ai',
        reason: 'Local prepayment display calculation, not an API call',
      },
    },
    {
      id: 'capi-format-duration',
      exportName: 'formatDuration',
      apiModule: 'public-booking',
      coverage: {
        kind: 'no-ai',
        reason: 'Local formatting helper, not an API call',
      },
    },
    {
      id: 'capi-format-price',
      exportName: 'formatPrice',
      apiModule: 'public-booking',
      coverage: {
        kind: 'no-ai',
        reason: 'Local formatting helper, not an API call',
      },
    },
    // Subscriptions
    {
      id: 'capi-subscription-plans',
      exportName: 'getPublicServiceSubscriptionPlans',
      apiModule: 'service-subscriptions',
      coverage: {
        kind: 'public-ai',
        intents: ['discover_subscription_plans'],
      },
    },
    {
      id: 'capi-customer-subscriptions',
      exportName: 'getPublicCustomerSubscriptions',
      aliasOf: 'fetchMySubscriptions',
      apiModule: 'service-subscriptions',
      coverage: { kind: 'customer-ai', intents: ['my_subscriptions'] },
    },
    {
      id: 'capi-subscription-usage',
      exportName: 'getPublicCustomerSubscriptionUsage',
      aliasOf: 'fetchMySubscriptionUsage',
      apiModule: 'service-subscriptions',
      coverage: { kind: 'customer-ai', intents: ['subscription_usage'] },
    },
    {
      id: 'capi-active-subscription',
      exportName: 'getPublicActiveSubscription',
      apiModule: 'service-subscriptions',
      coverage: {
        kind: 'customer-ai',
        intents: ['my_subscriptions', 'use_subscription_credit'],
      },
    },
  ];
