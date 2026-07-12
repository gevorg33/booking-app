import type { CommandResult } from './command-completion.types.js';
import type { AiSelfServiceBookingService } from './ai-self-service-booking.service.js';

export type SelfServiceBookingDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  prompt?: string;
  sessionCustomerId?: string;
  sessionCartServiceIds?: unknown;
  sessionBookingId?: unknown;
};

export type SelfServiceBookingDispatchHandler = (
  service: AiSelfServiceBookingService,
  ctx: SelfServiceBookingDispatchContext,
) => Promise<CommandResult>;

export function buildSelfServiceBookingDispatchMap(): ReadonlyMap<
  string,
  SelfServiceBookingDispatchHandler
> {
  const map = new Map<string, SelfServiceBookingDispatchHandler>();

  map.set('book_package', async (service, ctx) =>
    service.handleBookPackage(ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
      _prompt: ctx.prompt,
    }),
  );
  map.set('book_multi_service', async (service, ctx) =>
    service.handleBookMultiService(ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
      cartServiceIds: ctx.sessionCartServiceIds ?? ctx.params.cartServiceIds,
      _prompt: ctx.prompt,
    }),
  );
  map.set('check_package_availability', async (service, ctx) =>
    service.handleCheckPackageAvailability(ctx.businessId, {
      ...ctx.params,
      _prompt: ctx.prompt,
    }),
  );
  map.set('check_multi_service_availability', async (service, ctx) =>
    service.handleCheckMultiServiceAvailability(ctx.businessId, {
      ...ctx.params,
      cartServiceIds: ctx.sessionCartServiceIds ?? ctx.params.cartServiceIds,
      _prompt: ctx.prompt,
    }),
  );
  map.set('select_subscription_plan', async (service, ctx) =>
    service.handleSelectSubscriptionPlan(ctx.businessId, {
      ...ctx.params,
      _prompt: ctx.prompt,
    }),
  );
  map.set('use_subscription_credit', async (service, ctx) =>
    service.handleUseSubscriptionCredit(ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('cancel_my_booking', async (service, ctx) =>
    service.handleCancelMyBooking(ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
      bookingId: ctx.params.bookingId ?? ctx.sessionBookingId,
    }),
  );
  map.set('cancel_all_upcoming_bookings', async (service, ctx) =>
    service.handleCancelAllUpcomingBookings(ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('reschedule_my_booking', async (service, ctx) =>
    service.handleRescheduleMyBooking(ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
      bookingId: ctx.params.bookingId ?? ctx.sessionBookingId,
    }),
  );
  map.set('cancel_package_visit_self', async (service, ctx) =>
    service.handleCancelPackageVisitSelf(ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
      bookingId: ctx.params.bookingId ?? ctx.sessionBookingId,
    }),
  );
  map.set('reschedule_package_visit_self', async (service, ctx) =>
    service.handleReschedulePackageVisitSelf(ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
      bookingId: ctx.params.bookingId ?? ctx.sessionBookingId,
    }),
  );
  map.set('list_my_appointments', async (service, ctx) =>
    service.handleListMyAppointments(ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('list_my_package_visits', async (service, ctx) =>
    service.handleListMyPackageVisits(
      ctx.businessId,
      { ...ctx.params, sessionCustomerId: ctx.sessionCustomerId },
      ctx.prompt,
    ),
  );
  map.set('get_manage_link', async (service, ctx) =>
    service.handleGetManageLink(ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
      bookingId: ctx.params.bookingId ?? ctx.sessionBookingId,
    }),
  );
  map.set('explain_cancel_policy', async (service, ctx) =>
    service.handleExplainCancelPolicy(ctx.businessId, {
      ...ctx.params,
      sessionCustomerId: ctx.sessionCustomerId,
    }),
  );
  map.set('explain_package_visit_rules', async (service, ctx) =>
    service.handleExplainPackageVisitRules(
      ctx.businessId,
      { ...ctx.params, sessionCustomerId: ctx.sessionCustomerId },
      ctx.prompt,
    ),
  );
  map.set('book_with_cash', async (service, ctx) =>
    service.handleBookWithCash(ctx.businessId, ctx.params),
  );
  map.set('book_with_gift_card', async (service, ctx) =>
    service.handleBookWithGiftCard(ctx.businessId, {
      ...ctx.params,
      _prompt: ctx.prompt,
    }),
  );
  map.set('change_provider_on_reschedule', async (service, ctx) =>
    service.handleChangeProviderOnReschedule(ctx.businessId, {
      ...ctx.params,
      _prompt: ctx.prompt,
    }),
  );
  map.set('add_services_to_cart', async (service, ctx) =>
    service.handleAddServicesToCart(ctx.businessId, {
      ...ctx.params,
      cartServiceIds: ctx.sessionCartServiceIds ?? ctx.params.cartServiceIds,
      _prompt: ctx.prompt,
    }),
  );
  map.set('remove_service_from_cart', async (service, ctx) =>
    service.handleRemoveServiceFromCart(ctx.businessId, {
      ...ctx.params,
      cartServiceIds: ctx.sessionCartServiceIds ?? ctx.params.cartServiceIds,
      _prompt: ctx.prompt,
    }),
  );
  map.set('show_cart_total_duration', async (service, ctx) =>
    service.handleShowCartTotalDuration(ctx.businessId, {
      ...ctx.params,
      cartServiceIds: ctx.sessionCartServiceIds ?? ctx.params.cartServiceIds,
    }),
  );
  map.set('explain_multi_service_cart', async (service, ctx) =>
    service.handleExplainMultiServiceCart(
      ctx.businessId,
      {
        ...ctx.params,
        cartServiceIds: ctx.sessionCartServiceIds ?? ctx.params.cartServiceIds,
        _prompt: ctx.prompt,
      },
      ctx.prompt,
    ),
  );
  map.set('explain_package_savings', async (service, ctx) =>
    service.handleExplainPackageSavings(
      ctx.businessId,
      { ...ctx.params, _prompt: ctx.prompt },
      ctx.prompt,
    ),
  );
  map.set('explain_subscription_vs_one_time', async (service, ctx) =>
    service.handleExplainSubscriptionVsOneTime(
      ctx.businessId,
      { ...ctx.params, _prompt: ctx.prompt },
      ctx.prompt,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiSelfServiceBookingService (ai-cmd-ext-0.5). */
export const SELF_SERVICE_BOOKING_DISPATCH_MAP =
  buildSelfServiceBookingDispatchMap();
