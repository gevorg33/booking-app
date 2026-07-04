import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { PublicBookingService } from '../public-booking/public-booking.service.js';
import type { PublicCustomerBookingService } from '../public-booking/public-customer-booking.service.js';
import type { PublicCustomerWaitlistService } from '../public-booking/public-customer-waitlist.service.js';
import type { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import type { PublicConsumerSupportService } from '../public-booking/public-consumer-support.service.js';
import type { PublicCustomerBookingItem } from '../public-booking/public-customer-auth.types.js';
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
  buildCancelMyBookingAmbiguousSummary,
  enrichCancelMyBookingParamsFromPrompt,
  matchCustomerOwnedBooking,
} from './ai-cancel-my-booking.util.js';
import {
  buildRescheduleMyBookingAmbiguousSummary,
  buildRescheduleOwnedBookingMatchParams,
  enrichRescheduleMyBookingParamsFromPrompt,
} from './ai-reschedule-my-booking.util.js';
import { handleConfirmMyBookingDetailsLogic } from './ai-confirm-my-booking-details.logic.js';
import { handleAddBookingToCalendarLogic } from './ai-add-booking-to-calendar.logic.js';
import { handleExplainPreparationNotesLogic } from './ai-explain-preparation-notes.logic.js';
import { handleExplainCancelPolicyLogic } from './ai-explain-cancel-policy.logic.js';
import { handleExplainDepositForfeitureLogic } from './ai-explain-deposit-forfeiture.logic.js';
import { handleGetManageLinkLogic } from './ai-get-manage-link.logic.js';
import { handleRecoverLostManageLinkLogic } from './ai-recover-lost-manage-link.logic.js';
import { handleSignInToManageBookingLogic } from './ai-sign-in-to-manage-booking.logic.js';
import { handleExplainManageBookingPageLogic } from './ai-explain-manage-booking-page.logic.js';
import { handleNotifyRunningLateLogic } from './ai-notify-running-late.logic.js';
import { handleLeaveVisitReviewLogic } from './ai-leave-visit-review.logic.js';
import { handleExplainPostVisitReviewPromptLogic } from './ai-explain-post-visit-review-prompt.logic.js';
import { handleReportBookingProblemLogic } from './ai-report-booking-problem.logic.js';
import { handleSignInAfterBookingLogic } from './ai-sign-in-after-booking.logic.js';
import {
  handleCheckWaitlistStatusLogic,
  handleJoinWaitlistLogic,
} from './ai-customer-waitlist.logic.js';

export { handleExplainCancelPolicyLogic } from './ai-explain-cancel-policy.logic.js';
export { handleExplainPackageVisitRulesLogic } from './ai-explain-package-visit-rules.logic.js';
export { handleGetManageLinkLogic } from './ai-get-manage-link.logic.js';
export { handleRecoverLostManageLinkLogic } from './ai-recover-lost-manage-link.logic.js';
export { handleNotifyRunningLateLogic } from './ai-notify-running-late.logic.js';
export { handleLeaveVisitReviewLogic } from './ai-leave-visit-review.logic.js';
export { handleExplainPostVisitReviewPromptLogic } from './ai-explain-post-visit-review-prompt.logic.js';
export { handleReportBookingProblemLogic } from './ai-report-booking-problem.logic.js';
export { handleSignInAfterBookingLogic } from './ai-sign-in-after-booking.logic.js';
export { handleSignInToManageBookingLogic } from './ai-sign-in-to-manage-booking.logic.js';
export { handleExplainManageBookingPageLogic } from './ai-explain-manage-booking-page.logic.js';
export { handleConfirmMyBookingDetailsLogic } from './ai-confirm-my-booking-details.logic.js';
export { handleAddBookingToCalendarLogic } from './ai-add-booking-to-calendar.logic.js';
export { handleListMyUpcomingAppointmentsLogic } from './ai-list-my-upcoming-appointments.logic.js';
export {
  handleJoinWaitlistLogic,
  handleCheckWaitlistStatusLogic,
} from './ai-customer-waitlist.logic.js';
import { handleCancelPackageVisitSelfLogic } from './ai-cancel-package-visit-self.logic.js';
import { handleReschedulePackageVisitSelfLogic } from './ai-reschedule-package-visit-self.logic.js';
import { handleListMyUpcomingAppointmentsLogic } from './ai-list-my-upcoming-appointments.logic.js';
import { handleBookAnotherServiceLogic } from './ai-book-another-service.logic.js';
import { handleExplainMultiServiceCartLogic } from './ai-explain-multi-service-cart.logic.js';
import { handleExplainPackageSavingsLogic } from './ai-explain-package-savings.logic.js';
import { handleExplainSubscriptionVsOneTimeLogic } from './ai-explain-subscription-vs-one-time.logic.js';
import { handleExplainPackageVisitRulesLogic } from './ai-explain-package-visit-rules.logic.js';
import { handleBookWithGiftCardLogic } from './ai-book-with-gift-card.logic.js';
import {
  groupCustomerPackageVisits,
  type CustomerPackageVisitSummary,
} from './ai-list-my-package-visits-customer.util.js';
import {
  mergeCompoundStepParams,
  pickSharedEntitySessionSlice,
} from './ai-command-entity-params.util.js';
import {
  addDaysToDateKey,
  getDateKeyInTimezone,
  resolveTimezone,
} from '../../common/utils/timezone.util.js';
import {
  formatDateDisplay,
  formatTimeDisplay,
} from '../../common/utils/date-format.util.js';
import { PUBLIC_AVAILABILITY_SCAN_DAYS } from './ai-orchestration.helpers.js';
import type { TimeOfDayWindow } from './ai-operations.util.js';
import {
  buildMultiServiceAvailabilityFromSlots,
  buildMultiServiceAvailabilitySummary,
  buildMultiServiceNoSlotsSummary,
  decomposeCustomerBookingCompoundPrompt,
  enrichMultiServiceAvailabilityParams,
  extractPackageNameFromPrompt,
  extractServiceNamesFromPrompt,
  filterMultiServiceSlotsByTimePreference,
  parseCartServiceIds,
  type CustomerBookingCompoundStep,
} from './ai-self-service-booking.util.js';

export interface SelfServiceBookingLogicDeps {
  publicBookingService: PublicBookingService;
  publicCustomerBookingService: PublicCustomerBookingService;
  publicCustomerWaitlistService?: Pick<
    PublicCustomerWaitlistService,
    'joinWaitlist' | 'getWaitlistStatus'
  >;
  publicCustomerAuthService: PublicCustomerAuthService;
  publicConsumerSupportService?: Pick<
    PublicConsumerSupportService,
    'createPostBookingSupportTicket'
  >;
  packagesService: ServicePackagesService;
  subscriptionsService: ServiceSubscriptionsService;
  multiServiceBookingsService: MultiServiceBookingsService;
  notificationsService: Pick<NotificationsService, 'sendBookingConfirmation'>;
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

  if (
    params.bookingFirstAvailable &&
    !params.date &&
    !params.blockStartTime &&
    !params.lines
  ) {
    try {
      const block = await deps.publicBookingService.suggestPackageBlock(
        slug,
        packageId,
      );
      return success(
        'book_package',
        `Found the earliest "${pkg.name}" block — continue at checkout.`,
        {
          packageId,
          packageName: pkg.name,
          blockStartTime: block.startTime,
          date: block.dateKey,
          employeeId: block.employeeId,
          employeeName: block.employeeName,
          navigate: {
            path: 'checkout',
            query: { packageId, startTime: block.startTime },
          },
          sessionContext: {
            packageId,
            packageName: pkg.name,
            blockStartTime: block.startTime,
          },
        },
      );
    } catch {
      // Fall through to manual slot selection on the package page.
    }
  }

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
      {
        packageId,
        lines,
        navigate: { path: 'packages', query: { packageId } },
      },
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
  prompt?: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  const slug = business?.slug ?? null;
  if (!slug)
    return failure('check_multi_service_availability', 'Business not found.');

  const tz = resolveTimezone(business?.timezone);
  const effectivePrompt = prompt ?? String(params._prompt ?? '');
  const enriched = enrichMultiServiceAvailabilityParams(
    effectivePrompt,
    params,
    tz,
  ) as Record<string, any>;

  const services = await resolveServices(deps, businessId, enriched);
  if (!services.length) {
    return failure(
      'check_multi_service_availability',
      'Specify which services to check (add to cart or name them).',
      { clarify: true, missing: ['serviceNames'] },
    );
  }

  const serviceIds = services.map((s) => s.id);
  const timeOfDay = (enriched.timeOfDay as TimeOfDayWindow | undefined) ?? null;
  const notBeforeTime = (enriched.notBeforeTime as string | undefined) ?? null;
  const hasTimePreference = Boolean(timeOfDay || notBeforeTime);

  try {
    const listDaySlots = async (dateKey: string) => {
      const day = await deps.publicBookingService.getMultiServiceBlockDaySlots(
        slug,
        serviceIds,
        dateKey,
      );
      return filterMultiServiceSlotsByTimePreference(day.slots ?? [], {
        timeOfDay,
        notBeforeTime,
      });
    };

    if (enriched.date) {
      const dateKey = String(enriched.date);
      const slots = await listDaySlots(dateKey);
      if (!slots.length) {
        return failure(
          'check_multi_service_availability',
          buildMultiServiceNoSlotsSummary({ dateKey, timeOfDay }),
          { serviceIds, date: dateKey, timeOfDay, reason: 'no_slots' },
        );
      }
      return success(
        'check_multi_service_availability',
        buildMultiServiceAvailabilitySummary({
          slots,
          dateKey,
          timeOfDay,
        }),
        {
          slots,
          date: dateKey,
          serviceIds,
          serviceNames: services.map((s) => s.name),
          timeOfDay,
          availability: buildMultiServiceAvailabilityFromSlots(slots),
        },
      );
    }

    if (hasTimePreference) {
      const todayKey = getDateKeyInTimezone(new Date(), tz);
      for (let offset = 0; offset < PUBLIC_AVAILABILITY_SCAN_DAYS; offset++) {
        const dateKey = addDaysToDateKey(todayKey, offset, tz);
        const slots = await listDaySlots(dateKey);
        if (!slots.length) continue;
        return success(
          'check_multi_service_availability',
          buildMultiServiceAvailabilitySummary({
            slots,
            dateKey,
            timeOfDay,
          }),
          {
            slots,
            date: dateKey,
            serviceIds,
            serviceNames: services.map((s) => s.name),
            timeOfDay,
            availability: buildMultiServiceAvailabilityFromSlots(slots),
          },
        );
      }
      return failure(
        'check_multi_service_availability',
        buildMultiServiceNoSlotsSummary({
          timeOfDay,
          scanDays: PUBLIC_AVAILABILITY_SCAN_DAYS,
        }),
        { serviceIds, timeOfDay, reason: 'no_slots' },
      );
    }

    const block = await deps.publicBookingService.suggestMultiServiceBlock(
      slug,
      serviceIds,
    );
    const dateLabel = block.dateKey
      ? formatDateDisplay(block.dateKey)
      : undefined;
    const timeLabel = formatTimeDisplay(block.startTime);
    const summary = dateLabel
      ? `Next available block: ${timeLabel} on ${dateLabel} with ${block.employeeName}.`
      : `Next available block: ${timeLabel} with ${block.employeeName}.`;
    return success('check_multi_service_availability', summary, {
      block,
      serviceIds,
    });
  } catch (err: any) {
    return failure(
      'check_multi_service_availability',
      err?.message ?? 'No multi-service blocks available.',
      { serviceIds, reason: 'no_blocks' },
    );
  }
}

export async function handlePreviewMultiServiceCartLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug)
    return failure('preview_multi_service_cart', 'Business not found.');

  const services = await resolveServices(deps, businessId, {
    ...params,
    _prompt: prompt ?? params._prompt,
  });
  if (!services.length) {
    return failure(
      'preview_multi_service_cart',
      'Add services to your cart first, or name the services to preview.',
      { clarify: true, missing: ['serviceNames'] },
    );
  }

  const serviceIds = services.map((s) => s.id);
  try {
    const preview = await deps.publicBookingService.previewMultiServiceSelection(
      slug,
      serviceIds,
    );
    const totalMinutes = preview.totals?.blockDurationMinutes;
    const totalPrice = preview.totals?.totalPrice;
    const summary =
      totalMinutes != null && totalPrice != null
        ? `${services.length} service(s) — about ${totalMinutes} minutes, ${totalPrice} ${preview.totals?.currency ?? ''}`.trim()
        : `${services.length} service(s) previewed.`;
    return success('preview_multi_service_cart', summary, {
      serviceIds,
      serviceNames: services.map((s) => s.name),
      preview,
    });
  } catch (err: any) {
    return failure(
      'preview_multi_service_cart',
      err?.message ?? 'Could not preview this multi-service selection.',
      { serviceIds, reason: 'invalid_selection' },
    );
  }
}

export async function handleSuggestPackageBlockLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('suggest_package_block', 'Business not found.');

  const packageId = await resolvePackageId(deps, businessId, params);
  if (!packageId) {
    return failure(
      'suggest_package_block',
      'Name which package to suggest a block for.',
      {
        clarify: true,
        missing: ['packageName'],
      },
    );
  }

  try {
    const block = await deps.publicBookingService.suggestPackageBlock(
      slug,
      packageId,
    );
    const dateLabel = block.dateKey
      ? formatDateDisplay(block.dateKey)
      : undefined;
    const timeLabel = formatTimeDisplay(block.startTime);
    const summary = dateLabel
      ? `Suggested block: ${timeLabel} on ${dateLabel} with ${block.employeeName}.`
      : `Suggested block: ${timeLabel} with ${block.employeeName}.`;
    return success('suggest_package_block', summary, {
      packageId,
      block,
      navigate: {
        path: 'checkout',
        query: { packageId, startTime: block.startTime },
      },
    });
  } catch (err: any) {
    return failure(
      'suggest_package_block',
      err?.message ?? 'No package block available right now.',
      { packageId, reason: 'no_blocks' },
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
  prompt = '',
  options?: {
    allowFirstWhenUnspecified?: boolean;
    intent?: 'cancel' | 'reschedule' | 'default';
  },
): Promise<{
  booking: Booking | null;
  ambiguous: Booking[];
}> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const intent = options?.intent ?? 'default';
  const enrichedParams =
    intent === 'reschedule'
      ? enrichRescheduleMyBookingParamsFromPrompt(
          params,
          textPrompt,
          String(params._timeZone ?? 'UTC'),
        )
      : enrichCancelMyBookingParamsFromPrompt(params, textPrompt);
  const matchParams =
    intent === 'reschedule'
      ? buildRescheduleOwnedBookingMatchParams(enrichedParams)
      : intent === 'default'
        ? buildRescheduleOwnedBookingMatchParams(enrichedParams)
        : enrichedParams;
  const matchPrompt = intent === 'cancel' ? textPrompt : '';

  if (enrichedParams.bookingId) {
    const booking = await deps.bookingRepo.findOne({
      where: {
        id: enrichedParams.bookingId as string,
        businessId,
        customerId,
      },
      relations: { employee: true, service: true },
    });
    return { booking: booking ?? null, ambiguous: [] };
  }

  const bookings = await deps.bookingRepo.find({
    where: { businessId, customerId, status: BookingStatus.CONFIRMED },
    relations: { employee: true, service: true },
    order: { startTime: 'ASC' },
  });

  const matched = matchCustomerOwnedBooking(
    bookings,
    matchParams,
    matchPrompt,
    String(params._timeZone ?? 'UTC'),
    options,
  );
  return { booking: matched.booking, ambiguous: matched.ambiguous };
}

export async function handleCancelMyBookingLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId)
    return failure('cancel_my_booking', 'Sign in to cancel your booking.', {
      clarify: true,
    });

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('cancel_my_booking', 'Business not found.');

  const resolved = await resolveOwnedBooking(
    deps,
    businessId,
    customerId,
    params,
    prompt || String(params._prompt ?? ''),
    { allowFirstWhenUnspecified: false, intent: 'cancel' },
  );
  if (resolved.ambiguous.length > 1) {
    return failure(
      'cancel_my_booking',
      buildCancelMyBookingAmbiguousSummary(resolved.ambiguous),
      {
        clarify: true,
        missing: ['bookingId'],
        candidates: resolved.ambiguous.map((row) => ({
          bookingId: row.id,
          serviceName: row.service?.name ?? null,
          startTime: row.startTime.toISOString(),
        })),
      },
    );
  }
  const booking = resolved.booking;
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
    const serviceLabel = booking.service?.name ?? 'appointment';
    return success(
      'cancel_my_booking',
      `Cancelled your ${serviceLabel} — you're all set, no need to call the salon.`,
      {
        bookingId: cancelled.id,
        status: cancelled.status,
        serviceName: booking.service?.name ?? null,
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
  prompt = '',
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId)
    return failure('reschedule_my_booking', 'Sign in to reschedule.', {
      clarify: true,
    });

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('reschedule_my_booking', 'Business not found.');

  const textPrompt = prompt || String(params._prompt ?? '');
  const enrichedParams = enrichRescheduleMyBookingParamsFromPrompt(
    params,
    textPrompt,
    String(params._timeZone ?? 'UTC'),
  );

  const resolved = await resolveOwnedBooking(
    deps,
    businessId,
    customerId,
    params,
    textPrompt,
    { allowFirstWhenUnspecified: false, intent: 'reschedule' },
  );
  if (resolved.ambiguous.length > 1) {
    return failure(
      'reschedule_my_booking',
      buildRescheduleMyBookingAmbiguousSummary(resolved.ambiguous),
      {
        clarify: true,
        missing: ['bookingId'],
        candidates: resolved.ambiguous.map((row) => ({
          bookingId: row.id,
          serviceName: row.service?.name ?? null,
          startTime: row.startTime.toISOString(),
        })),
      },
    );
  }
  const booking = resolved.booking;
  if (!booking) {
    return failure('reschedule_my_booking', 'No upcoming booking found.', {
      clarify: true,
    });
  }

  if (!enrichedParams.startTime && !enrichedParams.date) {
    return success(
      'reschedule_my_booking',
      `Pick a new time for your ${booking.service?.name ?? 'appointment'} — no need to call the salon.`,
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
            (enrichedParams.startTime as string) ??
            `${enrichedParams.date}T${enrichedParams.timeSlot ?? '09:00'}:00.000Z`,
          employeeId: enrichedParams.employeeId as string | undefined,
        },
      );
    const serviceLabel = booking.service?.name ?? 'appointment';
    return success(
      'reschedule_my_booking',
      `Moved your ${serviceLabel} — you're all set, no need to call the salon.`,
      {
        bookingId: updated.id,
        startTime: updated.startTime.toISOString(),
        serviceName: booking.service?.name ?? null,
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

export { handleCancelPackageVisitSelfLogic } from './ai-cancel-package-visit-self.logic.js';
export { handleReschedulePackageVisitSelfLogic } from './ai-reschedule-package-visit-self.logic.js';

export async function handleListMyPackageVisitsLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'list_my_package_visits',
      'Sign in to view your package visits.',
      { clarify: true },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) {
    return failure('list_my_package_visits', 'Business not found.');
  }

  const { bookings } = await deps.publicCustomerAuthService.listBookings(
    slug,
    customerId,
  );
  let packageVisits = groupCustomerPackageVisits(bookings);

  const packageName =
    (params.packageName as string | undefined) ??
    extractPackageNameFromPrompt(prompt || String(params._prompt ?? ''));
  if (packageName) {
    const needle = packageName.toLowerCase();
    packageVisits = packageVisits.filter((visit) =>
      visit.packageName.toLowerCase().includes(needle),
    );
  }

  if (!packageVisits.length) {
    return success(
      'list_my_package_visits',
      'You have no package visits on your account.',
      {
        packageVisits: [] as CustomerPackageVisitSummary[],
        navigate: { path: 'account', query: { tab: 'bookings' } },
      },
    );
  }

  const summaryLines = packageVisits.map((visit) => {
    const next = visit.nextAppointment
      ? ` — next: ${visit.nextAppointment.serviceName} ${visit.nextAppointment.startTime.slice(0, 16)}`
      : '';
    return `• ${visit.packageName}: ${visit.visitsRemaining} visit(s) remaining of ${visit.visitsTotal}${next}`;
  });

  return success(
    'list_my_package_visits',
    packageVisits.length === 1
      ? `You have ${packageVisits[0].visitsRemaining} package visit(s) remaining on ${packageVisits[0].packageName}.`
      : `You have ${packageVisits.length} package bundles on your account.`,
    {
      packageVisits,
      summaryLines,
      navigate: { path: 'account', query: { tab: 'bookings' } },
    },
  );
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
        result = await handleCancelMyBookingLogic(
          deps,
          businessId,
          stepParams,
          String(stepParams._prompt ?? prompt),
        );
        break;
      case 'reschedule_my_booking':
        result = await handleRescheduleMyBookingLogic(
          deps,
          businessId,
          stepParams,
          String(stepParams._prompt ?? prompt),
        );
        break;
      case 'cancel_package_visit_self':
        result = await handleCancelPackageVisitSelfLogic(
          deps,
          businessId,
          stepParams,
          String(stepParams._prompt ?? prompt),
        );
        break;
      case 'reschedule_package_visit_self':
        result = await handleReschedulePackageVisitSelfLogic(
          deps,
          businessId,
          stepParams,
          String(stepParams._prompt ?? prompt),
        );
        break;
      case 'list_my_package_visits':
        result = await handleListMyPackageVisitsLogic(
          deps,
          businessId,
          stepParams,
          String(stepParams._prompt ?? prompt),
        );
        break;
      case 'list_my_appointments':
        result = await handleListMyAppointmentsLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'list_my_upcoming_appointments':
        result = await handleListMyUpcomingAppointmentsLogic(
          deps,
          businessId,
          stepParams,
          String(stepParams._prompt ?? prompt),
        );
        break;
      case 'confirm_my_booking_details':
        result = await handleConfirmMyBookingDetailsLogic(
          deps,
          businessId,
          stepParams,
          String(stepParams._prompt ?? prompt),
        );
        break;
      case 'add_booking_to_calendar':
        result = await handleAddBookingToCalendarLogic(
          deps,
          businessId,
          stepParams,
          String(stepParams._prompt ?? prompt),
        );
        break;
      case 'explain_preparation_notes':
        result = await handleExplainPreparationNotesLogic(
          deps,
          businessId,
          stepParams,
          String(stepParams._prompt ?? prompt),
        );
        break;
      case 'book_another_service':
        result = await handleBookAnotherServiceLogic(
          deps,
          businessId,
          stepParams,
          String(stepParams._prompt ?? prompt),
        );
        break;
      case 'get_manage_link':
        result = await handleGetManageLinkLogic(deps, businessId, stepParams);
        break;
      case 'recover_lost_manage_link':
        result = await handleRecoverLostManageLinkLogic(
          deps,
          businessId,
          stepParams,
          String(stepParams._prompt ?? prompt),
        );
        break;
      case 'explain_cancel_policy':
        result = await handleExplainCancelPolicyLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'explain_deposit_forfeiture':
        result = await handleExplainDepositForfeitureLogic(
          deps,
          businessId,
          stepParams,
          String(stepParams._prompt ?? prompt),
        );
        break;
      case 'explain_package_visit_rules':
        result = await handleExplainPackageVisitRulesLogic(
          deps,
          businessId,
          stepParams,
          String(stepParams._prompt ?? prompt),
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
      case 'explain_multi_service_cart':
        result = await handleExplainMultiServiceCartLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'explain_package_savings':
        result = await handleExplainPackageSavingsLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'explain_subscription_vs_one_time':
        result = await handleExplainSubscriptionVsOneTimeLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
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
