import {
  BookingStatus,
  type Booking,
} from '../booking/entities/booking.entity.js';
import {
  formatDateDisplay,
  formatTimeRangeDisplay,
} from '../../common/utils/date-format.util.js';
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
  parseConfirmMyBookingDetailsFromPrompt,
  type ParsedConfirmMyBookingDetails,
} from './ai-confirm-my-booking-details.util.js';
import type { ConfirmMyBookingDetailsAspect } from './ai-confirm-my-booking-details.fixtures.js';
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

function buildBookingDetails(booking: Booking, businessName: string | null) {
  const serviceName = booking.service?.name ?? null;
  const providerName = booking.employee?.name ?? null;
  return {
    bookingId: booking.id,
    status: booking.status,
    serviceId: booking.serviceId,
    serviceName,
    employeeId: booking.employeeId,
    employeeName: providerName,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    businessName,
  };
}

function buildAspectSummary(
  aspect: ConfirmMyBookingDetailsAspect,
  booking: Booking,
  businessName: string | null,
  businessAddress: string | null,
  locale?: string,
): string {
  const serviceName = booking.service?.name ?? 'your service';
  const providerName = booking.employee?.name ?? 'your provider';
  const when = `${formatDateDisplay(booking.startTime, locale)} ${formatTimeRangeDisplay(booking.startTime, booking.endTime, locale)}`;
  const statusLabel =
    booking.status === BookingStatus.CONFIRMED
      ? 'confirmed'
      : booking.status.replace(/_/g, ' ');
  const locationLine = businessAddress
    ? `${businessName ?? 'The salon'} — ${businessAddress}`
    : (businessName ?? 'the salon');

  if (aspect === 'time') {
    return `Your ${serviceName} appointment is scheduled for ${when}.`;
  }
  if (aspect === 'service') {
    return `Your booking is for ${serviceName}.`;
  }
  if (aspect === 'provider') {
    return `Your appointment is with ${providerName}.`;
  }
  if (aspect === 'status') {
    return `Your booking is ${statusLabel} for ${serviceName} on ${when}.`;
  }
  if (aspect === 'location') {
    return `Your appointment is at ${locationLine}.`;
  }

  return `Your booking is ${statusLabel}: ${serviceName} with ${providerName} on ${when} at ${locationLine}.`;
}

async function resolveBookingForConfirmDetails(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string,
  parsed: ParsedConfirmMyBookingDetails,
): Promise<{ booking: Booking | null; ambiguous: Booking[] }> {
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
      relations: { employee: true, service: true },
    });
    return { booking: booking ?? null, ambiguous: [] };
  }

  if (!customerId) {
    return { booking: null, ambiguous: [] };
  }

  const enrichedParams = enrichRescheduleMyBookingParamsFromPrompt(
    params,
    prompt,
    String(params._timeZone ?? 'UTC'),
  );
  const matchParams = buildRescheduleOwnedBookingMatchParams(enrichedParams);
  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      customerId,
      status: BookingStatus.CONFIRMED,
    },
    relations: { employee: true, service: true },
    order: { startTime: 'ASC' },
  });

  const matched = matchCustomerOwnedBooking(
    bookings as CustomerOwnedBookingMatchInput[],
    matchParams,
    '',
    String(params._timeZone ?? 'UTC'),
    { allowFirstWhenUnspecified: true },
  );
  return {
    booking: matched.booking as Booking | null,
    ambiguous: matched.ambiguous as Booking[],
  };
}

export async function handleConfirmMyBookingDetailsLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseConfirmMyBookingDetailsFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'confirm_my_booking_details',
      'Ask about your booking details (e.g. "What time is my appointment?" or "Summarize my booking").',
      { clarify: true, missing: ['aspect'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('confirm_my_booking_details', 'Business not found.');
  }

  const resolved = await resolveBookingForConfirmDetails(
    deps,
    businessId,
    params,
    String(prompt ?? params._prompt ?? ''),
    parsed,
  );

  if (resolved.ambiguous.length > 1) {
    return failure(
      'confirm_my_booking_details',
      'You have more than one upcoming appointment. Name the service or date so I can summarize the right booking.',
      {
        clarify: true,
        missing: ['bookingId'],
        candidates: resolved.ambiguous.map((row) => ({
          bookingId: row.id,
          serviceName: row.service?.name,
          startTime: row.startTime.toISOString(),
        })),
      },
    );
  }

  if (!resolved.booking) {
    return failure(
      'confirm_my_booking_details',
      resolveSessionCustomerId(params)
        ? 'I could not find an upcoming booking to summarize. Finish checkout or pick an appointment from your account.'
        : 'Finish booking or sign in so I can read your appointment details from the session.',
      {
        clarify: true,
        missing: ['bookingId'],
        navigate: resolveSessionCustomerId(params)
          ? { path: 'account', query: { tab: 'bookings' } }
          : undefined,
      },
    );
  }

  const locale =
    typeof params.locale === 'string' ? params.locale.trim() : undefined;
  const summary = buildAspectSummary(
    parsed.aspect,
    resolved.booking,
    business.name ?? null,
    business.address ?? null,
    locale,
  );

  return success('confirm_my_booking_details', summary, {
    aspect: parsed.aspect,
    ...buildBookingDetails(resolved.booking, business.name ?? null),
    navigate: {
      path: 'account',
      query: { tab: 'bookings', bookingId: resolved.booking.id },
    },
  });
}
