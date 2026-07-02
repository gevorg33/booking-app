import { Between, In, Not, Repository } from 'typeorm';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ServicePackage } from '../service-packages/entities/service-package.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildUtcStartTimeFromDayAndTime,
  toIsoDay,
} from '../../common/utils/date-format.util.js';
import {
  filterBookingsByTimeConstraints,
  fuzzyMatchByName,
  resolveDateRange,
  resolveEmployees,
} from './ai-orchestration.helpers.js';
import {
  enrichCashBookingParams,
  enrichMarkPaidParamsFromPrompt,
  enrichSubscriptionCreditParams,
  filterCashPendingBookings,
  filterMultiServiceBookings,
  filterPackageBookings,
  buildBookingPolicyExplanation,
  summarizeBookingPolicy,
} from './ai-booking-depth.util.js';
import {
  PACKAGE_VISIT_ACTIVE_STATUSES as ACTIVE_STATUSES,
  sortPackageVisitBookings,
} from '../public-booking/public-customer-package-visit.util.js';
import type { BookingService } from '../booking/booking.service.js';
import type { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import type { ServicePackagesService } from '../service-packages/service-packages.service.js';
import type { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import type { SchedulingResourcesService } from '../resources/scheduling-resources.service.js';
import { buildSequentialAppointments } from '../../common/utils/multi-service-booking.util.js';

export interface BookingDepthLogicDeps {
  bookingRepo: Repository<Booking>;
  businessRepo: Repository<Business>;
  packageRepo: Repository<ServicePackage>;
  bookingService: Pick<
    BookingService,
    'create' | 'cancel' | 'update' | 'findOne'
  >;
  subscriptionsService: Pick<
    ServiceSubscriptionsService,
    'getActiveForCustomerService'
  >;
  packagesService: Pick<
    ServicePackagesService,
    'createPackagePurchase' | 'previewFromPackage'
  >;
  multiServiceBookingsService: Pick<
    MultiServiceBookingsService,
    'createGroup' | 'resolveSettingsFromBusiness' | 'previewTotals'
  >;
  resourcesService: Pick<
    SchedulingResourcesService,
    'listResources' | 'assignToBooking'
  >;
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

export async function prepareSubscriptionCreditParamsLogic(
  deps: BookingDepthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  services: Service[],
  resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  resolveService: (list: Service[], name: string) => Service | undefined,
): Promise<
  | { ok: true; params: Record<string, any> }
  | { ok: false; result: CommandResult }
> {
  const customer = params.customerId
    ? customers.find((c) => c.id === params.customerId)
    : params.customerName
      ? resolveCustomer(customers, params.customerName)
      : undefined;
  if (!customer) {
    return {
      ok: false,
      result: failure(
        'create_booking_subscription_credit',
        'Specify the customer to use subscription credit (e.g. "Book Maria for nail care using her subscription").',
        { params, missing: ['customerName'] },
      ),
    };
  }

  const service = params.serviceName
    ? resolveService(services, params.serviceName)
    : params.serviceId
      ? services.find((s) => s.id === params.serviceId)
      : undefined;
  if (!service) {
    return {
      ok: false,
      result: failure(
        'create_booking_subscription_credit',
        'Specify which service the subscription credit applies to.',
        { params, missing: ['serviceName'] },
      ),
    };
  }

  const sub = await deps.subscriptionsService.getActiveForCustomerService(
    businessId,
    customer.id,
    service.id,
  );
  if (!sub) {
    return {
      ok: false,
      result: failure(
        'create_booking_subscription_credit',
        `${customer.name} has no active subscription with remaining visits for ${service.name}.`,
        { customerId: customer.id, serviceId: service.id },
      ),
    };
  }

  return {
    ok: true,
    params: enrichSubscriptionCreditParams(
      {
        ...params,
        customerId: customer.id,
        customerName: customer.name,
        serviceId: service.id,
      },
      sub.id,
    ),
  };
}

export function prepareCashCreateParamsLogic(
  params: Record<string, any>,
  businessSettings: Record<string, unknown> | null | undefined,
):
  | { ok: true; params: Record<string, any> }
  | { ok: false; result: CommandResult } {
  const acceptCash =
    (businessSettings?.publicBooking as Record<string, unknown> | undefined)
      ?.acceptCashPayments === true;
  if (!acceptCash) {
    return {
      ok: false,
      result: failure(
        'create_booking_cash',
        'Cash pay-at-venue is disabled for this business. Enable it in public booking settings first.',
      ),
    };
  }
  return { ok: true, params: enrichCashBookingParams(params) };
}

export async function handleListCashPendingBookingsLogic(
  deps: Pick<BookingDepthLogicDeps, 'bookingRepo'>,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const range = resolveDateRange(params, prompt, params._timeZone ?? 'UTC') ?? {
    start: new Date().toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  };
  const start = new Date(range.start);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setUTCHours(23, 59, 59, 999);

  const bookings = await deps.bookingRepo.find({
    where: { businessId, startTime: Between(start, end) },
    relations: { employee: true, service: true, customer: true },
    order: { startTime: 'ASC' },
  });

  const pending = filterCashPendingBookings(bookings);
  return success(
    'list_cash_pending_bookings',
    pending.length
      ? `Found ${pending.length} pay-at-venue appointment(s).`
      : 'No pay-at-venue appointments in that range.',
    { bookings: pending, count: pending.length, range },
  );
}

export async function handleListPackageBookingsLogic(
  deps: Pick<BookingDepthLogicDeps, 'bookingRepo'>,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const range = resolveDateRange(params, prompt, params._timeZone ?? 'UTC') ?? {
    start: new Date().toISOString().slice(0, 10),
    end: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  };
  const start = new Date(range.start);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setUTCHours(23, 59, 59, 999);

  const bookings = await deps.bookingRepo.find({
    where: { businessId, startTime: Between(start, end) },
    relations: { employee: true, service: true, customer: true },
    order: { startTime: 'ASC' },
  });

  const packageBookings = filterPackageBookings(bookings);
  const purchaseIds = [
    ...new Set(packageBookings.map((b) => b.packagePurchaseId).filter(Boolean)),
  ];
  return success(
    'list_package_bookings',
    packageBookings.length
      ? `${purchaseIds.length} package visit(s), ${packageBookings.length} appointment(s).`
      : 'No package visits in that range.',
    {
      bookings: packageBookings,
      visitCount: purchaseIds.length,
      count: packageBookings.length,
      range,
    },
  );
}

export async function handleListMultiServiceBookingsLogic(
  deps: Pick<BookingDepthLogicDeps, 'bookingRepo'>,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const range = resolveDateRange(params, prompt, params._timeZone ?? 'UTC') ?? {
    start: new Date().toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  };
  const start = new Date(range.start);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setUTCHours(23, 59, 59, 999);

  const bookings = await deps.bookingRepo.find({
    where: { businessId, startTime: Between(start, end) },
    relations: { employee: true, service: true, customer: true },
    order: { startTime: 'ASC' },
  });

  const grouped = filterMultiServiceBookings(bookings);
  const groupIds = [
    ...new Set(grouped.map((b) => b.multiServiceGroupId).filter(Boolean)),
  ];
  return success(
    'list_multi_service_bookings',
    grouped.length
      ? `${groupIds.length} multi-service group(s), ${grouped.length} appointment(s).`
      : 'No multi-service groups in that range.',
    {
      bookings: grouped,
      groupCount: groupIds.length,
      count: grouped.length,
      range,
    },
  );
}

export async function handleExplainBookingPolicyLogic(
  deps: Pick<BookingDepthLogicDeps, 'bookingRepo' | 'businessRepo'>,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const bookingId = params.bookingId as string | undefined;
  if (!bookingId) {
    return failure(
      'explain_booking_policy',
      'Specify which booking to check (booking ID, customer name + date, or "this appointment").',
      { clarify: true, missing: ['bookingId'] },
    );
  }

  const booking = await deps.bookingRepo.findOne({
    where: { id: bookingId, businessId },
    relations: { customer: true, service: true },
  });
  if (!booking) {
    return failure('explain_booking_policy', `Booking ${bookingId} not found.`);
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  const explanation = buildBookingPolicyExplanation({
    booking,
    businessSettings: business?.settings ?? null,
  });
  return success(
    'explain_booking_policy',
    summarizeBookingPolicy(explanation),
    { explanation },
  );
}

async function loadPackageVisit(
  deps: Pick<BookingDepthLogicDeps, 'bookingRepo'>,
  businessId: string,
  packagePurchaseId: string,
): Promise<Booking[]> {
  return deps.bookingRepo.find({
    where: {
      businessId,
      packagePurchaseId,
    },
    relations: { employee: true, service: true, customer: true },
    order: { startTime: 'ASC' },
  });
}

export async function handleCancelPackageVisitLogic(
  deps: BookingDepthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
): Promise<CommandResult> {
  const bookingId = params.bookingId as string | undefined;
  if (!bookingId) {
    return failure(
      'cancel_package_visit',
      'Specify the package visit booking to cancel (anchor appointment or package purchase).',
      { clarify: true, missing: ['bookingId'] },
    );
  }

  const anchor = await deps.bookingRepo.findOne({
    where: { id: bookingId, businessId },
  });
  if (!anchor?.packagePurchaseId) {
    return failure(
      'cancel_package_visit',
      'That booking is not part of a package visit.',
    );
  }

  const visit = await loadPackageVisit(
    deps,
    anchor.businessId,
    anchor.packagePurchaseId,
  );
  const active = visit.filter((b) => ACTIVE_STATUSES.includes(b.status));
  if (!active.length) {
    return failure(
      'cancel_package_visit',
      'No active appointments remain in this package visit.',
    );
  }

  const cancelled: string[] = [];
  for (const item of active) {
    await deps.bookingService.cancel(
      item.id,
      params.reason ?? 'Cancelled package visit (dashboard AI)',
      userId,
    );
    cancelled.push(item.id);
  }

  return success(
    'cancel_package_visit',
    `Cancelled ${cancelled.length} appointment(s) in the package visit.`,
    { bookingIds: cancelled, packagePurchaseId: anchor.packagePurchaseId },
  );
}

export async function handleCancelMultiServiceGroupLogic(
  deps: BookingDepthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
): Promise<CommandResult> {
  const bookingId = params.bookingId as string | undefined;
  if (!bookingId) {
    return failure(
      'cancel_multi_service_group',
      'Specify a booking in the multi-service group to cancel.',
      { clarify: true, missing: ['bookingId'] },
    );
  }

  const booking = await deps.bookingRepo.findOne({
    where: { id: bookingId, businessId },
  });
  if (!booking?.multiServiceGroupId) {
    return failure(
      'cancel_multi_service_group',
      'That booking is not part of a multi-service group.',
    );
  }

  await deps.bookingService.cancel(
    booking.id,
    params.reason ?? 'Cancelled multi-service group (dashboard AI)',
    userId,
  );

  const siblings = await deps.bookingRepo.find({
    where: {
      businessId,
      multiServiceGroupId: booking.multiServiceGroupId,
      status: Not(BookingStatus.CANCELLED),
    },
  });

  return success(
    'cancel_multi_service_group',
    `Cancelled multi-service group (${siblings.length} appointment(s) may remain if not same-visit).`,
    { multiServiceGroupId: booking.multiServiceGroupId, anchorId: booking.id },
  );
}

export async function handleReschedulePackageVisitLogic(
  deps: BookingDepthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
): Promise<CommandResult> {
  const bookingId = params.bookingId as string | undefined;
  if (!bookingId || !params.date || !params.timeSlot) {
    return failure(
      'reschedule_package_visit',
      "Specify the package visit booking, new date, and start time (e.g. move Sofia's package visit to Friday 10:00).",
      { clarify: true, missing: ['bookingId', 'date', 'timeSlot'] },
    );
  }

  const anchor = await deps.bookingRepo.findOne({
    where: { id: bookingId, businessId },
    relations: { service: true },
  });
  if (!anchor?.packagePurchaseId) {
    return failure(
      'reschedule_package_visit',
      'That booking is not part of a package visit.',
    );
  }

  const visit = sortPackageVisitBookings(
    await loadPackageVisit(deps, anchor.businessId, anchor.packagePurchaseId),
  );
  const active = visit.filter((b) => ACTIVE_STATUSES.includes(b.status));
  if (!active.length) {
    return failure(
      'reschedule_package_visit',
      'No active appointments in this package visit.',
    );
  }

  const newFirstStart = new Date(
    buildUtcStartTimeFromDayAndTime(params.date, params.timeSlot),
  );
  const deltaMs = newFirstStart.getTime() - active[0].startTime.getTime();
  const updated: string[] = [];

  for (const item of active) {
    const newStart = new Date(item.startTime.getTime() + deltaMs);
    await deps.bookingService.update(
      item.id,
      {
        startTime: newStart.toISOString(),
        employeeId: params.employeeId ?? item.employeeId,
      },
      userId,
      { skipGroupReschedule: true, excludeBookingIds: active.map((b) => b.id) },
    );
    updated.push(item.id);
  }

  return success(
    'reschedule_package_visit',
    `Rescheduled ${updated.length} appointment(s) in the package visit.`,
    { bookingIds: updated, packagePurchaseId: anchor.packagePurchaseId },
  );
}

export async function handleRescheduleMultiServiceGroupLogic(
  deps: BookingDepthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
): Promise<CommandResult> {
  const bookingId = params.bookingId as string | undefined;
  if (!bookingId || !params.date || !params.timeSlot) {
    return failure(
      'reschedule_multi_service_group',
      'Specify a booking in the group plus new date and block start time.',
      { clarify: true, missing: ['bookingId', 'date', 'timeSlot'] },
    );
  }

  const booking = await deps.bookingRepo.findOne({
    where: { id: bookingId, businessId },
  });
  if (!booking?.multiServiceGroupId) {
    return failure(
      'reschedule_multi_service_group',
      'That booking is not part of a multi-service group.',
    );
  }

  const newStart = new Date(
    buildUtcStartTimeFromDayAndTime(params.date, params.timeSlot),
  );
  await deps.bookingService.update(
    booking.id,
    {
      startTime: newStart.toISOString(),
      employeeId: params.employeeId ?? booking.employeeId,
    },
    userId,
  );

  return success(
    'reschedule_multi_service_group',
    'Rescheduled multi-service group to the new block start time.',
    { multiServiceGroupId: booking.multiServiceGroupId, bookingId: booking.id },
  );
}

export interface MarkPaidResolveContext {
  prompt?: string;
  employees?: Employee[];
  customers?: Customer[];
  timeZone?: string;
  sessionDate?: string;
  calendarRoute?: string;
}

function filterBookingsByCustomerName(
  bookings: Booking[],
  customerName: string,
): Booking[] {
  const needle = customerName.toLowerCase();
  return bookings.filter((b) =>
    b.customer?.name?.toLowerCase().includes(needle),
  );
}

async function queryMarkPaidBookings(
  deps: BookingDepthLogicDeps,
  businessId: string,
  enriched: Record<string, any>,
  employeeIds: string[] | undefined,
  tz: string,
): Promise<Booking[]> {
  const where: Record<string, unknown> = {
    businessId,
    status: Not(BookingStatus.CANCELLED),
  };

  if (employeeIds?.length === 1) {
    where.employeeId = employeeIds[0];
  } else if (employeeIds && employeeIds.length > 1) {
    where.employeeId = In(employeeIds);
  }

  if (enriched.date) {
    const isoDay = toIsoDay(enriched.date, tz);
    const dayStart = new Date(`${isoDay}T00:00:00.000Z`);
    const dayEnd = new Date(`${isoDay}T23:59:59.999Z`);
    where.startTime = Between(dayStart, dayEnd);
  }

  return deps.bookingRepo
    .find({
      where,
      relations: { employee: true, customer: true },
      order: { startTime: 'ASC' },
    })
    .then((rows) => rows ?? []);
}

async function findBookingsForMarkPaid(
  deps: BookingDepthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  ctx: MarkPaidResolveContext,
): Promise<Booking[]> {
  const employees = ctx.employees ?? [];
  const customers = ctx.customers ?? [];
  const prompt = ctx.prompt;
  const tz = params._timeZone ?? ctx.timeZone ?? 'UTC';
  let enriched = enrichMarkPaidParamsFromPrompt(prompt ?? '', params, tz, {
    employees,
    customers,
  }) as Record<string, any>;

  const range = resolveDateRange(enriched, prompt, tz);
  if (range && !enriched.date) {
    enriched = { ...enriched, date: toIsoDay(range.start, tz) };
  }

  let employeeIds: string[] | undefined;
  if (enriched.employeeName || enriched.employeeNames?.length) {
    const resolved = resolveEmployees(employees, enriched);
    if (resolved.length) {
      employeeIds = resolved.map((e) => e.id);
    }
  }

  let bookings = await queryMarkPaidBookings(
    deps,
    businessId,
    enriched,
    employeeIds,
    tz,
  );

  const customerResolved =
    enriched.customerName &&
    typeof enriched.customerName === 'string' &&
    customers.length
      ? fuzzyMatchByName(customers, enriched.customerName)
      : undefined;

  if (!bookings.length && customerResolved && employeeIds?.length) {
    bookings = await queryMarkPaidBookings(
      deps,
      businessId,
      enriched,
      undefined,
      tz,
    );
    bookings = filterBookingsByCustomerName(bookings, customerResolved.name);
  } else if (customerResolved && !employeeIds?.length) {
    bookings = filterBookingsByCustomerName(bookings, customerResolved.name);
  }

  bookings = filterBookingsByTimeConstraints(bookings, enriched, prompt);

  if (!bookings.length && enriched.date && enriched.timeSlot) {
    const bySlot = filterBookingsByTimeConstraints(
      await queryMarkPaidBookings(deps, businessId, enriched, undefined, tz),
      enriched,
      prompt,
    );
    if (bySlot.length) bookings = bySlot;
  }

  const actionable = bookings.filter(
    (b) =>
      b.paymentStatus !== PaymentStatus.PAID &&
      b.status !== BookingStatus.COMPLETED,
  );
  return actionable.length ? actionable : bookings;
}

function resolveMarkPaidBookingIds(
  matches: Booking[],
  params: Record<string, any>,
): string[] {
  if (!matches.length) return [];
  if (matches.length === 1) return [matches[0].id];

  const groupId = matches[0].multiServiceGroupId;
  if (groupId && matches.every((b) => b.multiServiceGroupId === groupId)) {
    return matches.map((b) => b.id);
  }

  if (params.timeSlot) {
    return matches.map((b) => b.id);
  }

  return [];
}

export async function handleMarkPaidLogic(
  deps: BookingDepthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId?: string,
  ctx?: MarkPaidResolveContext,
): Promise<CommandResult> {
  const tz = params._timeZone ?? ctx?.timeZone ?? 'UTC';
  const workingParams = ctx?.prompt
    ? (enrichMarkPaidParamsFromPrompt(ctx.prompt, params, tz, {
        employees: ctx.employees,
        customers: ctx.customers,
        sessionDate: ctx.sessionDate,
        calendarRoute: ctx.calendarRoute,
      }) as Record<string, any>)
    : params;

  let bookingIds: string[] = workingParams.bookingId
    ? [workingParams.bookingId]
    : Array.isArray(workingParams.bookingIds)
      ? workingParams.bookingIds
      : [];

  if (!bookingIds.length && ctx) {
    const matches = await findBookingsForMarkPaid(
      deps,
      businessId,
      workingParams,
      ctx,
    );
    bookingIds = resolveMarkPaidBookingIds(matches, workingParams);
    if (!bookingIds.length && matches.length > 1) {
      return failure(
        'mark_paid',
        `Found ${matches.length} matching appointments — specify a time or booking ID.`,
        {
          clarify: true,
          missing: ['bookingId', 'timeSlot'],
          matchedCount: matches.length,
        },
      );
    }
  }

  if (!bookingIds.length) {
    return failure(
      'mark_paid',
      'Specify which booking to mark paid (booking ID or reference).',
      {
        clarify: true,
        missing: ['bookingId'],
      },
    );
  }

  const updatedIds: string[] = [];
  let summaryName = 'appointment';

  for (const bookingId of bookingIds) {
    const booking = await deps.bookingRepo.findOne({
      where: { id: bookingId, businessId },
      relations: { customer: true },
    });
    if (!booking) continue;

    const isCash =
      booking.metadata?.payAtVenue === true ||
      booking.metadata?.paymentMethod === 'cash';
    await deps.bookingService.update(
      booking.id,
      {
        paymentStatus: PaymentStatus.PAID,
        status: BookingStatus.COMPLETED,
        metadata: {
          ...(booking.metadata ?? {}),
          paidVia: isCash ? 'cash' : 'manual',
          paidAt: new Date().toISOString(),
          paidByUserId: userId,
        },
      },
      userId,
    );
    updatedIds.push(booking.id);
    if (booking.customer?.name) summaryName = booking.customer.name;
  }

  if (!updatedIds.length) {
    return failure('mark_paid', `Booking ${bookingIds[0]} not found.`);
  }

  const summary =
    updatedIds.length === 1
      ? `Marked paid — ${summaryName}.`
      : `Marked ${updatedIds.length} appointments paid.`;

  return success('mark_paid', summary, {
    bookingId: updatedIds[0],
    bookingIds: updatedIds,
  });
}

export async function handleAssignBookingResourceLogic(
  deps: BookingDepthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  _userId?: string,
): Promise<CommandResult> {
  const bookingId = params.bookingId as string | undefined;
  const resourceName = params.resourceName as string | undefined;
  if (!bookingId || !resourceName) {
    return failure(
      'assign_booking_resource',
      'Specify booking and resource (e.g. "Assign room 2 to the 2pm facial").',
      { clarify: true, missing: ['bookingId', 'resourceName'] },
    );
  }

  const booking = await deps.bookingRepo.findOne({
    where: { id: bookingId, businessId },
  });
  if (!booking)
    return failure(
      'assign_booking_resource',
      `Booking ${bookingId} not found.`,
    );

  const resources = await deps.resourcesService.listResources(businessId);
  const needle = resourceName.toLowerCase();
  const resource =
    resources.find((r) => r.name.toLowerCase() === needle) ??
    resources.find((r) => r.name.toLowerCase().includes(needle));
  if (!resource) {
    return failure(
      'assign_booking_resource',
      `Resource "${resourceName}" not found.`,
    );
  }

  await deps.bookingRepo.manager.transaction(async (manager) => {
    await deps.resourcesService.assignToBooking(manager, booking.id, [
      resource.id,
    ]);
  });

  return success(
    'assign_booking_resource',
    `Assigned ${resource.name} to booking ${booking.id}.`,
    {
      bookingId: booking.id,
      resourceId: resource.id,
      resourceName: resource.name,
    },
  );
}

export async function handleCreateMultiServiceBookingLogic(
  deps: BookingDepthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  business: Business,
  employees: Employee[],
  services: Service[],
  customers: Customer[],
  resolveEmployee: (list: Employee[], name: string) => Employee | undefined,
  resolveServices: (list: Service[], p: Record<string, any>) => Service[],
  resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  userId?: string,
): Promise<CommandResult> {
  const matched = resolveServices(services, params);
  if (matched.length < 2) {
    return failure(
      'create_multi_service_booking',
      'Name at least two services for a multi-service booking (e.g. haircut + beard trim).',
      { clarify: true, missing: ['serviceNames'] },
    );
  }

  const employee = params.employeeName
    ? resolveEmployee(employees, params.employeeName)
    : params.employeeId
      ? employees.find((e) => e.id === params.employeeId)
      : undefined;
  if (!employee || !params.date || !params.timeSlot) {
    return failure(
      'create_multi_service_booking',
      'Specify provider, date, and block start time for the multi-service visit.',
      { clarify: true, missing: ['employeeName', 'date', 'timeSlot'] },
    );
  }

  const customer = params.customerName
    ? resolveCustomer(customers, params.customerName)
    : params.customerId
      ? customers.find((c) => c.id === params.customerId)
      : undefined;
  if (!customer) {
    return failure(
      'create_multi_service_booking',
      'Specify the customer for this multi-service booking (or use walk-in with customer name).',
      { clarify: true, missing: ['customerName'] },
    );
  }

  const settings =
    deps.multiServiceBookingsService.resolveSettingsFromBusiness(business);
  const serviceIds = matched.map((s) => s.id);
  const preview = await deps.multiServiceBookingsService.previewTotals(
    businessId,
    serviceIds,
  );
  const blockStart = new Date(
    buildUtcStartTimeFromDayAndTime(params.date, params.timeSlot),
  );
  const lines = matched.map((s) => ({
    serviceId: s.id,
    durationMinutes: s.durationMinutes,
    bufferMinutes: s.bufferMinutes,
    price: Number(s.price),
    currency: s.currency,
    name: s.name,
    categoryId: s.categoryId,
  }));
  const sequential = buildSequentialAppointments(
    lines,
    blockStart,
    settings.turnoverBufferMinutes,
  );

  const group = await deps.multiServiceBookingsService.createGroup({
    businessId,
    customerId: customer.id,
    schedulingMode: settings.schedulingMode,
    totals: preview.totals!,
    blockStartTime: blockStart,
    primaryEmployeeId: employee.id,
    metadata: {
      serviceIds,
      serviceNames: matched.map((s) => s.name),
      source: 'ai_dashboard',
    },
  });

  const created: string[] = [];
  const sameVisit =
    settings.schedulingMode === 'same_visit' && sequential.length > 1;
  for (const line of sequential) {
    const saved = await deps.bookingService.create(
      businessId,
      {
        employeeId: employee.id,
        serviceId: line.serviceId,
        customerId: customer.id,
        startTime: line.startTime.toISOString(),
        notes: params.notes,
        multiServiceGroupId: group.id,
        metadata: {
          source: 'ai_dashboard_multi_service',
          multiServiceGroupId: group.id,
          groupLabel: matched.map((s) => s.name).join(' + '),
        },
      },
      userId,
      {
        paymentStatus: PaymentStatus.NOT_APPLICABLE,
        sameVisitMultiService: sameVisit,
      },
    );
    created.push(saved.id);
  }

  return success(
    'create_multi_service_booking',
    `Booked ${created.length} services with ${employee.name} starting ${params.timeSlot}.`,
    { bookingIds: created, multiServiceGroupId: group.id },
  );
}

export async function handleCreatePackageBookingLogic(
  deps: BookingDepthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  business: Business,
  employees: Employee[],
  services: Service[],
  customers: Customer[],
  resolveEmployee: (list: Employee[], name: string) => Employee | undefined,
  resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  resolvePackage: (name: string) => Promise<ServicePackage | null>,
  userId?: string,
): Promise<CommandResult> {
  const packageName = params.packageName as string | undefined;
  if (!packageName) {
    return failure(
      'create_package_booking',
      'Specify which package to book (e.g. "Spa Day package for James").',
      { clarify: true, missing: ['packageName'] },
    );
  }

  const pkg = await resolvePackage(packageName);
  if (!pkg) {
    return failure(
      'create_package_booking',
      `Package "${packageName}" not found.`,
    );
  }

  const customer = params.customerName
    ? resolveCustomer(customers, params.customerName)
    : params.customerId
      ? customers.find((c) => c.id === params.customerId)
      : undefined;
  if (!customer) {
    return failure(
      'create_package_booking',
      'Specify the customer for this package booking.',
      { clarify: true, missing: ['customerName'] },
    );
  }

  const lines = Array.isArray(params.packageLines) ? params.packageLines : [];
  if (
    !lines.length &&
    (!params.date || !params.timeSlot || !params.employeeName)
  ) {
    return failure(
      'create_package_booking',
      'Provide packageLines (per-service times) or a single date, time, and provider for staff-assisted booking.',
      { clarify: true, missing: ['packageLines'] },
    );
  }

  const preview = deps.packagesService.previewFromPackage(pkg);
  const purchase = await deps.packagesService.createPackagePurchase(
    businessId,
    pkg.id,
    customer.id,
    preview.pricing.packagePrice,
    preview.currency,
  );

  const settings =
    deps.multiServiceBookingsService.resolveSettingsFromBusiness(business);
  const created: string[] = [];

  if (lines.length) {
    for (const line of lines) {
      const employee = line.employeeId
        ? employees.find((e) => e.id === line.employeeId)
        : line.employeeName
          ? resolveEmployee(employees, line.employeeName)
          : undefined;
      if (!employee || !line.serviceId || !line.startTime) continue;
      const saved = await deps.bookingService.create(
        businessId,
        {
          employeeId: employee.id,
          serviceId: line.serviceId,
          customerId: customer.id,
          startTime: line.startTime,
          notes: params.notes,
          packagePurchaseId: purchase.id,
          metadata: {
            source: 'ai_dashboard_package',
            packageId: pkg.id,
            packageName: pkg.name,
            packagePurchaseId: purchase.id,
          },
        },
        userId,
        {
          paymentStatus: PaymentStatus.NOT_APPLICABLE,
          sameVisitMultiService: lines.length > 1,
        },
      );
      created.push(saved.id);
    }
  } else {
    const employee = resolveEmployee(employees, params.employeeName);
    if (!employee) {
      return failure(
        'create_package_booking',
        `Provider "${params.employeeName}" not found.`,
      );
    }
    const itemServices = (pkg.items ?? [])
      .map((item) => item.service)
      .filter(Boolean);
    const blockStart = new Date(
      buildUtcStartTimeFromDayAndTime(params.date, params.timeSlot),
    );
    const sequential = buildSequentialAppointments(
      itemServices.map((s) => ({
        serviceId: s.id,
        durationMinutes: s.durationMinutes,
        bufferMinutes: s.bufferMinutes,
      })),
      blockStart,
      settings.turnoverBufferMinutes,
    );
    for (const line of sequential) {
      const saved = await deps.bookingService.create(
        businessId,
        {
          employeeId: employee.id,
          serviceId: line.serviceId,
          customerId: customer.id,
          startTime: line.startTime.toISOString(),
          notes: params.notes,
          packagePurchaseId: purchase.id,
          metadata: {
            source: 'ai_dashboard_package',
            packageId: pkg.id,
            packageName: pkg.name,
            packagePurchaseId: purchase.id,
          },
        },
        userId,
        {
          paymentStatus: PaymentStatus.NOT_APPLICABLE,
          sameVisitMultiService: sequential.length > 1,
        },
      );
      created.push(saved.id);
    }
  }

  if (!created.length) {
    return failure(
      'create_package_booking',
      'Could not create package appointments — check lines and providers.',
    );
  }

  return success(
    'create_package_booking',
    `Booked ${created.length} appointment(s) for ${customer.name} — ${pkg.name}.`,
    { bookingIds: created, packagePurchaseId: purchase.id, packageId: pkg.id },
  );
}
