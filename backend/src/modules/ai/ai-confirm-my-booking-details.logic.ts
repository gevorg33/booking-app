import {
  BookingStatus,
  type Booking,
} from '../booking/entities/booking.entity.js';
import {
  formatDateDisplay,
  formatTimeRangeDisplay,
} from '../../common/utils/date-format.util.js';
import { validateBookingManageToken } from '../../common/utils/booking-manage-token.util.js';
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
import { resolveManageBookingCredentials } from './ai-manage-booking-with-token.util.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import { resolveLocale, t } from '../../common/i18n/messages.js';

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
  const creds = resolveManageBookingCredentials(params, prompt);
  const bookingId =
    parsed.bookingId ??
    creds.bookingId ??
    (params.bookingId as string | undefined) ??
    undefined;
  const manageToken = creds.manageToken;

  if (bookingId) {
    // e2e-bug.128 / e2e-bug.96 — never resolve by bookingId alone.
    // Signed-in: must own the booking. Guest: require a valid manage token.
    if (customerId) {
      const booking = await deps.bookingRepo.findOne({
        where: { id: bookingId, businessId, customerId },
        relations: { employee: true, service: true },
      });
      return { booking: booking ?? null, ambiguous: [] };
    }

    if (!manageToken) {
      return { booking: null, ambiguous: [] };
    }

    const booking = await deps.bookingRepo.findOne({
      where: { id: bookingId, businessId },
      relations: { employee: true, service: true },
    });
    if (!booking || !validateBookingManageToken(booking, manageToken)) {
      return { booking: null, ambiguous: [] };
    }
    return { booking, ambiguous: [] };
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
    const customerId = resolveSessionCustomerId(params);
    const creds = resolveManageBookingCredentials(
      params,
      String(prompt ?? params._prompt ?? ''),
    );
    const guestMissingAuth =
      !customerId &&
      Boolean(creds.bookingId ?? params.bookingId) &&
      !creds.manageToken;
    const guestBadToken =
      !customerId &&
      Boolean(creds.bookingId ?? params.bookingId) &&
      Boolean(creds.manageToken);

    const clarifyLocale = resolveLocale(
      typeof params.locale === 'string' ? params.locale : undefined,
    );
    if (guestMissingAuth || guestBadToken) {
      return failure(
        'confirm_my_booking_details',
        // e2e-bug.274 — localize manage-link clarify under locale:hy|ru.
        t(clarifyLocale, 'assistant.confirmBookingManageLinkClarify'),
        {
          clarify: true,
          missing: guestMissingAuth
            ? ['manageToken']
            : ['bookingId', 'manageToken'],
        },
      );
    }

    return failure(
      'confirm_my_booking_details',
      customerId
        ? t(clarifyLocale, 'assistant.confirmBookingSignedInMissing')
        : // e2e-bug.274 / e2e-bug.259 sibling — anon clarify was English-only.
          t(clarifyLocale, 'assistant.confirmBookingAnonClarify'),
      {
        clarify: true,
        missing: ['bookingId'],
        navigate: customerId
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
