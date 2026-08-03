import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { ClinicTestOrderBookingRequestService } from '../clinic-test-results/order/clinic-test-order-booking-request.service.js';
import type {
  ClinicLabQueueFilters,
  ClinicLabQueueItem,
  ClinicTestOrderService,
} from '../clinic-test-results/order/clinic-test-order.service.js';
import type { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  appendBookingFirstAvailableToLabBookUrl,
  assertClinicLabBookingBusinessType,
  formatBookLabCollectionSummary,
  formatLabBookingRequestsSummary,
  formatPendingPatientLabRequestsSummary,
  matchLabQueueOrder,
  parseBookLabCollectionFromPrompt,
  parseListMyLabBookingRequestsFromPrompt,
  parsePushLabBookingFromPrompt,
  parseStaffBookLabCollectionFromPrompt,
  pickCollectionServiceId,
  resolveSessionCustomerId,
} from './ai-clinic-lab-booking.util.js';

export interface ClinicLabBookingLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  clinicTestOrderService: Pick<ClinicTestOrderService, 'listLabQueue'>;
  clinicTestOrderBookingRequestService: Pick<
    ClinicTestOrderBookingRequestService,
    | 'pushBookingRequestToPatient'
    | 'bookCollectionForOrder'
    | 'listPendingBookingRequestsForCustomer'
    | 'getOrderBookingActions'
  >;
  clinicLabAccessService: Pick<ClinicLabAccessService, 'scopeLabQueueFilters'>;
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
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

function clarify(
  action: string,
  summary: string,
  missing: string[],
  details: Record<string, unknown> = {},
): CommandResult {
  return {
    success: false,
    action,
    summary,
    details: { ...details, clarify: true, missing },
  };
}

function resolveSessionEmployeeId(
  params: Record<string, unknown>,
): string | undefined {
  return (
    (typeof params.sessionEmployeeId === 'string'
      ? params.sessionEmployeeId
      : undefined) ??
    (typeof params.employeeId === 'string' ? params.employeeId : undefined)
  );
}

async function resolveOrderForAction(
  deps: ClinicLabBookingLogicDeps,
  businessId: string,
  userId: string,
  input: { orderId?: string; customerName?: string },
  awaitingPatientBooking = false,
): Promise<ClinicLabQueueItem | null> {
  const filters: ClinicLabQueueFilters = {};
  if (awaitingPatientBooking) filters.awaitingPatientBooking = true;

  const scopedFilters = await deps.clinicLabAccessService.scopeLabQueueFilters(
    businessId,
    userId,
    filters,
  );
  const orders = await deps.clinicTestOrderService.listLabQueue(
    businessId,
    scopedFilters,
  );
  return matchLabQueueOrder(orders, input);
}

export async function handlePushLabBookingToPatientLogic(
  deps: ClinicLabBookingLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
  confirmed = false,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('push_lab_booking_to_patient', 'Business not found.');
  }

  const nonClinicType = assertClinicLabBookingBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'push_lab_booking_to_patient',
      'Lab booking requests are only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const parsed =
    parsePushLabBookingFromPrompt(effectivePrompt, params) ??
    parsePushLabBookingFromPrompt(effectivePrompt);
  if (!parsed) {
    return clarify(
      'push_lab_booking_to_patient',
      'Which patient lab order should I push for self-booking?',
      ['customerName', 'orderId'],
    );
  }

  const order = await resolveOrderForAction(
    deps,
    businessId,
    userId,
    parsed,
    false,
  );
  if (!order) {
    return failure(
      'push_lab_booking_to_patient',
      'No matching lab order was found for that patient or order id.',
      {
        customerName: parsed.customerName ?? null,
        orderId: parsed.orderId ?? null,
      },
    );
  }

  const actions =
    await deps.clinicTestOrderBookingRequestService.getOrderBookingActions(
      businessId,
      order.id,
    );
  if (!actions.canPush) {
    return failure(
      'push_lab_booking_to_patient',
      'This lab order cannot be pushed to the patient right now.',
      { orderId: order.id, status: actions.status },
    );
  }

  const collectionServiceId = pickCollectionServiceId(
    actions.supportedCollectionServices,
    parsed.collectionServiceName,
  );
  if (!collectionServiceId) {
    return failure(
      'push_lab_booking_to_patient',
      'No supported lab collection service is linked to this order.',
      { orderId: order.id },
    );
  }

  const patientLabel = order.customerName ?? parsed.customerName ?? 'patient';
  const testLabel = order.displayNames ?? 'lab tests';
  if (!confirmed) {
    return success(
      'push_lab_booking_to_patient',
      `Ready to push a lab collection booking link to ${patientLabel} for ${testLabel}. Confirm to send.`,
      {
        requiresConfirmation: true,
        orderId: order.id,
        customerName: patientLabel,
        collectionServiceId,
      },
    );
  }

  const employeeId = resolveSessionEmployeeId(params) ?? null;
  const result =
    await deps.clinicTestOrderBookingRequestService.pushBookingRequestToPatient(
      businessId,
      order.id,
      collectionServiceId,
      employeeId,
    );

  return success(
    'push_lab_booking_to_patient',
    `Pushed lab collection booking request to ${patientLabel} for ${testLabel}.`,
    { orderId: order.id, actions: result },
  );
}

export async function handleStaffBookLabCollectionLogic(
  deps: ClinicLabBookingLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
  confirmed = false,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('staff_book_lab_collection', 'Business not found.');
  }

  const nonClinicType = assertClinicLabBookingBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'staff_book_lab_collection',
      'Staff lab collection booking is only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const timeZone = business.timezone ?? 'UTC';
  const parsed =
    parseStaffBookLabCollectionFromPrompt(effectivePrompt, params, timeZone) ??
    parseStaffBookLabCollectionFromPrompt(effectivePrompt, {}, timeZone);
  if (!parsed) {
    return clarify(
      'staff_book_lab_collection',
      'Which patient lab order should I book collection for?',
      ['customerName', 'orderId'],
    );
  }

  if (!parsed.startTime) {
    return clarify(
      'staff_book_lab_collection',
      'What date and time should I book the lab collection?',
      ['date', 'timeSlot'],
      {
        customerName: parsed.customerName ?? null,
        orderId: parsed.orderId ?? null,
      },
    );
  }

  const employeeId = parsed.employeeId ?? resolveSessionEmployeeId(params);
  if (!employeeId) {
    return clarify(
      'staff_book_lab_collection',
      'Which staff member should perform the lab collection?',
      ['employeeId', 'employeeName'],
      { startTime: parsed.startTime },
    );
  }

  const order = await resolveOrderForAction(
    deps,
    businessId,
    userId,
    parsed,
    false,
  );
  if (!order) {
    return failure(
      'staff_book_lab_collection',
      'No matching lab order was found for that patient or order id.',
      {
        customerName: parsed.customerName ?? null,
        orderId: parsed.orderId ?? null,
      },
    );
  }

  const actions =
    await deps.clinicTestOrderBookingRequestService.getOrderBookingActions(
      businessId,
      order.id,
    );
  if (!actions.canStaffBook) {
    return failure(
      'staff_book_lab_collection',
      'This lab order cannot have a staff-booked collection right now.',
      { orderId: order.id, status: actions.status },
    );
  }

  const collectionServiceId = pickCollectionServiceId(
    actions.supportedCollectionServices,
    parsed.collectionServiceName,
  );
  if (!collectionServiceId) {
    return failure(
      'staff_book_lab_collection',
      'No supported lab collection service is linked to this order.',
      { orderId: order.id },
    );
  }

  const patientLabel = order.customerName ?? parsed.customerName ?? 'patient';
  const testLabel = order.displayNames ?? 'lab tests';
  if (!confirmed) {
    return success(
      'staff_book_lab_collection',
      `Ready to book lab collection for ${patientLabel} (${testLabel}) at ${parsed.startTime}. Confirm to create the appointment.`,
      {
        requiresConfirmation: true,
        orderId: order.id,
        customerName: patientLabel,
        employeeId,
        startTime: parsed.startTime,
        collectionServiceId,
      },
    );
  }

  const actorEmployeeId = resolveSessionEmployeeId(params) ?? null;
  const result =
    await deps.clinicTestOrderBookingRequestService.bookCollectionForOrder(
      businessId,
      order.id,
      collectionServiceId,
      employeeId,
      parsed.startTime,
      actorEmployeeId,
      userId,
    );

  return success(
    'staff_book_lab_collection',
    `Booked lab collection for ${patientLabel} (${testLabel}).`,
    {
      orderId: order.id,
      collectionBookingId: result.collectionBookingId,
      actions: result,
    },
  );
}

export async function handleListMyLabBookingRequestsLogic(
  deps: ClinicLabBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('list_my_lab_booking_requests', 'Business not found.');
  }

  const nonClinicType = assertClinicLabBookingBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'list_my_lab_booking_requests',
      'Lab booking requests are only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'list_my_lab_booking_requests',
      'Sign in to view lab appointments you need to book.',
      { clarify: true, missing: ['customerId'] },
    );
  }

  const parsed =
    parseListMyLabBookingRequestsFromPrompt(effectivePrompt, params) ??
    parseListMyLabBookingRequestsFromPrompt(effectivePrompt);
  if (!parsed) {
    return failure(
      'list_my_lab_booking_requests',
      'Tell me which lab booking requests you want to see.',
      { clarify: true },
    );
  }

  const requests =
    await deps.clinicTestOrderBookingRequestService.listPendingBookingRequestsForCustomer(
      businessId,
      customerId,
    );

  return success(
    'list_my_lab_booking_requests',
    formatLabBookingRequestsSummary(requests),
    { customerId, count: requests.length, requests },
  );
}

export async function handleBookLabCollectionLogic(
  deps: ClinicLabBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('book_lab_collection', 'Business not found.');
  }

  const nonClinicType = assertClinicLabBookingBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'book_lab_collection',
      'Lab collection booking is only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'book_lab_collection',
      'Sign in to book your lab collection appointment.',
      { clarify: true, missing: ['customerId'] },
    );
  }

  const parsed =
    parseBookLabCollectionFromPrompt(effectivePrompt, params) ??
    parseBookLabCollectionFromPrompt(effectivePrompt);
  if (!parsed) {
    return failure(
      'book_lab_collection',
      'Tell me which lab collection you want to book.',
      { clarify: true },
    );
  }

  let requests =
    await deps.clinicTestOrderBookingRequestService.listPendingBookingRequestsForCustomer(
      businessId,
      customerId,
    );

  if (parsed.orderId) {
    requests = requests.filter(
      (request) =>
        request.orderId === parsed.orderId ||
        request.orderId.startsWith(parsed.orderId!),
    );
  }
  if (parsed.testName) {
    const needle = parsed.testName.toLowerCase();
    requests = requests.filter((request) =>
      (request.displayNames ?? '').toLowerCase().includes(needle),
    );
  }

  // e2e-bug.202 — named panel/order that matches nothing must abort the compound
  // (do not soft-succeed with a generic handoff).
  if (parsed.testName && requests.length === 0) {
    return failure(
      'book_lab_collection',
      `I couldn't find a lab panel or pending collection request matching "${parsed.testName}".`,
      {
        clarify: true,
        missing: ['testName'],
        requestedTestName: parsed.testName,
      },
    );
  }
  if (parsed.orderId && requests.length === 0) {
    return failure(
      'book_lab_collection',
      `I couldn't find a pending lab collection request for order "${parsed.orderId}".`,
      {
        clarify: true,
        missing: ['orderId'],
        requestedOrderId: parsed.orderId,
      },
    );
  }

  const primary = requests[0] ?? null;
  const bookingFirstAvailable = params.bookingFirstAvailable === true;
  const bookUrl = primary?.bookUrl
    ? appendBookingFirstAvailableToLabBookUrl(
        primary.bookUrl,
        bookingFirstAvailable,
      )
    : null;

  return success(
    'book_lab_collection',
    formatBookLabCollectionSummary(requests, { bookingFirstAvailable }),
    {
      customerId,
      count: requests.length,
      requests,
      bookUrl,
      orderId: primary?.orderId ?? null,
      bookingFirstAvailable,
    },
  );
}

export async function handleListPatientPendingLabRequestsLogic(
  deps: ClinicLabBookingLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('list_patient_pending_lab_requests', 'Business not found.');
  }

  const nonClinicType = assertClinicLabBookingBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'list_patient_pending_lab_requests',
      'Pending lab booking requests are only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const employeeId = resolveSessionEmployeeId(params);
  const filters: ClinicLabQueueFilters = { awaitingPatientBooking: true };
  if (employeeId) filters.employeeId = employeeId;

  const scopedFilters = await deps.clinicLabAccessService.scopeLabQueueFilters(
    businessId,
    userId,
    filters,
  );
  const orders = await deps.clinicTestOrderService.listLabQueue(
    businessId,
    scopedFilters,
  );

  return success(
    'list_patient_pending_lab_requests',
    formatPendingPatientLabRequestsSummary(orders),
    { count: orders.length, orders, filters: scopedFilters },
  );
}
