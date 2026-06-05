import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import type { PublicBookingService } from '../public-booking/public-booking.service.js';
import type { PublicCustomerBookingService } from '../public-booking/public-customer-booking.service.js';
import type { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import type { ServicePackagesService } from '../service-packages/service-packages.service.js';
import type { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import type { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import {
  buildBookingManageUrl,
  ensureBookingManageToken,
} from '../../common/utils/booking-manage-token.util.js';
import {
  evaluateCustomerBookingPolicy,
  resolveCustomerSelfServiceSettings,
  resolvePublicPaymentSettings,
} from '../../common/utils/customer-self-service.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  mergeCompoundStepParams,
  pickSharedEntitySessionSlice,
} from './ai-command-entity-params.util.js';
import {
  decomposeCustomerBookingCompoundPrompt,
  extractPackageNameFromPrompt,
  extractServiceNamesFromPrompt,
  parseCartServiceIds,
  type CustomerBookingCompoundStep,
} from './ai-self-service-booking.util.js';

export interface SelfServiceBookingLogicDeps {
  publicBookingService: PublicBookingService;
  publicCustomerBookingService: PublicCustomerBookingService;
  publicCustomerAuthService: PublicCustomerAuthService;
  packagesService: ServicePackagesService;
  subscriptionsService: ServiceSubscriptionsService;
  multiServiceBookingsService: MultiServiceBookingsService;
  bookingRepo: Repository<Booking>;
  businessRepo: Repository<Business>;
  serviceRepo: Repository<Service>;
  configService: ConfigService;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

function sumCartDuration(
  services: Array<{ durationMinutes: number; bufferMinutes?: number }>,
  turnoverBufferMinutes = 5,
): number {
  const base = services.reduce(
    (sum, svc) => sum + svc.durationMinutes + (svc.bufferMinutes ?? 0),
    0,
  );
  if (services.length <= 1) return base;
  return base + (services.length - 1) * turnoverBufferMinutes;
}

function resolveSessionCustomerId(
  params: Record<string, any>,
): string | undefined {
  return (
    (params.sessionCustomerId as string | undefined) ??
    (params.customerId as string | undefined)
  );
}

function resolveByName<T extends { name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const needle = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}

async function resolveBusinessSlug(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
): Promise<string | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  return business?.slug ?? null;
}

async function resolveServices(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<Service[]> {
  const ids = parseCartServiceIds(params.cartServiceIds ?? params.serviceIds);
  if (ids.length) {
    const found = await deps.serviceRepo.find({ where: { businessId } });
    return ids
      .map((id) => found.find((s) => s.id === id))
      .filter((s): s is Service => Boolean(s));
  }
  const names = Array.isArray(params.serviceNames)
    ? (params.serviceNames as string[])
    : extractServiceNamesFromPrompt((params._prompt as string) ?? '');
  if (!names.length && params.serviceName)
    names.push(params.serviceName as string);
  if (!names.length) return [];
  const catalog = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
  });
  return names
    .map((name) => resolveByName(catalog, name))
    .filter((s): s is Service => Boolean(s));
}

async function resolvePackageId(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<string | undefined> {
  if (params.packageId) return params.packageId as string;
  const name =
    (params.packageName as string | undefined) ??
    extractPackageNameFromPrompt((params._prompt as string) ?? '');
  if (!name) return undefined;
  const packages = await deps.packagesService.listPublicPackages(businessId);
  const match = resolveByName(packages, name);
  return match?.id;
}

function buildSessionCartPatch(serviceIds: string[]): Record<string, string> {
  return { cartServiceIds: serviceIds.join(',') };
}

export async function handleBookPackageLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('book_package', 'Business not found.');

  const packageId = await resolvePackageId(deps, businessId, params);
  if (!packageId) {
    return failure(
      'book_package',
      'Which package would you like to book? Browse packages first or name one.',
      {
        clarify: true,
        missing: ['packageName'],
        navigate: { path: 'packages', query: {} },
      },
    );
  }

  const packages = await deps.packagesService.listPublicPackages(businessId);
  const pkg = packages.find((p) => p.id === packageId);
  if (!pkg) return failure('book_package', 'Package not found.');

  if (!params.date && !params.blockStartTime && !params.lines) {
    return success(
      'book_package',
      `Ready to book "${pkg.name}". Pick a date and time on the package checkout page.`,
      {
        packageId,
        packageName: pkg.name,
        navigate: { path: 'packages', query: { packageId } },
        sessionContext: { packageId, packageName: pkg.name },
      },
    );
  }

  return success(
    'book_package',
    `Continue booking "${pkg.name}" at checkout.`,
    {
      packageId,
      packageName: pkg.name,
      navigate: { path: 'checkout', query: { packageId } },
      sessionContext: { packageId, packageName: pkg.name },
    },
  );
}

export async function handleBookMultiServiceLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('book_multi_service', 'Business not found.');

  const services = await resolveServices(deps, businessId, params);
  if (!services.length) {
    return failure(
      'book_multi_service',
      'Add services to your cart first, or name the services you want to book together.',
      { clarify: true, missing: ['serviceNames'] },
    );
  }

  const serviceIds = services.map((s) => s.id);
  const settings = deps.multiServiceBookingsService.resolveSettingsFromBusiness(
    (await deps.businessRepo.findOne({ where: { id: businessId } }))!,
  );

  if (!params.blockStartTime && !params.lines) {
    return success(
      'book_multi_service',
      `${services.length} service(s) selected (${settings.schedulingMode} mode). Choose a time block to continue.`,
      {
        serviceIds,
        serviceNames: services.map((s) => s.name),
        navigate: {
          path: 'checkout',
          query: { services: serviceIds.join(',') },
        },
        sessionContext: buildSessionCartPatch(serviceIds),
      },
    );
  }

  return success(
    'book_multi_service',
    'Continue multi-service booking at checkout.',
    {
      serviceIds,
      navigate: { path: 'checkout', query: { services: serviceIds.join(',') } },
      sessionContext: buildSessionCartPatch(serviceIds),
    },
  );
}

export async function handleCheckPackageAvailabilityLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug)
    return failure('check_package_availability', 'Business not found.');

  const packageId = await resolvePackageId(deps, businessId, params);
  if (!packageId) {
    return failure(
      'check_package_availability',
      'Name which package to check availability for.',
      {
        clarify: true,
        missing: ['packageName'],
      },
    );
  }

  try {
    const lines = await deps.publicBookingService.suggestPackageLineSlots(
      slug,
      packageId,
    );
    return success(
      'check_package_availability',
      lines.lines?.length
        ? `Found a package block with ${lines.lines.length} service line(s).`
        : 'No package blocks available right now.',
      { packageId, lines },
    );
  } catch (err: any) {
    return failure(
      'check_package_availability',
      err?.message ?? 'No package availability found.',
      { packageId, reason: 'no_slots' },
    );
  }
}

export async function handleCheckMultiServiceAvailabilityLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug)
    return failure('check_multi_service_availability', 'Business not found.');

  const services = await resolveServices(deps, businessId, params);
  if (!services.length) {
    return failure(
      'check_multi_service_availability',
      'Specify which services to check (add to cart or name them).',
      { clarify: true, missing: ['serviceNames'] },
    );
  }

  const serviceIds = services.map((s) => s.id);
  try {
    if (params.date) {
      const day = await deps.publicBookingService.getMultiServiceBlockDaySlots(
        slug,
        serviceIds,
        params.date as string,
      );
      return success(
        'check_multi_service_availability',
        `${day.slots?.length ?? 0} block slot(s) on ${params.date}.`,
        { slots: day.slots, date: params.date, serviceIds },
      );
    }
    const block = await deps.publicBookingService.suggestMultiServiceBlock(
      slug,
      serviceIds,
    );
    return success(
      'check_multi_service_availability',
      `Next available block: ${block.startTime} with ${block.employeeName}.`,
      { block, serviceIds },
    );
  } catch (err: any) {
    return failure(
      'check_multi_service_availability',
      err?.message ?? 'No multi-service blocks available.',
      { serviceIds, reason: 'no_blocks' },
    );
  }
}

export async function handleSelectSubscriptionPlanLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const plans = await deps.subscriptionsService.listPlans(
    businessId,
    params.serviceId as string,
    false,
  );
  if (!plans.length)
    return failure(
      'select_subscription_plan',
      'No subscription plans are available.',
    );

  const planName = (params.planName as string | undefined)?.trim();
  const plan = planName ? resolveByName(plans, planName) : plans[0];
  if (!plan) {
    return failure(
      'select_subscription_plan',
      `Plan "${planName}" not found.`,
      {
        clarify: true,
        availablePlans: plans.map((p) => p.name),
      },
    );
  }

  return success('select_subscription_plan', `Selected plan "${plan.name}".`, {
    planId: plan.id,
    planName: plan.name,
    sessionContext: {
      selectedSubscriptionPlanId: plan.id,
      selectedSubscriptionPlanName: plan.name,
    },
    navigate: { path: 'subscriptions', query: { planId: plan.id } },
  });
}

export async function handleUseSubscriptionCreditLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'use_subscription_credit',
      'Sign in to use subscription credits.',
      { clarify: true },
    );
  }

  const subs = await deps.subscriptionsService.listCustomerSubscriptions(
    businessId,
    customerId,
  );
  const active = subs.filter(
    (s) => s.appointmentsRemaining > 0 && s.status === 'active',
  );
  if (!active.length) {
    return failure(
      'use_subscription_credit',
      'You have no active subscription credits.',
      {
        subscriptions: subs,
      },
    );
  }

  const sub = params.subscriptionId
    ? active.find((s) => s.id === params.subscriptionId)
    : active[0];
  if (!sub)
    return failure(
      'use_subscription_credit',
      'Subscription not found or no visits remaining.',
    );

  return success(
    'use_subscription_credit',
    `Using "${sub.plan?.name ?? 'membership'}" — ${sub.appointmentsRemaining} visit(s) remaining.`,
    {
      subscriptionId: sub.id,
      appointmentsRemaining: sub.appointmentsRemaining,
      sessionContext: { useSubscriptionId: sub.id },
      paymentMethod: 'subscription_credit',
    },
  );
}

async function resolveOwnedBooking(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  customerId: string,
  params: Record<string, any>,
): Promise<Booking | null> {
  if (params.bookingId) {
    return deps.bookingRepo.findOne({
      where: { id: params.bookingId as string, businessId, customerId },
      relations: { employee: true, service: true },
    });
  }
  const upcoming = await deps.bookingRepo.find({
    where: { businessId, customerId, status: BookingStatus.CONFIRMED },
    order: { startTime: 'ASC' },
    take: 1,
  });
  return upcoming[0] ?? null;
}

export async function handleCancelMyBookingLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId)
    return failure('cancel_my_booking', 'Sign in to cancel your booking.', {
      clarify: true,
    });

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('cancel_my_booking', 'Business not found.');

  const booking = await resolveOwnedBooking(
    deps,
    businessId,
    customerId,
    params,
  );
  if (!booking) {
    return failure(
      'cancel_my_booking',
      'No upcoming booking found to cancel.',
      { clarify: true },
    );
  }

  try {
    const { booking: cancelled } =
      await deps.publicCustomerBookingService.cancelBooking(
        slug,
        customerId,
        booking.id,
      );
    return success(
      'cancel_my_booking',
      `Cancelled your ${booking.service?.name ?? 'appointment'}.`,
      {
        bookingId: cancelled.id,
        status: cancelled.status,
      },
    );
  } catch (err: any) {
    return failure(
      'cancel_my_booking',
      err?.message ?? 'Could not cancel this booking.',
      {
        bookingId: booking.id,
      },
    );
  }
}

export async function handleRescheduleMyBookingLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId)
    return failure('reschedule_my_booking', 'Sign in to reschedule.', {
      clarify: true,
    });

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('reschedule_my_booking', 'Business not found.');

  const booking = await resolveOwnedBooking(
    deps,
    businessId,
    customerId,
    params,
  );
  if (!booking) {
    return failure('reschedule_my_booking', 'No upcoming booking found.', {
      clarify: true,
    });
  }

  if (!params.startTime && !params.date) {
    return success(
      'reschedule_my_booking',
      `Pick a new time for your ${booking.service?.name ?? 'appointment'}.`,
      {
        bookingId: booking.id,
        clarify: true,
        navigate: { path: 'account', query: { reschedule: booking.id } },
      },
    );
  }

  try {
    const { booking: updated } =
      await deps.publicCustomerBookingService.rescheduleBooking(
        slug,
        customerId,
        booking.id,
        {
          startTime:
            (params.startTime as string) ??
            `${params.date}T${params.timeSlot ?? '09:00'}:00.000Z`,
          employeeId: params.employeeId as string | undefined,
        },
      );
    return success(
      'reschedule_my_booking',
      'Your appointment has been rescheduled.',
      {
        bookingId: updated.id,
        startTime: updated.startTime.toISOString(),
      },
    );
  } catch (err: any) {
    return failure(
      'reschedule_my_booking',
      err?.message ?? 'Could not reschedule.',
      {
        bookingId: booking.id,
      },
    );
  }
}

export async function handleCancelPackageVisitSelfLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId)
    return failure(
      'cancel_package_visit_self',
      'Sign in to cancel your package visit.',
      { clarify: true },
    );

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('cancel_package_visit_self', 'Business not found.');

  const booking = await resolveOwnedBooking(
    deps,
    businessId,
    customerId,
    params,
  );
  if (!booking) {
    return failure('cancel_package_visit_self', 'No package visit found.', {
      clarify: true,
    });
  }

  try {
    const { bookings } =
      await deps.publicCustomerBookingService.cancelPackageVisit(
        slug,
        customerId,
        booking.id,
      );
    return success(
      'cancel_package_visit_self',
      `Cancelled package visit (${bookings.length} appointment(s)).`,
      { bookingIds: bookings.map((b) => b.id) },
    );
  } catch (err: any) {
    return failure(
      'cancel_package_visit_self',
      err?.message ?? 'Could not cancel package visit.',
      {
        bookingId: booking.id,
      },
    );
  }
}

export async function handleReschedulePackageVisitSelfLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'reschedule_package_visit_self',
      'Sign in to reschedule your package visit.',
      { clarify: true },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug)
    return failure('reschedule_package_visit_self', 'Business not found.');

  const booking = await resolveOwnedBooking(
    deps,
    businessId,
    customerId,
    params,
  );
  if (!booking) {
    return failure('reschedule_package_visit_self', 'No package visit found.', {
      clarify: true,
    });
  }

  if (!params.lines && !params.blockStartTime) {
    return success(
      'reschedule_package_visit_self',
      'Choose a new time block for your package visit.',
      {
        bookingId: booking.id,
        clarify: true,
        navigate: { path: 'account', query: { reschedulePackage: booking.id } },
      },
    );
  }

  try {
    const { bookings } =
      await deps.publicCustomerBookingService.reschedulePackageVisit(
        slug,
        customerId,
        booking.id,
        {
          lines: params.lines,
        },
      );
    return success(
      'reschedule_package_visit_self',
      'Package visit rescheduled.',
      {
        bookingIds: bookings.map((b) => b.id),
      },
    );
  } catch (err: any) {
    return failure(
      'reschedule_package_visit_self',
      err?.message ?? 'Could not reschedule package visit.',
      {
        bookingId: booking.id,
      },
    );
  }
}

export async function handleListMyAppointmentsLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId)
    return failure(
      'list_my_appointments',
      'Sign in to list your appointments.',
      { clarify: true },
    );

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('list_my_appointments', 'Business not found.');

  const { bookings } = await deps.publicCustomerAuthService.listBookings(
    slug,
    customerId,
  );
  const upcoming = bookings.filter((b) => b.status === BookingStatus.CONFIRMED);
  const lines = upcoming
    .slice(0, 5)
    .map(
      (b) =>
        `• ${b.serviceName} with ${b.employeeName} — ${b.startTime.slice(0, 16)}` +
        (b.canCancel || b.canReschedule ? '' : ' (policy restricted)'),
    );

  return success(
    'list_my_appointments',
    upcoming.length
      ? `You have ${upcoming.length} upcoming appointment(s).`
      : 'You have no upcoming appointments.',
    {
      bookings,
      upcomingCount: upcoming.length,
      summaryLines: lines,
    },
  );
}

export async function handleGetManageLinkLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('get_manage_link', 'Business not found.');

  let booking: Booking | null = null;
  if (params.bookingId) {
    booking = await deps.bookingRepo.findOne({
      where: {
        id: params.bookingId as string,
        businessId,
        ...(customerId ? { customerId } : {}),
      },
    });
  } else if (customerId) {
    booking = await resolveOwnedBooking(deps, businessId, customerId, params);
  }

  if (!booking) {
    return failure(
      'get_manage_link',
      'Specify which booking you need a manage link for.',
      {
        clarify: true,
        missing: ['bookingId'],
      },
    );
  }

  const token = await ensureBookingManageToken(deps.bookingRepo, booking.id);
  const frontendUrl =
    deps.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  const manageUrl = buildBookingManageUrl(frontendUrl, slug, booking.id, token);

  return success('get_manage_link', 'Here is your booking manage link.', {
    bookingId: booking.id,
    manageUrl,
    manageToken: token,
  });
}

export async function handleExplainCancelPolicyLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) return failure('explain_cancel_policy', 'Business not found.');

  const settings = resolveCustomerSelfServiceSettings(business.settings);
  const parts = [
    settings.allowCancel
      ? 'Online cancellation is allowed.'
      : 'Online cancellation is disabled.',
    settings.allowReschedule
      ? 'Online rescheduling is allowed.'
      : 'Online rescheduling is disabled.',
    `Minimum notice: ${settings.minimumNoticeHours} hours before the appointment.`,
    `Maximum reschedules per booking: ${settings.maxReschedulesPerBooking}.`,
    settings.allowProviderChangeOnReschedule
      ? 'You may change provider when rescheduling.'
      : 'Provider cannot be changed when rescheduling.',
  ];

  let bookingPolicy: Record<string, unknown> | undefined;
  const customerId = resolveSessionCustomerId(params);
  if (customerId && params.bookingId) {
    const booking = await deps.bookingRepo.findOne({
      where: { id: params.bookingId as string, businessId, customerId },
    });
    if (booking) {
      bookingPolicy = {
        cancel: evaluateCustomerBookingPolicy(booking, settings, 'cancel'),
        reschedule: evaluateCustomerBookingPolicy(
          booking,
          settings,
          'reschedule',
        ),
      };
    }
  }

  return success('explain_cancel_policy', parts.join(' '), {
    settings,
    bookingPolicy,
    policyLines: parts,
  });
}

export async function handleBookWithCashLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  _params: Record<string, any>,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) return failure('book_with_cash', 'Business not found.');

  const payment = resolvePublicPaymentSettings(business.settings);
  if (!payment.acceptCashPayments) {
    return failure(
      'book_with_cash',
      'This business does not accept cash payments for online bookings.',
    );
  }

  return success(
    'book_with_cash',
    'Cash payment selected — pay at your visit.',
    {
      paymentMethod: 'cash',
      sessionContext: { paymentMethod: 'cash', markPaid: 'false' },
      navigate: { path: 'checkout', query: { payment: 'cash' } },
    },
  );
}

export async function handleBookWithGiftCardLogic(
  deps: SelfServiceBookingLogicDeps,
  _businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const code = (params.giftCardCode as string | undefined)?.trim();
  if (!code) {
    return failure(
      'book_with_gift_card',
      'Provide your gift card code to pay with it.',
      {
        clarify: true,
        missing: ['giftCardCode'],
      },
    );
  }

  return success(
    'book_with_gift_card',
    'Gift card will be applied at checkout.',
    {
      giftCardCode: code,
      sessionContext: { giftCardCode: code, paymentMethod: 'gift_card' },
      navigate: { path: 'checkout', query: { giftCard: code } },
    },
  );
}

export async function handleChangeProviderOnRescheduleLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business)
    return failure('change_provider_on_reschedule', 'Business not found.');

  const settings = resolveCustomerSelfServiceSettings(business.settings);
  if (!settings.allowProviderChangeOnReschedule) {
    return failure(
      'change_provider_on_reschedule',
      'This business does not allow changing provider when rescheduling.',
      { settings },
    );
  }

  const employeeName = params.employeeName as string | undefined;
  if (!employeeName) {
    return success(
      'change_provider_on_reschedule',
      'You can pick a different provider when rescheduling. Name who you prefer.',
      { clarify: true, allowed: true },
    );
  }

  return success(
    'change_provider_on_reschedule',
    `When you reschedule, you can switch to ${employeeName}.`,
    {
      allowed: true,
      employeeName,
      sessionContext: { rescheduleEmployeeName: employeeName },
    },
  );
}

export async function handleAddServicesToCartLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const existing = parseCartServiceIds(params.cartServiceIds);
  const services = await resolveServices(deps, businessId, params);
  if (!services.length) {
    return failure('add_services_to_cart', 'Name which services to add.', {
      clarify: true,
      missing: ['serviceNames'],
    });
  }

  const merged = [...new Set([...existing, ...services.map((s) => s.id)])];
  const settings = deps.multiServiceBookingsService.resolveSettingsFromBusiness(
    (await deps.businessRepo.findOne({ where: { id: businessId } }))!,
  );
  if (merged.length > settings.maxServiceCount) {
    return failure(
      'add_services_to_cart',
      `Cart limit is ${settings.maxServiceCount} services.`,
      { cartServiceIds: merged, limit: settings.maxServiceCount },
    );
  }

  return success(
    'add_services_to_cart',
    `Added ${services.map((s) => s.name).join(', ')} to cart (${merged.length} total).`,
    {
      added: services.map((s) => ({ id: s.id, name: s.name })),
      cartServiceIds: merged,
      sessionContext: buildSessionCartPatch(merged),
    },
  );
}

export async function handleRemoveServiceFromCartLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const existing = parseCartServiceIds(params.cartServiceIds);
  if (!existing.length) {
    return failure('remove_service_from_cart', 'Your cart is empty.', {
      cartServiceIds: [],
    });
  }

  const toRemove = await resolveServices(deps, businessId, {
    serviceNames: params.serviceNames,
    serviceName: params.serviceName,
    serviceId: params.serviceId,
    serviceIds: params.serviceIds,
    _prompt: params._prompt,
  });
  const removeIds = toRemove.length
    ? toRemove.map((s) => s.id)
    : params.serviceId
      ? [params.serviceId as string]
      : [];

  if (!removeIds.length) {
    return failure(
      'remove_service_from_cart',
      'Name which service to remove.',
      {
        clarify: true,
        cartServiceIds: existing,
      },
    );
  }

  const next = existing.filter((id) => !removeIds.includes(id));
  const removedNames = toRemove.map((s) => s.name);

  return success(
    'remove_service_from_cart',
    removedNames.length
      ? `Removed ${removedNames.join(', ')} from cart.`
      : 'Service removed from cart.',
    {
      cartServiceIds: next,
      sessionContext: buildSessionCartPatch(next),
    },
  );
}

export async function handleShowCartTotalDurationLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const serviceIds = parseCartServiceIds(params.cartServiceIds);
  if (!serviceIds.length) {
    return failure(
      'show_cart_total_duration',
      'Your cart is empty — add services first.',
      {
        totalMinutes: 0,
      },
    );
  }

  const catalog = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
  });
  const selected = serviceIds
    .map((id) => catalog.find((s) => s.id === id))
    .filter((s): s is Service => Boolean(s));

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  const turnoverBufferMinutes = business
    ? deps.multiServiceBookingsService.resolveSettingsFromBusiness(business)
        .turnoverBufferMinutes
    : undefined;

  const totalMinutes = sumCartDuration(
    selected.map((s) => ({
      durationMinutes: s.durationMinutes,
      bufferMinutes: s.bufferMinutes,
    })),
    turnoverBufferMinutes,
  );

  return success(
    'show_cart_total_duration',
    `${selected.length} service(s) — about ${totalMinutes} minutes total.`,
    {
      totalMinutes,
      serviceCount: selected.length,
      services: selected.map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
      })),
      cartServiceIds: serviceIds,
    },
  );
}

export function mergeCustomerBookingCompoundContext(
  context: Record<string, unknown>,
  step: CustomerBookingCompoundStep,
  result: CommandResult,
): Record<string, unknown> {
  const details = result.details as Record<string, unknown>;
  const next = { ...context };
  if (details.sessionContext && typeof details.sessionContext === 'object') {
    Object.assign(next, details.sessionContext);
  }
  if (details.cartServiceIds) next.cartServiceIds = details.cartServiceIds;
  if (details.bookingId) next.bookingId = details.bookingId;
  if (details.packageId) next.packageId = details.packageId;
  if (details.manageUrl) next.manageUrl = details.manageUrl;
  if (
    step.action === 'list_my_appointments' &&
    Array.isArray(details.bookings)
  ) {
    const upcoming = (
      details.bookings as Array<{ id: string; status: string }>
    ).find((b) => b.status === BookingStatus.CONFIRMED);
    if (upcoming) next.bookingId = upcoming.id;
  }
  Object.assign(next, pickSharedEntitySessionSlice(details));
  return next;
}

export async function handleCustomerBookingCompoundLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const steps: CustomerBookingCompoundStep[] =
    (params.compoundSteps as CustomerBookingCompoundStep[] | undefined) ??
    decomposeCustomerBookingCompoundPrompt(prompt);

  if (steps.length < 2) {
    return failure(
      'compound_intent',
      'Could not split this into multiple customer booking commands. Try separating with "and" or semicolons.',
      { clarify: true },
    );
  }

  const results: CommandResult[] = [];
  let compoundContext: Record<string, unknown> = { ...params, _prompt: prompt };

  for (const step of steps.slice(0, 4)) {
    const stepParams = {
      ...compoundContext,
      ...mergeCompoundStepParams(compoundContext, step.params, step.action),
      _prompt: step.segment,
    };
    let result: CommandResult;
    switch (step.action) {
      case 'book_package':
        result = await handleBookPackageLogic(deps, businessId, stepParams);
        break;
      case 'book_multi_service':
        result = await handleBookMultiServiceLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'check_package_availability':
        result = await handleCheckPackageAvailabilityLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'check_multi_service_availability':
        result = await handleCheckMultiServiceAvailabilityLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'select_subscription_plan':
        result = await handleSelectSubscriptionPlanLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'use_subscription_credit':
        result = await handleUseSubscriptionCreditLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'cancel_my_booking':
        result = await handleCancelMyBookingLogic(deps, businessId, stepParams);
        break;
      case 'reschedule_my_booking':
        result = await handleRescheduleMyBookingLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'cancel_package_visit_self':
        result = await handleCancelPackageVisitSelfLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'reschedule_package_visit_self':
        result = await handleReschedulePackageVisitSelfLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'list_my_appointments':
        result = await handleListMyAppointmentsLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'get_manage_link':
        result = await handleGetManageLinkLogic(deps, businessId, stepParams);
        break;
      case 'explain_cancel_policy':
        result = await handleExplainCancelPolicyLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'book_with_cash':
        result = await handleBookWithCashLogic(deps, businessId, stepParams);
        break;
      case 'book_with_gift_card':
        result = await handleBookWithGiftCardLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'change_provider_on_reschedule':
        result = await handleChangeProviderOnRescheduleLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'add_services_to_cart':
        result = await handleAddServicesToCartLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'remove_service_from_cart':
        result = await handleRemoveServiceFromCartLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'show_cart_total_duration':
        result = await handleShowCartTotalDurationLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      default:
        result = failure(
          step.action,
          `Unsupported customer booking compound step: ${step.action}.`,
        );
    }
    results.push(result);
    if (!result.success) {
      return {
        success: false,
        action: 'compound_intent',
        summary: `Stopped at step ${results.length} (${step.action}): ${result.summary}`,
        details: {
          steps: results.map((r) => r.action),
          failedStep: step.action,
        },
      };
    }
    compoundContext = mergeCustomerBookingCompoundContext(
      compoundContext,
      step,
      result,
    );
  }

  return {
    success: true,
    action: 'compound_intent',
    summary: `Completed ${results.length} customer booking step(s): ${results.map((r) => r.action.replace(/_/g, ' ')).join(', ')}.`,
    details: {
      steps: results.map((r) => ({ action: r.action, summary: r.summary })),
      decomposed: true,
      customerBookingCompound: true,
      finalContext: compoundContext,
      sessionContext: compoundContext,
    },
  };
}
