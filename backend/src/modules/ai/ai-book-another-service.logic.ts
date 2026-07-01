import {
  BookingStatus,
  type Booking,
} from '../booking/entities/booking.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import {
  buildBookAnotherServiceNavigate,
  buildBookAnotherServiceSummary,
  FRESH_BOOK_QUERY_KEY,
  FRESH_BOOK_QUERY_VALUE,
} from '../../common/utils/book-another-service.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  matchCustomerOwnedBooking,
  type CustomerOwnedBookingMatchInput,
} from './ai-cancel-my-booking.util.js';
import {
  buildRescheduleOwnedBookingMatchParams,
  enrichRescheduleMyBookingParamsFromPrompt,
} from './ai-reschedule-my-booking.util.js';
import {
  parseBookAnotherServiceFromPrompt,
  type ParsedBookAnotherService,
} from './ai-book-another-service.util.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
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

async function resolveAnchorBooking(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string,
  parsed: ParsedBookAnotherService,
): Promise<Booking | null> {
  const customerId = resolveSessionCustomerId(params);
  const bookingId =
    parsed.bookingId ?? (params.bookingId as string | undefined) ?? undefined;

  if (bookingId) {
    const booking = await deps.bookingRepo.findOne({
      where: {
        id: bookingId,
        businessId,
        ...(customerId ? { customerId } : {}),
      },
      relations: { service: true },
    });
    return booking ?? null;
  }

  if (!customerId) return null;

  const enrichedParams = enrichRescheduleMyBookingParamsFromPrompt(
    params,
    prompt,
    String(params._timeZone ?? 'UTC'),
  );
  const matchParams = buildRescheduleOwnedBookingMatchParams(enrichedParams);
  delete matchParams.serviceName;
  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      customerId,
      status: BookingStatus.CONFIRMED,
    },
    relations: { service: true },
    order: { startTime: 'DESC' },
  });

  const matched = matchCustomerOwnedBooking(
    bookings as CustomerOwnedBookingMatchInput[],
    matchParams,
    prompt,
    String(params._timeZone ?? 'UTC'),
    { allowFirstWhenUnspecified: true },
  );
  return matched.booking as Booking | null;
}

async function resolveTargetService(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  anchor: Booking | null,
  serviceName?: string,
): Promise<Service | null> {
  if (serviceName) {
    const services = await deps.serviceRepo.find({
      where: { businessId, isActive: true },
    });
    return resolveByName(services, serviceName) ?? null;
  }
  return anchor?.service ?? null;
}

export async function handleBookAnotherServiceLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const parsed = parseBookAnotherServiceFromPrompt(
    prompt || String(params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'book_another_service',
      'Ask to book another service (e.g. "Book another service same day").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('book_another_service', 'Business not found.');
  }

  const anchor = await resolveAnchorBooking(
    deps,
    businessId,
    params,
    prompt,
    parsed,
  );
  const targetService = await resolveTargetService(
    deps,
    businessId,
    anchor,
    parsed.serviceName,
  );

  const anchorDate = anchor?.startTime
    ? anchor.startTime.toISOString().slice(0, 10)
    : undefined;
  const date = parsed.sameDay ? anchorDate : undefined;

  const navigate = buildBookAnotherServiceNavigate({
    serviceId:
      targetService && parsed.serviceName ? targetService.id : undefined,
    date,
  });

  const summary = buildBookAnotherServiceSummary({
    serviceName:
      targetService && parsed.serviceName ? targetService.name : null,
    date: date ?? null,
  });

  return success('book_another_service', summary, {
    sameDay: parsed.sameDay,
    bookingId: anchor?.id ?? null,
    serviceId: targetService?.id ?? null,
    serviceName: targetService?.name ?? null,
    freshBook: FRESH_BOOK_QUERY_VALUE,
    navigate,
    resetSuccess: true,
  });
}

export { FRESH_BOOK_QUERY_KEY, FRESH_BOOK_QUERY_VALUE };
