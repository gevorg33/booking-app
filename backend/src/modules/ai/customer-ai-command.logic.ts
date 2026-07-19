import type { CommandResult } from './command-completion.types.js';
import type { AiCustomerCrmService } from './ai-customer-crm.service.js';
import type { AiScheduleResourcesService } from './ai-schedule-resources.service.js';
import type { AiPaymentsService } from './ai-payments.service.js';
import type { AiGiftFulfillmentService } from './ai-gift-fulfillment.service.js';
import type { AiIntegrationsService } from './ai-integrations.service.js';
import type { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import type { AiPushNotificationsService } from './ai-push-notifications.service.js';
import type { AiSelfServiceBookingService } from './ai-self-service-booking.service.js';
import type { AiBusinessCurrencyService } from './ai-business-currency.service.js';
import type { AiBusinessLanguagesService } from './ai-business-languages.service.js';
import type { AiBusinessDateFormatService } from './ai-business-date-format.service.js';
import type { AiBusinessTaxService } from './ai-business-tax.service.js';
import type { AiBusinessComplianceService } from './ai-business-compliance.service.js';
import type { AiTourServiceService } from './ai-tour-service.service.js';
import type { AiRecommendationProductService } from './ai-recommendation-product.service.js';
import type { AiConsumerClinicTestResultsService } from './ai-consumer-clinic-test-results.service.js';
import type { AiClinicLabBookingService } from './ai-clinic-lab-booking.service.js';
import type { AiClinicBookingService } from './ai-clinic-booking.service.js';
import type { AiGuestCheckoutFieldsService } from './ai-explain-guest-checkout-fields.service.js';
import type { AiResumePendingPaymentService } from './ai-resume-pending-payment.service.js';
import type { AiDiagnoseStripeCheckoutFailureService } from './ai-diagnose-stripe-checkout-failure.service.js';
import type { AiPayAtVenueFallbackService } from './ai-pay-at-venue-fallback.service.js';
import type { AiResumeBookingDraftService } from './ai-resume-booking-draft.service.js';
import type { AiExplainSlotNoLongerAvailableService } from './ai-explain-slot-no-longer-available.service.js';
import type { AiExplainMultiServicePaymentReturnService } from './ai-explain-multi-service-payment-return.service.js';
import type { AiRetryFailedNetworkActionService } from './ai-retry-failed-network-action.service.js';
import type { AiExplainVoiceInputService } from './ai-explain-voice-input.service.js';
import type { AiSpeakAssistantReplyService } from './ai-speak-assistant-reply.service.js';
import type { AiGiveAiFeedbackService } from './ai-give-ai-feedback.service.js';
import type { AiExplainRtlLayoutService } from './ai-explain-rtl-layout.service.js';
import { mergeExplainRtlLayoutRequestLocale } from './ai-explain-rtl-layout.util.js';
import type { AiConsumerAdoptionService } from './ai-consumer-adoption.service.js';
import type { DecomposedIntentStep } from './intent-decomposition.types.js';
import { mergeSharedBookingStepParams } from './ai-compound-booking-context.util.js';
import {
  mergeCustomerCompoundContext,
  isPublicOnlyAssistantAction,
} from './customer-ai-command.util.js';
import type { CheckProvidersHandoff } from './ai-check-book-handoff.util.js';
import type { ProviderAvailabilityRow } from './ai-provider-availability.util.js';
import type { AiBusinessHoursLocationService } from './ai-explain-business-hours-and-location.service.js';
import { isAiBusinessHoursLocationIntentForSurface } from './ai-business-hours-location-dispatch.util.js';
import { isAiPaymentsServiceIntentForSurface } from './ai-payments-dispatch.util.js';
import type { AiProviderSpecialtyService } from './ai-explain-provider-specialty.service.js';
import { isAiProviderSpecialtyIntentForSurface } from './ai-provider-specialty-dispatch.util.js';

export interface CustomerAiCommandLogicDeps {
  customerCrm: AiCustomerCrmService;
  scheduleResources: AiScheduleResourcesService;
  payments: AiPaymentsService;
  giftFulfillment: AiGiftFulfillmentService;
  integrations: AiIntegrationsService;
  marketingGrowth: AiMarketingGrowthService;
  pushNotifications: AiPushNotificationsService;
  selfServiceBooking: AiSelfServiceBookingService;
  businessCurrency: AiBusinessCurrencyService;
  businessLanguages: AiBusinessLanguagesService;
  businessDateFormat: AiBusinessDateFormatService;
  businessHoursLocation: AiBusinessHoursLocationService;
  providerSpecialty: AiProviderSpecialtyService;
  businessTax: AiBusinessTaxService;
  businessCompliance: AiBusinessComplianceService;
  tourService: AiTourServiceService;
  recommendationProduct: AiRecommendationProductService;
  consumerClinicTestResults: AiConsumerClinicTestResultsService;
  clinicLabBooking: AiClinicLabBookingService;
  clinicBooking: AiClinicBookingService;
  guestCheckoutFields: AiGuestCheckoutFieldsService;
  resumePendingPayment: AiResumePendingPaymentService;
  diagnoseStripeCheckoutFailure: AiDiagnoseStripeCheckoutFailureService;
  payAtVenueFallback: AiPayAtVenueFallbackService;
  resumeBookingDraft: AiResumeBookingDraftService;
  explainSlotNoLongerAvailable: AiExplainSlotNoLongerAvailableService;
  explainMultiServicePaymentReturn: AiExplainMultiServicePaymentReturnService;
  retryFailedNetworkAction: AiRetryFailedNetworkActionService;
  explainVoiceInput: AiExplainVoiceInputService;
  speakAssistantReply: AiSpeakAssistantReplyService;
  giveAiFeedback: AiGiveAiFeedbackService;
  explainRtlLayout: AiExplainRtlLayoutService;
  consumerAdoption: AiConsumerAdoptionService;
  runPublicAssistantStep?: (
    businessId: string,
    action: string,
    params: Record<string, unknown>,
    session: CustomerIntentSession,
  ) => Promise<CommandResult>;
}

export interface CustomerIntentSession {
  customerId?: string;
  slug?: string;
  locale?: string;
  cartServiceIds?: string[];
  packageId?: string;
  packageName?: string;
  giftCardCode?: string;
  paymentMethod?: string;
  useSubscriptionId?: string;
  bookingId?: string;
  manageToken?: string;
  intakeId?: string;
  date?: string;
  timeOfDay?: string;
  notBeforeTime?: string;
  chosenAvailabilityWindow?: { dateKeys: string[]; timeOfDay?: string | null };
  serviceName?: string;
  allProviders?: boolean;
  bookingFirstAvailable?: boolean;
  timeFrom?: string;
  serviceId?: string;
  employeeId?: string;
  maxPrice?: number | string;
  serviceRank?: string;
  availabilityWindows?: unknown[];
  checkProvidersHandoff?: CheckProvidersHandoff;
  availableProviders?: string[];
  availability?: ProviderAvailabilityRow[];
  priorCheckSummary?: string;
  noProviders?: boolean;
  lastPush?: unknown;
  offlineQueueCount?: number;
  online?: boolean;
  userEmail?: string;
  userName?: string;
  pendingCheckoutSessionId?: string;
  pendingCheckoutServiceId?: string;
  pendingCheckoutStartTime?: string;
  pendingCheckoutEmployeeId?: string;
  prompt?: string;
  privacyDeletePending?: boolean;
  cancelAllUpcomingPending?: boolean;
  requiresConfirmation?: boolean;
  pendingAction?: string;
  confirm?: boolean;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function withCustomerSession(
  params: Record<string, unknown>,
  session: CustomerIntentSession,
): Record<string, any> {
  return {
    ...params,
    sessionCustomerId: session.customerId,
    // e2e-bug.125 — forward booking-page slug; handlers also resolve via businessId.
    slug: (typeof params.slug === 'string' && params.slug.trim()
      ? params.slug.trim()
      : undefined) ?? session.slug,
    cartServiceIds: session.cartServiceIds ?? params.cartServiceIds,
    packageId: session.packageId ?? params.packageId,
    packageName: session.packageName ?? params.packageName,
    giftCardCode: session.giftCardCode ?? params.giftCardCode,
    paymentMethod: session.paymentMethod ?? params.paymentMethod,
    useSubscriptionId: session.useSubscriptionId ?? params.useSubscriptionId,
    bookingId: session.bookingId ?? params.bookingId,
    manageToken: session.manageToken ?? params.manageToken,
    intakeId: session.intakeId ?? params.intakeId,
    date: session.date ?? params.date,
    timeOfDay: session.timeOfDay ?? params.timeOfDay,
    notBeforeTime: session.notBeforeTime ?? params.notBeforeTime,
    chosenAvailabilityWindow:
      session.chosenAvailabilityWindow ?? params.chosenAvailabilityWindow,
    serviceName: params.serviceName ?? session.serviceName,
    allProviders: params.allProviders ?? session.allProviders,
    bookingFirstAvailable:
      params.bookingFirstAvailable ?? session.bookingFirstAvailable,
    timeFrom: params.timeFrom ?? session.timeFrom,
    serviceId:
      params.serviceId ?? (params.serviceName ? undefined : session.serviceId),
    employeeId: params.employeeId ?? session.employeeId,
    maxPrice: params.maxPrice ?? session.maxPrice,
    serviceRank:
      params.serviceRank ??
      (params.serviceName ? undefined : session.serviceRank),
    availabilityWindows:
      session.availabilityWindows ?? params.availabilityWindows,
    lastPush: session.lastPush ?? params.lastPush,
    offlineQueueCount: session.offlineQueueCount ?? params.offlineQueueCount,
    online: session.online ?? params.online,
    pendingCheckoutSessionId:
      session.pendingCheckoutSessionId ?? params.pendingCheckoutSessionId,
    pendingCheckoutServiceId:
      session.pendingCheckoutServiceId ?? params.pendingCheckoutServiceId,
    pendingCheckoutStartTime:
      session.pendingCheckoutStartTime ?? params.pendingCheckoutStartTime,
    pendingCheckoutEmployeeId:
      session.pendingCheckoutEmployeeId ?? params.pendingCheckoutEmployeeId,
    _prompt: session.prompt,
    // e2e-bug.84 — carry GDPR erasure preview pending into turn 2.
    privacyDeletePending:
      params.privacyDeletePending ?? session.privacyDeletePending,
    // e2e-bug.78 — carry bulk-cancel preview pending into turn 2.
    cancelAllUpcomingPending:
      params.cancelAllUpcomingPending ?? session.cancelAllUpcomingPending,
    requiresConfirmation:
      params.requiresConfirmation ?? session.requiresConfirmation,
    pendingAction: params.pendingAction ?? session.pendingAction,
    confirm: params.confirm === true ? true : session.confirm === true,
    conversationHistory:
      (Array.isArray(params.conversationHistory)
        ? params.conversationHistory
        : undefined) ?? session.conversationHistory,
  };
}

export async function dispatchCustomerIntent(
  deps: CustomerAiCommandLogicDeps,
  businessId: string,
  action: string,
  params: Record<string, unknown>,
  session: CustomerIntentSession,
): Promise<CommandResult> {
  const p = withCustomerSession(params, session);
  const prompt = session.prompt ?? '';

  if (isAiPaymentsServiceIntentForSurface(action, 'customer')) {
    const paymentsResult = await deps.payments.dispatchIntent({
      businessId,
      action,
      params: p,
      prompt,
    });
    if (paymentsResult) return paymentsResult;
  }

  if (isAiBusinessHoursLocationIntentForSurface(action, 'customer')) {
    if (action === 'get_directions_to_salon') {
      return deps.businessHoursLocation.handleGetDirectionsToSalon(
        businessId,
        p,
        prompt,
      );
    }
    if (action === 'explain_salon_profile') {
      return deps.businessHoursLocation.handleExplainSalonProfile(
        businessId,
        p,
        prompt,
      );
    }
    return deps.businessHoursLocation.handleExplainBusinessHoursAndLocation(
      businessId,
      p,
      prompt,
    );
  }

  if (isAiProviderSpecialtyIntentForSurface(action, 'customer')) {
    if (action === 'explain_any_provider_option') {
      return deps.providerSpecialty.handleExplainAnyProviderOption(
        businessId,
        p,
        prompt,
      );
    }
    if (action === 'pick_provider_for_service') {
      return deps.providerSpecialty.handlePickProviderForService(
        businessId,
        p,
        prompt,
      );
    }
    if (action === 'switch_provider_same_time') {
      return deps.providerSpecialty.handleSwitchProviderSameTime(
        businessId,
        p,
        prompt,
      );
    }
    if (action === 'explain_professional_profile') {
      return deps.providerSpecialty.handleExplainProfessionalProfile(
        businessId,
        p,
        prompt,
      );
    }
    if (action === 'submit_provider_review') {
      return deps.providerSpecialty.handleSubmitProviderReview(businessId, p);
    }
    if (action === 'submit_review_with_token') {
      return deps.providerSpecialty.handleSubmitReviewWithToken(
        businessId,
        p,
      );
    }
    return deps.providerSpecialty.handleExplainProviderSpecialty(
      businessId,
      p,
      prompt,
    );
  }

  switch (action) {
    case 'my_profile':
      return deps.customerCrm.handleMyProfile(businessId, p);
    case 'update_my_profile':
      return deps.customerCrm.handleUpdateMyProfile(businessId, p, prompt);
    case 'get_my_locale':
      return deps.customerCrm.handleGetMyLocale(businessId, p);
    case 'update_my_locale':
      return deps.customerCrm.handleUpdateMyLocale(businessId, p, prompt);
    case 'my_appointments':
      return deps.customerCrm.handleMyAppointments(businessId, p);
    case 'my_subscriptions':
      return deps.customerCrm.handleMySubscriptions(businessId, p);
    case 'explain_my_subscription':
      return deps.customerCrm.handleExplainMySubscription(
        businessId,
        p,
        prompt,
      );
    case 'subscription_usage':
      return deps.customerCrm.handleSubscriptionUsage(businessId, p);
    case 'my_gift_cards':
      return deps.customerCrm.handleMyGiftCards(businessId, p);
    case 'gift_card_balance':
      return deps.customerCrm.handleGiftCardBalance(businessId, p);
    case 'claim_gift_card_balance':
      return deps.customerCrm.handleClaimGiftCardBalance(
        businessId,
        {
          ...p,
          sessionCustomerId:
            (p.sessionCustomerId as string | undefined) ?? session.customerId,
        },
        prompt,
      );
    case 'gift_card_redemption_history':
      return deps.customerCrm.handleGiftCardRedemptionHistory(businessId, p);
    case 'request_gift_card_cancel':
      return deps.customerCrm.handleRequestGiftCardCancel(businessId, p);
    case 'request_gift_card_modify':
      return deps.customerCrm.handleRequestGiftCardModify(businessId, p);
    case 'track_physical_gift_card_order':
      return deps.customerCrm.handleTrackPhysicalGiftCardOrder(businessId, p);
    case 'explain_gift_card_order':
      return deps.customerCrm.handleExplainGiftCardOrder(businessId, p);
    case 'privacy_export':
      return deps.customerCrm.handlePrivacyExport(businessId, p, prompt);
    case 'privacy_delete':
      return deps.customerCrm.handlePrivacyDelete(businessId, p, prompt);
    case 'discover_packages':
      return deps.customerCrm.handleDiscoverPackages(businessId);
    case 'discover_subscription_plans':
      return deps.customerCrm.handleDiscoverSubscriptionPlans(businessId, p);
    case 'discover_gift_card_products':
      return deps.customerCrm.handleDiscoverGiftCardProducts(businessId);
    case 'check_multi_service_block_availability':
      return deps.scheduleResources.handleCheckMultiServiceBlockAvailability(
        businessId,
        p,
      );
    case 'check_package_line_availability':
      return deps.scheduleResources.handleCheckPackageLineAvailability(
        businessId,
        p,
      );
    case 'earliest_slot_all_services':
      return deps.scheduleResources.handleEarliestSlotAllServices(
        businessId,
        p,
      );
    case 'providers_available_later_days':
      return deps.scheduleResources.handleProvidersAvailableLaterDays(
        businessId,
        p,
      );
    case 'explain_why_no_slots':
      return deps.scheduleResources.handleExplainWhyNoSlots(businessId, p);
    case 'explain_booking_languages':
      return deps.businessLanguages.handleExplainBookingLanguages(
        businessId,
        session.locale,
      );
    case 'explain_booking_date_format':
      return deps.businessDateFormat.handleExplainBookingDateFormat(businessId);
    case 'explain_tour_booking':
      return deps.tourService.handleExplainTourBooking(businessId, p, prompt);
    case 'explain_tour_day_slots':
      return deps.tourService.handleExplainTourDaySlots(businessId, p, prompt);
    case 'diagnose_tour_capacity':
      return deps.tourService.handleDiagnoseTourCapacity(businessId, p, prompt);
    case 'explain_tour_booking_record':
      return deps.tourService.handleExplainTourBookingRecord(
        businessId,
        p,
        prompt,
      );
    case 'explain_tour_meeting_point':
      return deps.tourService.handleExplainTourMeetingPoint(
        businessId,
        p,
        prompt,
      );
    case 'explain_checkout_recommendations':
      return deps.recommendationProduct.handleExplainCheckoutRecommendations(
        businessId,
        p,
        prompt,
      );
    case 'explain_consumer_checkout_success':
      return deps.recommendationProduct.handleExplainConsumerCheckoutSuccess(
        businessId,
        p,
        prompt,
      );
    case 'dismiss_recommendations':
      return deps.recommendationProduct.handleDismissRecommendations(
        businessId,
        p,
        prompt,
      );
    case 'explain_my_notifications':
    case 'manage_notification_preferences':
    case 'enable_push_notifications':
    case 'explain_push_permission':
    case 'register_customer_push':
    case 'explain_push_registration_status':
    case 'explain_offline_mode':
    case 'explain_app_update_required':
    case 'explain_analytics_consent':
    case 'explain_home_screen_widget':
    case 'explain_patient_alert':
    case 'explain_share_reward':
    case 'refer_a_friend':
    case 'claim_referral_code':
    case 'share_salon_link':
    case 'share_my_booking':
    case 'claim_share_reward':
    case 'explain_rewards_wallet':
    case 'rebook_last_appointment':
    case 'find_my_saved_salons':
    case 'switch_salon_tenant':
      return (
        (await deps.consumerAdoption.handleIntent(
          businessId,
          action,
          p,
          prompt,
        )) ?? {
          success: false,
          action,
          summary: `Customer assistant does not support "${action}" yet. Try rephrasing.`,
          details: { clarify: true },
        }
      );
    case 'explain_consumer_checkout_tax':
      return deps.businessTax.handleExplainConsumerCheckoutTax(
        businessId,
        p,
        prompt,
      );
    case 'explain_checkout_currency':
      return deps.businessCurrency.handleExplainCheckoutCurrency(businessId);
    case 'explain_checkout_tax':
      return deps.businessTax.handleExplainCheckoutTax(businessId, p, prompt);
    case 'explain_data_rights':
      return deps.businessCompliance.handleExplainDataRights(
        businessId,
        p,
        prompt,
      );
    case 'list_my_test_results':
      return deps.consumerClinicTestResults.handleListMyTestResults(
        businessId,
        p,
        prompt,
      );
    case 'explain_result_status':
      return deps.consumerClinicTestResults.handleExplainResultStatus(
        businessId,
        p,
        prompt,
      );
    case 'track_lab_order_status':
      return deps.consumerClinicTestResults.handleTrackLabOrderStatus(
        businessId,
        p,
        prompt,
      );
    case 'list_my_documents':
      return deps.consumerClinicTestResults.handleListMyDocuments(
        businessId,
        p,
        prompt,
      );
    case 'open_clinic_document':
      return deps.consumerClinicTestResults.handleOpenClinicDocument(
        businessId,
        p,
      );
    case 'dismiss_patient_alert':
      return deps.consumerClinicTestResults.handleDismissPatientAlert(
        businessId,
        p,
      );
    case 'explain_abnormal_result_flag':
      return deps.consumerClinicTestResults.handleExplainAbnormalResultFlag(
        businessId,
        p,
        prompt,
      );
    case 'notify_when_results_ready':
      return deps.consumerClinicTestResults.handleNotifyWhenResultsReady(
        businessId,
        p,
        prompt,
      );
    case 'list_my_lab_booking_requests':
      return deps.clinicLabBooking.handleListMyLabBookingRequests(
        businessId,
        p,
        prompt,
      );
    case 'book_lab_collection':
      return deps.clinicLabBooking.handleBookLabCollection(
        businessId,
        p,
        prompt,
      );
    case 'book_lab_from_order':
      return deps.clinicLabBooking.handleBookLabFromOrder(
        businessId,
        p,
        prompt,
      );
    case 'explain_clinic_booking':
      return deps.clinicBooking.handleExplainClinicBooking(
        businessId,
        p,
        prompt,
      );
    case 'explain_lab_prep':
      return deps.clinicBooking.handleExplainLabPrep(businessId, p, prompt);
    case 'explain_clinic_booking_fields':
      return deps.clinicBooking.handleExplainClinicBookingFields(
        businessId,
        p,
        prompt,
      );
    case 'explain_public_intake_form':
      return deps.clinicBooking.handleExplainPublicIntakeForm(
        businessId,
        p,
        prompt,
      );
    case 'complete_intake_and_book':
      return deps.clinicBooking.handleCompleteIntakeAndBook(
        businessId,
        p,
        prompt,
      );
    case 'create_intake_draft':
      return deps.clinicBooking.handleCreateIntakeDraft(businessId, p);
    case 'get_intake_flow_status':
      return deps.clinicBooking.handleGetIntakeFlowStatus(businessId, p);
    case 'start_pre_visit_intake':
      return deps.clinicBooking.handleStartPreVisitIntake(businessId, p);
    case 'submit_intake_answers':
      return deps.clinicBooking.handleSubmitIntakeAnswers(businessId, p);
    case 'explain_guest_checkout_fields':
      return deps.guestCheckoutFields.handleExplainGuestCheckoutFields(
        businessId,
        p,
        prompt,
      );
    case 'explain_why_sign_in':
      return deps.guestCheckoutFields.handleExplainWhySignIn(
        businessId,
        p,
        prompt,
      );
    case 'sign_in_with_google':
    case 'sign_in_with_apple':
    case 'sign_in_with_phone':
      return deps.guestCheckoutFields.handleSignInWithProvider(
        action as 'sign_in_with_google' | 'sign_in_with_apple' | 'sign_in_with_phone',
        businessId,
        p,
      );
    case 'fix_checkout_validation_error':
      return deps.guestCheckoutFields.handleFixCheckoutValidationError(
        businessId,
        p,
        prompt,
      );
    case 'resume_pending_payment':
      return deps.resumePendingPayment.handleResumePendingPayment(
        businessId,
        p,
        prompt,
      );
    case 'diagnose_stripe_checkout_failure':
      return deps.diagnoseStripeCheckoutFailure.handleDiagnoseStripeCheckoutFailure(
        businessId,
        p,
        prompt,
      );
    case 'pay_at_venue_fallback':
      return deps.payAtVenueFallback.handlePayAtVenueFallback(
        businessId,
        p,
        prompt,
      );
    case 'resume_booking_draft':
      return deps.resumeBookingDraft.handleResumeBookingDraft(
        businessId,
        p,
        prompt,
      );
    case 'explain_slot_no_longer_available':
      return deps.explainSlotNoLongerAvailable.handleExplainSlotNoLongerAvailable(
        businessId,
        p,
        prompt,
        deps.runPublicAssistantStep
          ? async (availParams) =>
              deps.runPublicAssistantStep!(
                businessId,
                'check_availability',
                availParams,
                session,
              )
          : undefined,
      );
    case 'explain_multi_service_payment_return':
      return deps.explainMultiServicePaymentReturn.handleExplainMultiServicePaymentReturn(
        businessId,
        p,
        prompt,
      );
    case 'retry_failed_network_action':
      return deps.retryFailedNetworkAction.handleRetryFailedNetworkAction(
        businessId,
        p,
        prompt,
      );
    case 'explain_voice_input':
      return deps.explainVoiceInput.handleExplainVoiceInput(
        businessId,
        p,
        prompt,
      );
    case 'speak_assistant_reply':
      return deps.speakAssistantReply.handleSpeakAssistantReply(
        businessId,
        p,
        prompt,
      );
    case 'give_ai_feedback':
      return deps.giveAiFeedback.handleGiveAiFeedback(businessId, p, prompt);
    case 'explain_rtl_layout':
      // e2e-bug.85 — locale is request/session context, not a classifier entity.
      return deps.explainRtlLayout.handleExplainRtlLayout(
        businessId,
        mergeExplainRtlLayoutRequestLocale(p, session.locale),
        prompt,
      );
    case 'explain_stripe_checkout_currency':
      return deps.businessCurrency.handleExplainStripeCheckoutCurrency(
        businessId,
      );
    case 'explain_tenant_currency':
      return deps.businessCurrency.handleExplainTenantCurrency(businessId);
    case 'explain_notification_currency':
      return deps.businessCurrency.handleExplainNotificationCurrency(
        businessId,
      );
    case 'enter_shipping_address':
      return deps.giftFulfillment.handleEnterShippingAddress(businessId, p);
    case 'order_status_notifications':
      return deps.giftFulfillment.handleOrderStatusNotifications(businessId, p);
    case 'contact_support':
      return deps.integrations.handleContactSupport(
        businessId,
        p,
        prompt,
        session.userEmail,
        session.userName,
      );
    case 'open_ticket_for_order':
      return deps.integrations.handleOpenTicketForOrder(
        businessId,
        p,
        prompt,
        session.userEmail,
        session.userName,
      );
    case 'how_to_download_app':
      return deps.marketingGrowth.handleHowToDownloadApp(businessId);
    case 'switch_to_consumer_app':
      return deps.marketingGrowth.handleSwitchToConsumerApp(businessId);
    case 'promo_code_help':
      return deps.marketingGrowth.handlePromoCodeHelp(businessId, p, prompt);
    case 'apply_promo_code_checkout':
      return deps.marketingGrowth.handleApplyPromoCodeCheckout(
        businessId,
        p,
        prompt,
      );
    case 'apply_loyalty_at_checkout':
      return deps.marketingGrowth.handleApplyLoyaltyAtCheckout(
        businessId,
        {
          ...p,
          sessionCustomerId:
            (p.sessionCustomerId as string | undefined) ?? session.customerId,
        },
        prompt,
      );
    case 'loyalty_points_balance':
      return deps.marketingGrowth.handleLoyaltyPointsBalance(businessId, p);
    case 'explain_loyalty_points':
      return deps.marketingGrowth.handleExplainLoyaltyPoints(
        businessId,
        p,
        prompt,
      );
    case 'explain_last_push':
      return deps.pushNotifications.handleExplainLastPush(p);
    case 'open_booking_from_push':
      return deps.pushNotifications.handleOpenBookingFromPush(
        businessId,
        p,
        prompt,
      );
    case 'offline_queue_status':
      return deps.pushNotifications.handleOfflineQueueStatus(p);
    case 'retry_offline_action':
      return deps.pushNotifications.handleRetryOfflineAction(p);
    case 'dismiss_push':
      return deps.pushNotifications.handleDismissPush(p);
    case 'enable_notifications':
      return deps.pushNotifications.handleEnableNotifications(
        businessId,
        p,
        prompt,
      );
    case 'appointment_reminder_preferences':
      return deps.pushNotifications.handleAppointmentReminderPreferences(
        businessId,
        p,
        prompt,
      );
    case 'book_package':
      return deps.selfServiceBooking.handleBookPackage(businessId, p);
    case 'book_multi_service':
      return deps.selfServiceBooking.handleBookMultiService(businessId, p);
    case 'check_package_availability':
      return deps.selfServiceBooking.handleCheckPackageAvailability(
        businessId,
        p,
      );
    case 'check_multi_service_availability':
      return deps.selfServiceBooking.handleCheckMultiServiceAvailability(
        businessId,
        p,
        prompt,
      );
    case 'select_subscription_plan':
      return deps.selfServiceBooking.handleSelectSubscriptionPlan(
        businessId,
        p,
      );
    case 'use_subscription_credit':
      return deps.selfServiceBooking.handleUseSubscriptionCredit(businessId, p);
    case 'cancel_my_subscription':
      return deps.selfServiceBooking.handleCancelMySubscription(
        businessId,
        p,
      );
    case 'cancel_my_booking':
      return deps.selfServiceBooking.handleCancelMyBooking(
        businessId,
        p,
        prompt,
      );
    case 'cancel_all_upcoming_bookings':
      return deps.selfServiceBooking.handleCancelAllUpcomingBookings(
        businessId,
        p,
        prompt,
      );
    case 'reschedule_my_booking':
      return deps.selfServiceBooking.handleRescheduleMyBooking(
        businessId,
        p,
        prompt,
      );
    case 'cancel_package_visit_self':
      return deps.selfServiceBooking.handleCancelPackageVisitSelf(
        businessId,
        p,
        prompt,
      );
    case 'reschedule_package_visit_self':
      return deps.selfServiceBooking.handleReschedulePackageVisitSelf(
        businessId,
        p,
        prompt,
      );
    case 'reschedule_package_lines':
      return deps.selfServiceBooking.handleReschedulePackageLines(
        businessId,
        p,
        prompt,
      );
    case 'list_my_appointments':
      return deps.selfServiceBooking.handleListMyAppointments(businessId, p);
    case 'list_my_upcoming_appointments':
      return deps.selfServiceBooking.handleListMyUpcomingAppointments(
        businessId,
        p,
        prompt,
      );
    case 'confirm_my_booking_details':
      return deps.selfServiceBooking.handleConfirmMyBookingDetails(
        businessId,
        p,
        prompt,
      );
    case 'add_booking_to_calendar':
      return deps.selfServiceBooking.handleAddBookingToCalendar(
        businessId,
        p,
        prompt,
      );
    case 'explain_preparation_notes':
      return deps.selfServiceBooking.handleExplainPreparationNotes(
        businessId,
        p,
        prompt,
      );
    case 'book_another_service':
      return deps.selfServiceBooking.handleBookAnotherService(
        businessId,
        p,
        prompt,
      );
    case 'list_my_package_visits':
      return deps.selfServiceBooking.handleListMyPackageVisits(
        businessId,
        p,
        prompt,
      );
    case 'get_manage_link':
      return deps.selfServiceBooking.handleGetManageLink(businessId, p, prompt);
    case 'cancel_booking_with_token':
      return deps.selfServiceBooking.handleCancelBookingWithToken(
        businessId,
        p,
        prompt,
      );
    case 'reschedule_booking_with_token':
      return deps.selfServiceBooking.handleRescheduleBookingWithToken(
        businessId,
        p,
        prompt,
      );
    case 'cancel_package_visit_with_token':
      return deps.selfServiceBooking.handleCancelPackageVisitWithToken(
        businessId,
        p,
        prompt,
      );
    case 'reschedule_package_visit_with_token':
      return deps.selfServiceBooking.handleReschedulePackageVisitWithToken(
        businessId,
        p,
        prompt,
      );
    case 'recover_lost_manage_link':
      return deps.selfServiceBooking.handleRecoverLostManageLink(
        businessId,
        p,
        prompt,
      );
    case 'sign_in_to_manage_booking':
      return deps.selfServiceBooking.handleSignInToManageBooking(
        businessId,
        p,
        prompt,
      );
    case 'explain_manage_booking_page':
      return deps.selfServiceBooking.handleExplainManageBookingPage(
        businessId,
        {
          ...p,
          sessionCustomerId:
            (p.sessionCustomerId as string | undefined) ?? session.customerId,
        },
        prompt,
      );
    case 'explain_manage_booking_context':
      return deps.selfServiceBooking.handleExplainManageBookingContext(
        businessId,
        p,
        prompt,
      );
    case 'notify_running_late':
      return deps.selfServiceBooking.handleNotifyRunningLate(
        businessId,
        p,
        prompt,
      );
    case 'leave_visit_review':
      return deps.selfServiceBooking.handleLeaveVisitReview(
        businessId,
        p,
        prompt,
      );
    case 'join_waitlist':
      return deps.selfServiceBooking.handleJoinWaitlist(businessId, p, prompt);
    case 'check_waitlist_status':
      return deps.selfServiceBooking.handleCheckWaitlistStatus(
        businessId,
        p,
        prompt,
      );
    case 'explain_cancel_policy':
      return deps.selfServiceBooking.handleExplainCancelPolicy(
        businessId,
        p,
        prompt,
      );
    case 'explain_deposit_forfeiture':
      return deps.selfServiceBooking.handleExplainDepositForfeiture(
        businessId,
        p,
        prompt,
      );
    case 'explain_package_visit_rules':
      return deps.selfServiceBooking.handleExplainPackageVisitRules(
        businessId,
        p,
        prompt,
      );
    case 'explain_post_visit_review_prompt':
      return deps.selfServiceBooking.handleExplainPostVisitReviewPrompt(
        businessId,
        p,
        prompt,
      );
    case 'report_booking_problem':
      return deps.selfServiceBooking.handleReportBookingProblem(
        businessId,
        p,
        prompt,
      );
    case 'sign_in_after_booking':
      return deps.selfServiceBooking.handleSignInAfterBooking(
        businessId,
        p,
        prompt,
      );
    case 'book_with_cash':
      return deps.selfServiceBooking.handleBookWithCash(businessId, p);
    case 'book_with_gift_card':
      return deps.selfServiceBooking.handleBookWithGiftCard(businessId, p);
    case 'change_provider_on_reschedule':
      return deps.selfServiceBooking.handleChangeProviderOnReschedule(
        businessId,
        p,
      );
    case 'add_services_to_cart':
      return deps.selfServiceBooking.handleAddServicesToCart(businessId, p);
    case 'remove_service_from_cart':
      return deps.selfServiceBooking.handleRemoveServiceFromCart(businessId, p);
    case 'show_cart_total_duration':
      return deps.selfServiceBooking.handleShowCartTotalDuration(businessId, p);
    case 'explain_multi_service_cart':
      return deps.selfServiceBooking.handleExplainMultiServiceCart(
        businessId,
        p,
        prompt,
      );
    case 'explain_package_savings':
      return deps.selfServiceBooking.handleExplainPackageSavings(
        businessId,
        p,
        prompt,
      );
    case 'explain_subscription_vs_one_time':
      return deps.selfServiceBooking.handleExplainSubscriptionVsOneTime(
        businessId,
        p,
        prompt,
      );
    default:
      return {
        success: false,
        action: 'unknown',
        summary: `Customer assistant does not support "${action}" yet. Try rephrasing.`,
        details: { clarify: true },
      };
  }
}

export async function executeCustomerCompoundFromSteps(
  deps: CustomerAiCommandLogicDeps,
  businessId: string,
  prompt: string,
  steps: DecomposedIntentStep[],
  session: CustomerIntentSession,
): Promise<CommandResult> {
  if (steps.length < 2) {
    return {
      success: false,
      action: 'compound_intent',
      summary:
        'Could not split this into multiple customer commands. Try separating with "and" or semicolons.',
      details: { clarify: true },
    };
  }

  const results: CommandResult[] = [];
  let compoundContext: CustomerIntentSession = { ...session, prompt };

  for (const step of steps.slice(0, 4)) {
    const stepParams = {
      ...mergeSharedBookingStepParams(
        compoundContext as Record<string, unknown>,
        step.params,
      ),
      _prompt: step.segment,
    };
    let result: CommandResult;
    if (isPublicOnlyAssistantAction(step.action)) {
      if (!deps.runPublicAssistantStep) {
        return {
          success: false,
          action: 'compound_intent',
          summary: `Customer compound cannot run public step "${step.action}" without booking page context (slug).`,
          details: { clarify: true, failedStep: step.action },
        };
      }
      result = await deps.runPublicAssistantStep(
        businessId,
        step.action,
        stepParams,
        compoundContext,
      );
    } else {
      result = await dispatchCustomerIntent(
        deps,
        businessId,
        step.action,
        stepParams,
        compoundContext,
      );
    }
    results.push(result);
    if (!result.success) {
      return {
        success: false,
        action: 'compound_intent',
        summary: `Stopped at step ${results.length} (${step.action}): ${result.summary}`,
        details: {
          steps: results.map((entry) => entry.action),
          failedStep: step.action,
          customerCompound: true,
          decomposed: true,
        },
      };
    }
    compoundContext = mergeCustomerCompoundContext(
      { ...compoundContext },
      result,
    );
    compoundContext.prompt = prompt;
  }

  const providerStep = [...results]
    .reverse()
    .find((entry) => entry.action === 'check_providers_for_service');
  const providerDetails = providerStep?.details as
    | Record<string, unknown>
    | undefined;
  const bookStep = [...results]
    .reverse()
    .find((entry) => entry.action === 'book_nearest_slot');
  const bookDetails = bookStep?.details as Record<string, unknown> | undefined;

  return {
    success: true,
    action: 'compound_intent',
    summary: `Completed ${results.length} customer step(s): ${results.map((entry) => entry.action.replace(/_/g, ' ')).join(', ')}.`,
    details: {
      steps: results.map((entry) => ({
        action: entry.action,
        summary: entry.summary,
      })),
      customerCompound: true,
      decomposed: true,
      finalContext: compoundContext,
      availableProviders: providerDetails?.availableProviders,
      availability: providerDetails?.availability,
      serviceName: providerDetails?.serviceName,
      date: providerDetails?.date,
      checkProvidersHandoff:
        bookDetails?.checkProvidersHandoff ??
        compoundContext.checkProvidersHandoff,
    },
  };
}
