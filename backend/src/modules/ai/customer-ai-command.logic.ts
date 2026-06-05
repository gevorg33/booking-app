import type { CommandResult } from './command-completion.types.js';
import type { AiCustomerCrmService } from './ai-customer-crm.service.js';
import type { AiScheduleResourcesService } from './ai-schedule-resources.service.js';
import type { AiPaymentsService } from './ai-payments.service.js';
import type { AiGiftFulfillmentService } from './ai-gift-fulfillment.service.js';
import type { AiIntegrationsService } from './ai-integrations.service.js';
import type { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import type { AiPushNotificationsService } from './ai-push-notifications.service.js';
import type { AiSelfServiceBookingService } from './ai-self-service-booking.service.js';
import type { DecomposedIntentStep } from './intent-decomposition.types.js';
import { mergeCustomerCompoundContext } from './customer-ai-command.util.js';

export interface CustomerAiCommandLogicDeps {
  customerCrm: AiCustomerCrmService;
  scheduleResources: AiScheduleResourcesService;
  payments: AiPaymentsService;
  giftFulfillment: AiGiftFulfillmentService;
  integrations: AiIntegrationsService;
  marketingGrowth: AiMarketingGrowthService;
  pushNotifications: AiPushNotificationsService;
  selfServiceBooking: AiSelfServiceBookingService;
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
  lastPush?: unknown;
  offlineQueueCount?: number;
  online?: boolean;
  userEmail?: string;
  userName?: string;
  prompt?: string;
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
    case 'how_to_download_app':
      return deps.marketingGrowth.handleHowToDownloadApp(businessId);
    case 'switch_to_consumer_app':
      return deps.marketingGrowth.handleSwitchToConsumerApp(businessId);
    case 'promo_code_help':
      return deps.marketingGrowth.handlePromoCodeHelp(businessId, p, prompt);
    case 'loyalty_points_balance':
      return deps.marketingGrowth.handleLoyaltyPointsBalance(businessId, p);
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
    const stepParams = { ...step.params, _prompt: step.segment };
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
    },
  };
}
