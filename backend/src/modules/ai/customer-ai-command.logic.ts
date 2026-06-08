import type { CommandResult } from './command-completion.types.js';
import { buildRoleCapabilityListingResult } from './ai-role-capability-listing.util.js';
import type { PlanTierId } from '../billing/plan-limits.js';
import type { AiCustomerCrmService } from './ai-customer-crm.service.js';
import type { AiScheduleResourcesService } from './ai-schedule-resources.service.js';
import type { AiPaymentsService } from './ai-payments.service.js';
import type { AiGiftFulfillmentService } from './ai-gift-fulfillment.service.js';
import type { AiIntegrationsService } from './ai-integrations.service.js';
import type { AiAdopt6GrowthLoopsService } from './ai-adopt-6-growth-loops.service.js';
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
import type { AiReviewsService } from './ai-reviews.service.js';
import type { DecomposedIntentStep } from './intent-decomposition.types.js';
import { mergeSharedBookingStepParams } from './ai-compound-booking-context.util.js';
import { mergeCustomerCompoundContext } from './customer-ai-command.util.js';
import type { CheckProvidersHandoff } from './ai-check-book-handoff.util.js';
import type { ProviderAvailabilityRow } from './ai-provider-availability.util.js';

export interface CustomerAiCommandLogicDeps {
  customerCrm: AiCustomerCrmService;
  scheduleResources: AiScheduleResourcesService;
  payments: AiPaymentsService;
  giftFulfillment: AiGiftFulfillmentService;
  integrations: AiIntegrationsService;
  marketingGrowth: AiMarketingGrowthService;
  adopt6Growth: AiAdopt6GrowthLoopsService;
  pushNotifications: AiPushNotificationsService;
  selfServiceBooking: AiSelfServiceBookingService;
  businessCurrency: AiBusinessCurrencyService;
  businessLanguages: AiBusinessLanguagesService;
  businessDateFormat: AiBusinessDateFormatService;
  businessTax: AiBusinessTaxService;
  businessCompliance: AiBusinessComplianceService;
  tourService: AiTourServiceService;
  recommendationProduct: AiRecommendationProductService;
  consumerClinicTestResults: AiConsumerClinicTestResultsService;
  clinicLabBooking: AiClinicLabBookingService;
  clinicBooking: AiClinicBookingService;
  reviews: AiReviewsService;
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
  date?: string;
  timeOfDay?: string;
  notBeforeTime?: string;
  serviceName?: string;
  allProviders?: boolean;
  bookingFirstAvailable?: boolean;
  timeFrom?: string;
  serviceId?: string;
  employeeId?: string;
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
  prompt?: string;
  planTierId?: PlanTierId;
}

function withCustomerSession(
  params: Record<string, unknown>,
  session: CustomerIntentSession,
): Record<string, any> {
  return {
    ...params,
    sessionCustomerId: session.customerId,
    cartServiceIds: session.cartServiceIds ?? params.cartServiceIds,
    packageId: session.packageId ?? params.packageId,
    packageName: session.packageName ?? params.packageName,
    giftCardCode: session.giftCardCode ?? params.giftCardCode,
    paymentMethod: session.paymentMethod ?? params.paymentMethod,
    useSubscriptionId: session.useSubscriptionId ?? params.useSubscriptionId,
    bookingId: session.bookingId ?? params.bookingId,
    date: session.date ?? params.date,
    timeOfDay: session.timeOfDay ?? params.timeOfDay,
    notBeforeTime: session.notBeforeTime ?? params.notBeforeTime,
    serviceName: session.serviceName ?? params.serviceName,
    allProviders: session.allProviders ?? params.allProviders,
    bookingFirstAvailable:
      session.bookingFirstAvailable ?? params.bookingFirstAvailable,
    timeFrom: session.timeFrom ?? params.timeFrom,
    serviceId: session.serviceId ?? params.serviceId,
    employeeId: session.employeeId ?? params.employeeId,
    lastPush: session.lastPush ?? params.lastPush,
    offlineQueueCount: session.offlineQueueCount ?? params.offlineQueueCount,
    online: session.online ?? params.online,
    _prompt: session.prompt,
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

  switch (action) {
    case 'my_profile':
      return deps.customerCrm.handleMyProfile(businessId, p);
    case 'my_appointments':
      return deps.customerCrm.handleMyAppointments(businessId, p);
    case 'my_subscriptions':
      return deps.customerCrm.handleMySubscriptions(businessId, p);
    case 'subscription_usage':
      return deps.customerCrm.handleSubscriptionUsage(businessId, p);
    case 'my_gift_cards':
      return deps.customerCrm.handleMyGiftCards(businessId, p);
    case 'gift_card_balance':
      return deps.customerCrm.handleGiftCardBalance(businessId, p);
    case 'gift_card_redemption_history':
      return deps.customerCrm.handleGiftCardRedemptionHistory(businessId, p);
    case 'request_gift_card_cancel':
      return deps.customerCrm.handleRequestGiftCardCancel(businessId, p);
    case 'request_gift_card_modify':
      return deps.customerCrm.handleRequestGiftCardModify(businessId, p);
    case 'track_physical_gift_card_order':
      return deps.customerCrm.handleTrackPhysicalGiftCardOrder(businessId, p);
    case 'privacy_export':
      return deps.customerCrm.handlePrivacyExport(businessId, p);
    case 'privacy_delete':
      return deps.customerCrm.handlePrivacyDelete(businessId, p);
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
    case 'check_providers_for_service':
      return deps.payments.handleCheckProvidersForService(
        businessId,
        p,
        prompt,
      );
    case 'book_nearest_slot':
      return deps.payments.handleBookNearestSlot(businessId, p, prompt);
    case 'apply_gift_card_code':
      return deps.payments.handleApplyGiftCardCode(businessId, p, prompt);
    case 'check_gift_card_balance':
      return deps.payments.handleCheckGiftCardBalance(businessId, p, prompt);
    case 'buy_gift_card':
      return deps.payments.handleBuyGiftCard(businessId, p, false);
    case 'buy_gift_card_physical':
      return deps.payments.handleBuyGiftCard(businessId, p, true);
    case 'choose_payment_method':
      return deps.payments.handleChoosePaymentMethod(businessId);
    case 'pay_online':
      return deps.payments.handlePayOnline(businessId);
    case 'pay_cash_at_visit':
      return deps.payments.handlePayCashAtVisit(businessId);
    case 'purchase_subscription_checkout':
      return deps.payments.handlePurchaseSubscriptionCheckout(businessId, p);
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
    case 'explain_consumer_checkout_tax':
      return deps.businessTax.handleExplainConsumerCheckoutTax(
        businessId,
        p,
        prompt,
      );
    case 'explain_checkout_currency':
      return deps.businessCurrency.handleExplainCheckoutCurrency(businessId);
    case 'explain_checkout_tax':
      return deps.businessTax.handleExplainCheckoutTax(businessId);
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
    case 'submit_review':
      return deps.reviews.handleSubmitReview(
        businessId,
        session?.slug,
        p,
      );
    case 'explain_clinic_booking':
      return deps.clinicBooking.handleExplainClinicBooking(
        businessId,
        p,
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
    case 'explain_why_stripe_required':
      return deps.payments.handleExplainWhyStripeRequired(businessId);
    case 'receipt_status':
      return deps.payments.handleReceiptStatus(businessId, p);
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
    case 'list_capabilities':
      return buildRoleCapabilityListingResult({
        surface: 'customer',
        accessTier: 'client',
        planTierId: (session.planTierId as PlanTierId | undefined) ?? 'solo',
      });
    case 'how_to_download_app':
      return deps.marketingGrowth.handleHowToDownloadApp(businessId);
    case 'switch_to_consumer_app':
      return deps.marketingGrowth.handleSwitchToConsumerApp(businessId);
    case 'promo_code_help':
      return deps.marketingGrowth.handlePromoCodeHelp(businessId, p, prompt);
    case 'loyalty_points_balance':
      return deps.marketingGrowth.handleLoyaltyPointsBalance(businessId, p);
    case 'explain_my_notifications':
      return deps.adopt6Growth.handleExplainMyNotifications(businessId, p);
    case 'manage_notification_preferences':
      return deps.adopt6Growth.handleManageNotificationPreferences(
        businessId,
        p,
        prompt,
      );
    case 'refer_a_friend':
      return deps.adopt6Growth.handleReferAFriend(businessId, p);
    case 'rebook_last_appointment':
      return deps.adopt6Growth.handleRebookLastAppointment(businessId, p);
    case 'find_my_saved_salons':
      return deps.adopt6Growth.handleFindMySavedSalons(businessId, p);
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
      );
    case 'select_subscription_plan':
      return deps.selfServiceBooking.handleSelectSubscriptionPlan(
        businessId,
        p,
      );
    case 'use_subscription_credit':
      return deps.selfServiceBooking.handleUseSubscriptionCredit(businessId, p);
    case 'cancel_my_booking':
      return deps.selfServiceBooking.handleCancelMyBooking(businessId, p);
    case 'reschedule_my_booking':
      return deps.selfServiceBooking.handleRescheduleMyBooking(businessId, p);
    case 'cancel_package_visit_self':
      return deps.selfServiceBooking.handleCancelPackageVisitSelf(
        businessId,
        p,
      );
    case 'reschedule_package_visit_self':
      return deps.selfServiceBooking.handleReschedulePackageVisitSelf(
        businessId,
        p,
      );
    case 'list_my_appointments':
      return deps.selfServiceBooking.handleListMyAppointments(businessId, p);
    case 'get_manage_link':
      return deps.selfServiceBooking.handleGetManageLink(businessId, p);
    case 'explain_cancel_policy':
      return deps.selfServiceBooking.handleExplainCancelPolicy(businessId, p);
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
    const result = await dispatchCustomerIntent(
      deps,
      businessId,
      step.action,
      stepParams,
      compoundContext,
    );
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
