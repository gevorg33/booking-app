import {
  dispatchCustomerIntent,
  executeCustomerCompoundFromSteps,
  type CustomerAiCommandLogicDeps,
} from './customer-ai-command.logic.js';

type HandlerCall = jest.Mock;

function handler(action: string): HandlerCall {
  return jest.fn(async () => ({
    success: true,
    action,
    summary: 'ok',
    details: { packageId: 'pkg-1', bookingId: 'bk-1' },
  }));
}

function buildDeps(): CustomerAiCommandLogicDeps & {
  calls: Record<string, HandlerCall>;
} {
  const calls: Record<string, HandlerCall> = {};
  const register = (name: string, action: string) => {
    calls[name] = handler(action);
    return calls[name];
  };

  return {
    calls,
    customerCrm: {
      handleMyProfile: register('s28.my_profile', 'my_profile'),
      handleUpdateMyProfile: register(
        's28.update_my_profile',
        'update_my_profile',
      ),
      handleMyAppointments: register('s28.my_appointments', 'my_appointments'),
      handleMySubscriptions: register(
        's28.my_subscriptions',
        'my_subscriptions',
      ),
      handleSubscriptionUsage: register(
        's28.subscription_usage',
        'subscription_usage',
      ),
      handleMyGiftCards: register('s28.my_gift_cards', 'my_gift_cards'),
      handleGiftCardBalance: register(
        's28.gift_card_balance',
        'gift_card_balance',
      ),
      handleGiftCardRedemptionHistory: register(
        's28.gift_card_redemption_history',
        'gift_card_redemption_history',
      ),
      handleRequestGiftCardCancel: register(
        's28.request_gift_card_cancel',
        'request_gift_card_cancel',
      ),
      handleRequestGiftCardModify: register(
        's28.request_gift_card_modify',
        'request_gift_card_modify',
      ),
      handleTrackPhysicalGiftCardOrder: register(
        's28.track_physical_gift_card_order',
        'track_physical_gift_card_order',
      ),
      handlePrivacyExport: register('s28.privacy_export', 'privacy_export'),
      handlePrivacyDelete: register('s28.privacy_delete', 'privacy_delete'),
      handleDiscoverPackages: register(
        's28.discover_packages',
        'discover_packages',
      ),
      handleDiscoverSubscriptionPlans: register(
        's28.discover_subscription_plans',
        'discover_subscription_plans',
      ),
      handleDiscoverGiftCardProducts: register(
        's28.discover_gift_card_products',
        'discover_gift_card_products',
      ),
    } as any,
    scheduleResources: {
      handleCheckMultiServiceBlockAvailability: register(
        's29.check_multi_service_block_availability',
        'check_multi_service_block_availability',
      ),
      handleCheckPackageLineAvailability: register(
        's29.check_package_line_availability',
        'check_package_line_availability',
      ),
      handleEarliestSlotAllServices: register(
        's29.earliest_slot_all_services',
        'earliest_slot_all_services',
      ),
      handleProvidersAvailableLaterDays: register(
        's29.providers_available_later_days',
        'providers_available_later_days',
      ),
      handleExplainWhyNoSlots: register(
        's29.explain_why_no_slots',
        'explain_why_no_slots',
      ),
    } as any,
    payments: (() => {
      const payments = {
        handleCheckProvidersForService: register(
          's30.check_providers_for_service',
          'check_providers_for_service',
        ),
        handleBookNearestSlot: register(
          's30.book_nearest_slot',
          'book_nearest_slot',
        ),
        handleApplyGiftCardCode: register(
          's30.apply_gift_card_code',
          'apply_gift_card_code',
        ),
        handleCheckGiftCardBalance: register(
          's30.check_gift_card_balance',
          'check_gift_card_balance',
        ),
        handleBuyGiftCard: register('s30.buy_gift_card', 'buy_gift_card'),
        handleChoosePaymentMethod: register(
          's30.choose_payment_method',
          'choose_payment_method',
        ),
        handlePayOnline: register('s30.pay_online', 'pay_online'),
        handlePayCashAtVisit: register(
          's30.pay_cash_at_visit',
          'pay_cash_at_visit',
        ),
        handlePurchaseSubscriptionCheckout: register(
          's30.purchase_subscription_checkout',
          'purchase_subscription_checkout',
        ),
        handleExplainWhyStripeRequired: register(
          's30.explain_why_stripe_required',
          'explain_why_stripe_required',
        ),
        handleReceiptStatus: register('s30.receipt_status', 'receipt_status'),
      } as any;
      payments.dispatchIntent = jest.fn(
        async (ctx: {
          businessId: string;
          action: string;
          params: Record<string, unknown>;
          prompt?: string;
        }) => {
          const prompt = ctx.prompt ?? '';
          const withPrompt = { ...ctx.params, _prompt: prompt };
          switch (ctx.action) {
            case 'check_providers_for_service':
              return payments.handleCheckProvidersForService(
                ctx.businessId,
                ctx.params,
                prompt,
              );
            case 'book_nearest_slot':
              return payments.handleBookNearestSlot(
                ctx.businessId,
                ctx.params,
                prompt,
              );
            case 'apply_gift_card_code':
              return payments.handleApplyGiftCardCode(
                ctx.businessId,
                ctx.params,
                prompt,
              );
            case 'check_gift_card_balance':
              return payments.handleCheckGiftCardBalance(
                ctx.businessId,
                ctx.params,
                prompt,
              );
            case 'buy_gift_card':
              return payments.handleBuyGiftCard(
                ctx.businessId,
                ctx.params,
                false,
              );
            case 'buy_gift_card_physical':
              return payments.handleBuyGiftCard(
                ctx.businessId,
                ctx.params,
                true,
              );
            case 'choose_payment_method':
              return payments.handleChoosePaymentMethod(
                ctx.businessId,
                withPrompt,
                prompt,
              );
            case 'pay_online':
              return payments.handlePayOnline(
                ctx.businessId,
                withPrompt,
                prompt,
              );
            case 'pay_cash_at_visit':
              return payments.handlePayCashAtVisit(
                ctx.businessId,
                withPrompt,
                prompt,
              );
            case 'purchase_subscription_checkout':
              return payments.handlePurchaseSubscriptionCheckout(
                ctx.businessId,
                ctx.params,
              );
            case 'explain_why_stripe_required':
              return payments.handleExplainWhyStripeRequired(
                ctx.businessId,
                withPrompt,
                prompt,
              );
            case 'receipt_status':
              return payments.handleReceiptStatus(ctx.businessId, ctx.params);
            default:
              return null;
          }
        },
      );
      return payments;
    })(),
    giftFulfillment: {
      handleEnterShippingAddress: register(
        's31.enter_shipping_address',
        'enter_shipping_address',
      ),
      handleOrderStatusNotifications: register(
        's31.order_status_notifications',
        'order_status_notifications',
      ),
    } as any,
    integrations: {
      handleContactSupport: register('s32.contact_support', 'contact_support'),
      handleOpenTicketForOrder: register(
        's32.open_ticket_for_order',
        'open_ticket_for_order',
      ),
    } as any,
    marketingGrowth: {
      handleHowToDownloadApp: register(
        's34.how_to_download_app',
        'how_to_download_app',
      ),
      handleSwitchToConsumerApp: register(
        's34.switch_to_consumer_app',
        'switch_to_consumer_app',
      ),
      handlePromoCodeHelp: register('s34.promo_code_help', 'promo_code_help'),
      handleLoyaltyPointsBalance: register(
        's34.loyalty_points_balance',
        'loyalty_points_balance',
      ),
      handleExplainLoyaltyPoints: register(
        's34.explain_loyalty_points',
        'explain_loyalty_points',
      ),
    } as any,
    pushNotifications: {
      handleExplainLastPush: register(
        's35.explain_last_push',
        'explain_last_push',
      ),
      handleOpenBookingFromPush: register(
        's35.open_booking_from_push',
        'open_booking_from_push',
      ),
      handleOfflineQueueStatus: register(
        's35.offline_queue_status',
        'offline_queue_status',
      ),
      handleRetryOfflineAction: register(
        's35.retry_offline_action',
        'retry_offline_action',
      ),
      handleDismissPush: register('s35.dismiss_push', 'dismiss_push'),
      handleEnableNotifications: register(
        's35.enable_notifications',
        'enable_notifications',
      ),
      handleAppointmentReminderPreferences: register(
        's35.appointment_reminder_preferences',
        'appointment_reminder_preferences',
      ),
    } as any,
    selfServiceBooking: {
      handleBookPackage: register('s36.book_package', 'book_package'),
      handleBookMultiService: register(
        's36.book_multi_service',
        'book_multi_service',
      ),
      handleCheckPackageAvailability: register(
        's36.check_package_availability',
        'check_package_availability',
      ),
      handleCheckMultiServiceAvailability: register(
        's36.check_multi_service_availability',
        'check_multi_service_availability',
      ),
      handleSelectSubscriptionPlan: register(
        's36.select_subscription_plan',
        'select_subscription_plan',
      ),
      handleUseSubscriptionCredit: register(
        's36.use_subscription_credit',
        'use_subscription_credit',
      ),
      handleCancelMyBooking: register(
        's36.cancel_my_booking',
        'cancel_my_booking',
      ),
      handleRescheduleMyBooking: register(
        's36.reschedule_my_booking',
        'reschedule_my_booking',
      ),
      handleCancelPackageVisitSelf: register(
        's36.cancel_package_visit_self',
        'cancel_package_visit_self',
      ),
      handleReschedulePackageVisitSelf: register(
        's36.reschedule_package_visit_self',
        'reschedule_package_visit_self',
      ),
      handleListMyAppointments: register(
        's36.list_my_appointments',
        'list_my_appointments',
      ),
      handleListMyPackageVisits: register(
        's36.list_my_package_visits',
        'list_my_package_visits',
      ),
      handleGetManageLink: register('s36.get_manage_link', 'get_manage_link'),
      handleExplainCancelPolicy: register(
        's36.explain_cancel_policy',
        'explain_cancel_policy',
      ),
      handleExplainDepositForfeiture: register(
        's36.explain_deposit_forfeiture',
        'explain_deposit_forfeiture',
      ),
      handleBookWithCash: register('s36.book_with_cash', 'book_with_cash'),
      handleBookWithGiftCard: register(
        's36.book_with_gift_card',
        'book_with_gift_card',
      ),
      handleChangeProviderOnReschedule: register(
        's36.change_provider_on_reschedule',
        'change_provider_on_reschedule',
      ),
      handleAddServicesToCart: register(
        's36.add_services_to_cart',
        'add_services_to_cart',
      ),
      handleRemoveServiceFromCart: register(
        's36.remove_service_from_cart',
        'remove_service_from_cart',
      ),
      handleShowCartTotalDuration: register(
        's36.show_cart_total_duration',
        'show_cart_total_duration',
      ),
      handleExplainMultiServiceCart: register(
        's36.explain_multi_service_cart',
        'explain_multi_service_cart',
      ),
      handleExplainPackageSavings: register(
        's36.explain_package_savings',
        'explain_package_savings',
      ),
    } as any,
    businessLanguages: {
      handleExplainBookingLanguages: register(
        'lang.explain_booking_languages',
        'explain_booking_languages',
      ),
    } as any,
    businessDateFormat: {
      handleExplainBookingDateFormat: register(
        'fmt.explain_booking_date_format',
        'explain_booking_date_format',
      ),
    } as any,
    businessTax: {
      handleExplainCheckoutTax: register(
        'tax.explain_checkout_tax',
        'explain_checkout_tax',
      ),
      handleExplainConsumerCheckoutTax: register(
        'tax.explain_consumer_checkout_tax',
        'explain_consumer_checkout_tax',
      ),
    } as any,
    businessCompliance: {
      handleExplainDataRights: register(
        'compliance.explain_data_rights',
        'explain_data_rights',
      ),
    } as any,
    tourService: {
      handleExplainTourBooking: register(
        'tour.explain_tour_booking',
        'explain_tour_booking',
      ),
      handleExplainTourDaySlots: register(
        'tour.explain_tour_day_slots',
        'explain_tour_day_slots',
      ),
      handleDiagnoseTourCapacity: register(
        'tour.diagnose_tour_capacity',
        'diagnose_tour_capacity',
      ),
      handleExplainTourBookingRecord: register(
        'tour.explain_tour_booking_record',
        'explain_tour_booking_record',
      ),
      handleExplainTourMeetingPoint: register(
        'tour.explain_tour_meeting_point',
        'explain_tour_meeting_point',
      ),
    } as any,
    recommendationProduct: {
      handleExplainCheckoutRecommendations: register(
        'rec.explain_checkout_recommendations',
        'explain_checkout_recommendations',
      ),
      handleExplainConsumerCheckoutSuccess: register(
        'rec.explain_consumer_checkout_success',
        'explain_consumer_checkout_success',
      ),
    } as any,
    businessCurrency: {
      handleExplainCheckoutCurrency: register(
        'curr.explain_checkout_currency',
        'explain_checkout_currency',
      ),
      handleExplainTenantCurrency: register(
        'curr.explain_tenant_currency',
        'explain_tenant_currency',
      ),
      handleExplainNotificationCurrency: register(
        'curr.explain_notification_currency',
        'explain_notification_currency',
      ),
      handleExplainStripeCheckoutCurrency: register(
        'curr.explain_stripe_checkout_currency',
        'explain_stripe_checkout_currency',
      ),
    } as any,
    consumerAdoption: {
      handleIntent: jest.fn(async (_biz, action) => {
        const key = `adopt.${action}`;
        if (!calls[key]) {
          calls[key] = handler(action);
        }
        await calls[key]();
        return { success: true, action, summary: 'ok', details: {} };
      }),
    } as any,
  };
}

const DISPATCH_CASES: Array<{ action: string; callKey: string }> = [
  { action: 'my_profile', callKey: 's28.my_profile' },
  { action: 'update_my_profile', callKey: 's28.update_my_profile' },
  { action: 'my_appointments', callKey: 's28.my_appointments' },
  { action: 'my_subscriptions', callKey: 's28.my_subscriptions' },
  { action: 'subscription_usage', callKey: 's28.subscription_usage' },
  { action: 'my_gift_cards', callKey: 's28.my_gift_cards' },
  { action: 'gift_card_balance', callKey: 's28.gift_card_balance' },
  {
    action: 'gift_card_redemption_history',
    callKey: 's28.gift_card_redemption_history',
  },
  {
    action: 'request_gift_card_cancel',
    callKey: 's28.request_gift_card_cancel',
  },
  {
    action: 'request_gift_card_modify',
    callKey: 's28.request_gift_card_modify',
  },
  {
    action: 'track_physical_gift_card_order',
    callKey: 's28.track_physical_gift_card_order',
  },
  { action: 'privacy_export', callKey: 's28.privacy_export' },
  { action: 'privacy_delete', callKey: 's28.privacy_delete' },
  { action: 'discover_packages', callKey: 's28.discover_packages' },
  {
    action: 'discover_subscription_plans',
    callKey: 's28.discover_subscription_plans',
  },
  {
    action: 'discover_gift_card_products',
    callKey: 's28.discover_gift_card_products',
  },
  {
    action: 'check_multi_service_block_availability',
    callKey: 's29.check_multi_service_block_availability',
  },
  {
    action: 'check_package_line_availability',
    callKey: 's29.check_package_line_availability',
  },
  {
    action: 'earliest_slot_all_services',
    callKey: 's29.earliest_slot_all_services',
  },
  {
    action: 'providers_available_later_days',
    callKey: 's29.providers_available_later_days',
  },
  { action: 'explain_why_no_slots', callKey: 's29.explain_why_no_slots' },
  {
    action: 'check_providers_for_service',
    callKey: 's30.check_providers_for_service',
  },
  { action: 'book_nearest_slot', callKey: 's30.book_nearest_slot' },
  { action: 'apply_gift_card_code', callKey: 's30.apply_gift_card_code' },
  { action: 'check_gift_card_balance', callKey: 's30.check_gift_card_balance' },
  { action: 'buy_gift_card', callKey: 's30.buy_gift_card' },
  { action: 'buy_gift_card_physical', callKey: 's30.buy_gift_card' },
  { action: 'choose_payment_method', callKey: 's30.choose_payment_method' },
  { action: 'pay_online', callKey: 's30.pay_online' },
  { action: 'pay_cash_at_visit', callKey: 's30.pay_cash_at_visit' },
  {
    action: 'purchase_subscription_checkout',
    callKey: 's30.purchase_subscription_checkout',
  },
  {
    action: 'explain_why_stripe_required',
    callKey: 's30.explain_why_stripe_required',
  },
  { action: 'receipt_status', callKey: 's30.receipt_status' },
  { action: 'enter_shipping_address', callKey: 's31.enter_shipping_address' },
  {
    action: 'order_status_notifications',
    callKey: 's31.order_status_notifications',
  },
  { action: 'contact_support', callKey: 's32.contact_support' },
  { action: 'open_ticket_for_order', callKey: 's32.open_ticket_for_order' },
  { action: 'how_to_download_app', callKey: 's34.how_to_download_app' },
  { action: 'switch_to_consumer_app', callKey: 's34.switch_to_consumer_app' },
  { action: 'promo_code_help', callKey: 's34.promo_code_help' },
  { action: 'loyalty_points_balance', callKey: 's34.loyalty_points_balance' },
  { action: 'explain_loyalty_points', callKey: 's34.explain_loyalty_points' },
  { action: 'explain_last_push', callKey: 's35.explain_last_push' },
  { action: 'open_booking_from_push', callKey: 's35.open_booking_from_push' },
  { action: 'offline_queue_status', callKey: 's35.offline_queue_status' },
  { action: 'retry_offline_action', callKey: 's35.retry_offline_action' },
  { action: 'dismiss_push', callKey: 's35.dismiss_push' },
  { action: 'enable_notifications', callKey: 's35.enable_notifications' },
  {
    action: 'appointment_reminder_preferences',
    callKey: 's35.appointment_reminder_preferences',
  },
  { action: 'book_package', callKey: 's36.book_package' },
  { action: 'book_multi_service', callKey: 's36.book_multi_service' },
  {
    action: 'check_package_availability',
    callKey: 's36.check_package_availability',
  },
  {
    action: 'check_multi_service_availability',
    callKey: 's36.check_multi_service_availability',
  },
  {
    action: 'select_subscription_plan',
    callKey: 's36.select_subscription_plan',
  },
  { action: 'use_subscription_credit', callKey: 's36.use_subscription_credit' },
  { action: 'cancel_my_booking', callKey: 's36.cancel_my_booking' },
  { action: 'reschedule_my_booking', callKey: 's36.reschedule_my_booking' },
  {
    action: 'cancel_package_visit_self',
    callKey: 's36.cancel_package_visit_self',
  },
  {
    action: 'reschedule_package_visit_self',
    callKey: 's36.reschedule_package_visit_self',
  },
  { action: 'list_my_appointments', callKey: 's36.list_my_appointments' },
  { action: 'list_my_package_visits', callKey: 's36.list_my_package_visits' },
  { action: 'get_manage_link', callKey: 's36.get_manage_link' },
  { action: 'explain_cancel_policy', callKey: 's36.explain_cancel_policy' },
  {
    action: 'explain_deposit_forfeiture',
    callKey: 's36.explain_deposit_forfeiture',
  },
  { action: 'book_with_cash', callKey: 's36.book_with_cash' },
  { action: 'book_with_gift_card', callKey: 's36.book_with_gift_card' },
  {
    action: 'change_provider_on_reschedule',
    callKey: 's36.change_provider_on_reschedule',
  },
  { action: 'add_services_to_cart', callKey: 's36.add_services_to_cart' },
  {
    action: 'remove_service_from_cart',
    callKey: 's36.remove_service_from_cart',
  },
  {
    action: 'show_cart_total_duration',
    callKey: 's36.show_cart_total_duration',
  },
  {
    action: 'explain_multi_service_cart',
    callKey: 's36.explain_multi_service_cart',
  },
  {
    action: 'explain_package_savings',
    callKey: 's36.explain_package_savings',
  },
  {
    action: 'explain_booking_languages',
    callKey: 'lang.explain_booking_languages',
  },
  {
    action: 'explain_booking_date_format',
    callKey: 'fmt.explain_booking_date_format',
  },
  {
    action: 'explain_checkout_tax',
    callKey: 'tax.explain_checkout_tax',
  },
  {
    action: 'explain_data_rights',
    callKey: 'compliance.explain_data_rights',
  },
  {
    action: 'explain_consumer_checkout_tax',
    callKey: 'tax.explain_consumer_checkout_tax',
  },
  {
    action: 'explain_tour_booking',
    callKey: 'tour.explain_tour_booking',
  },
  {
    action: 'explain_tour_day_slots',
    callKey: 'tour.explain_tour_day_slots',
  },
  {
    action: 'explain_tour_booking_record',
    callKey: 'tour.explain_tour_booking_record',
  },
  {
    action: 'explain_tour_meeting_point',
    callKey: 'tour.explain_tour_meeting_point',
  },
  {
    action: 'explain_checkout_recommendations',
    callKey: 'rec.explain_checkout_recommendations',
  },
  {
    action: 'explain_consumer_checkout_success',
    callKey: 'rec.explain_consumer_checkout_success',
  },
  {
    action: 'explain_my_notifications',
    callKey: 'adopt.explain_my_notifications',
  },
  {
    action: 'manage_notification_preferences',
    callKey: 'adopt.manage_notification_preferences',
  },
  { action: 'refer_a_friend', callKey: 'adopt.refer_a_friend' },
  { action: 'share_salon_link', callKey: 'adopt.share_salon_link' },
  { action: 'share_my_booking', callKey: 'adopt.share_my_booking' },
  {
    action: 'rebook_last_appointment',
    callKey: 'adopt.rebook_last_appointment',
  },
  { action: 'find_my_saved_salons', callKey: 'adopt.find_my_saved_salons' },
  { action: 'switch_salon_tenant', callKey: 'adopt.switch_salon_tenant' },
  {
    action: 'explain_checkout_currency',
    callKey: 'curr.explain_checkout_currency',
  },
  {
    action: 'explain_tenant_currency',
    callKey: 'curr.explain_tenant_currency',
  },
  {
    action: 'explain_notification_currency',
    callKey: 'curr.explain_notification_currency',
  },
  {
    action: 'explain_stripe_checkout_currency',
    callKey: 'curr.explain_stripe_checkout_currency',
  },
];

describe('customer-ai-command.logic', () => {
  const session = {
    customerId: 'cust-1',
    slug: 'salon',
    cartServiceIds: ['s1'],
    packageId: 'pkg-1',
    packageName: 'Spa Day',
    giftCardCode: 'GCM-1234',
    paymentMethod: 'cash',
    useSubscriptionId: 'sub-1',
    bookingId: 'bk-1',
    offlineQueueCount: 2,
    online: true,
    userEmail: 'a@b.com',
    userName: 'Anna',
    prompt: 'help me book',
  };

  it.each(DISPATCH_CASES)(
    'dispatches $action to the correct sprint handler',
    async ({ action, callKey }) => {
      const deps = buildDeps();
      const result = await dispatchCustomerIntent(
        deps,
        'biz-1',
        action,
        { serviceName: 'Cut' },
        session,
      );
      expect(result.success).toBe(true);
      expect(deps.calls[callKey]).toHaveBeenCalled();
    },
  );

  it('falls back to params when session fields are absent', async () => {
    const deps = buildDeps();
    await dispatchCustomerIntent(
      deps,
      'biz-1',
      'book_package',
      {
        cartServiceIds: ['s9'],
        packageId: 'pkg-9',
        bookingId: 'bk-9',
        giftCardCode: 'GCM-9',
        paymentMethod: 'online',
        useSubscriptionId: 'sub-9',
        lastPush: { id: 'push-1' },
        offlineQueueCount: 5,
        online: false,
      },
      { customerId: 'cust-1' },
    );
    expect(deps.calls['s36.book_package']).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        cartServiceIds: ['s9'],
        packageId: 'pkg-9',
        bookingId: 'bk-9',
        giftCardCode: 'GCM-9',
        paymentMethod: 'online',
        useSubscriptionId: 'sub-9',
        offlineQueueCount: 5,
        online: false,
        lastPush: { id: 'push-1' },
      }),
    );
  });

  it('passes session context and prompt into handler params', async () => {
    const deps = buildDeps();
    await dispatchCustomerIntent(
      deps,
      'biz-1',
      'book_package',
      { extra: true },
      session,
    );
    expect(deps.calls['s36.book_package']).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        sessionCustomerId: 'cust-1',
        cartServiceIds: ['s1'],
        packageId: 'pkg-1',
        bookingId: 'bk-1',
        _prompt: 'help me book',
        extra: true,
      }),
    );
  });

  it('passes prompt to pay_online handler', async () => {
    const deps = buildDeps();
    await dispatchCustomerIntent(deps, 'biz-1', 'pay_online', {}, session);
    expect(deps.calls['s30.pay_online']).toHaveBeenCalledWith(
      'biz-1',
      expect.any(Object),
      'help me book',
    );
  });

  it('passes prompt to reschedule_my_booking handler', async () => {
    const deps = buildDeps();
    await dispatchCustomerIntent(
      deps,
      'biz-1',
      'reschedule_my_booking',
      {},
      session,
    );
    expect(deps.calls['s36.reschedule_my_booking']).toHaveBeenCalledWith(
      'biz-1',
      expect.any(Object),
      'help me book',
    );
  });

  it('passes prompt to cancel_my_booking handler', async () => {
    const deps = buildDeps();
    await dispatchCustomerIntent(
      deps,
      'biz-1',
      'cancel_my_booking',
      {},
      session,
    );
    expect(deps.calls['s36.cancel_my_booking']).toHaveBeenCalledWith(
      'biz-1',
      expect.any(Object),
      'help me book',
    );
  });

  it('passes prompt to payments handlers that require NL context', async () => {
    const deps = buildDeps();
    await dispatchCustomerIntent(
      deps,
      'biz-1',
      'check_providers_for_service',
      {},
      session,
    );
    expect(deps.calls['s30.check_providers_for_service']).toHaveBeenCalledWith(
      'biz-1',
      expect.any(Object),
      'help me book',
    );
  });

  it('passes physical flag for buy_gift_card_physical', async () => {
    const deps = buildDeps();
    await dispatchCustomerIntent(
      deps,
      'biz-1',
      'buy_gift_card_physical',
      {},
      session,
    );
    expect(deps.payments.handleBuyGiftCard).toHaveBeenCalledWith(
      'biz-1',
      expect.any(Object),
      true,
    );
  });

  it('passes user identity to support handlers', async () => {
    const deps = buildDeps();
    await dispatchCustomerIntent(deps, 'biz-1', 'contact_support', {}, session);
    expect(deps.calls['s32.contact_support']).toHaveBeenCalledWith(
      'biz-1',
      expect.any(Object),
      'help me book',
      'a@b.com',
      'Anna',
    );
  });

  it('returns clarify for unsupported customer actions', async () => {
    const deps = buildDeps();
    const result = await dispatchCustomerIntent(
      deps,
      'biz-1',
      'create_booking',
      {},
      session,
    );
    expect(result.action).toBe('unknown');
    expect(result.details?.clarify).toBe(true);
  });

  it('executes multi-step customer compound decomposition', async () => {
    const deps = buildDeps();
    const result = await executeCustomerCompoundFromSteps(
      deps,
      'biz-1',
      'Book spa day package and apply promo code SPRING25',
      [
        {
          action: 'book_package',
          params: {},
          reasoning: 'book',
          segment: 'book package',
        },
        {
          action: 'promo_code_help',
          params: { promoCode: 'SPRING25' },
          reasoning: 'promo',
          segment: 'promo',
        },
      ],
      { customerId: 'cust-1', slug: 'salon' },
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('compound_intent');
    expect(deps.calls['s36.book_package']).toHaveBeenCalled();
    expect(deps.calls['s34.promo_code_help']).toHaveBeenCalled();
    expect(result.details?.finalContext).toBeDefined();
  });

  it('stops compound execution on failed step', async () => {
    const deps = buildDeps();
    deps.selfServiceBooking.handleBookPackage = jest.fn(async () => ({
      success: false,
      action: 'book_package',
      summary: 'missing package',
      details: {},
    }));
    const result = await executeCustomerCompoundFromSteps(
      deps,
      'biz-1',
      'compound',
      [
        { action: 'book_package', params: {}, reasoning: 'a', segment: 'a' },
        { action: 'promo_code_help', params: {}, reasoning: 'b', segment: 'b' },
      ],
      {},
    );
    expect(result.success).toBe(false);
    expect(result.details?.failedStep).toBe('book_package');
  });

  it('returns clarify when compound has fewer than two steps', async () => {
    const deps = buildDeps();
    const result = await executeCustomerCompoundFromSteps(
      deps,
      'biz-1',
      'single',
      [],
      {},
    );
    expect(result.details?.clarify).toBe(true);
  });

  it('caps compound execution at four steps', async () => {
    const deps = buildDeps();
    const steps = Array.from({ length: 5 }, (_, index) => ({
      action: 'list_my_appointments',
      params: {},
      reasoning: `step-${index}`,
      segment: `segment-${index}`,
    }));
    const result = await executeCustomerCompoundFromSteps(
      deps,
      'biz-1',
      'long compound',
      steps,
      {},
    );
    expect(result.success).toBe(true);
    expect(deps.calls['s36.list_my_appointments']).toHaveBeenCalledTimes(4);
    expect(result.details?.steps).toHaveLength(4);
  });

  it('merges compound context between successful steps', async () => {
    const deps = buildDeps();
    deps.selfServiceBooking.handleBookPackage = jest.fn(async () => ({
      success: true,
      action: 'book_package',
      summary: 'booked',
      details: { bookingId: 'bk-2', packageId: 'pkg-9' },
    }));
    const result = await executeCustomerCompoundFromSteps(
      deps,
      'biz-1',
      'Book package and get manage link',
      [
        {
          action: 'book_package',
          params: {},
          reasoning: 'book',
          segment: 'book',
        },
        {
          action: 'get_manage_link',
          params: {},
          reasoning: 'link',
          segment: 'link',
        },
      ],
      { customerId: 'cust-1' },
    );
    expect(result.success).toBe(true);
    expect(deps.calls['s36.get_manage_link']).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({ bookingId: 'bk-2', packageId: 'pkg-9' }),
      'Book package and get manage link',
    );
  });
});
