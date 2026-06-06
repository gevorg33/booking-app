import type { Booking } from '../booking/entities/booking.entity.js';
import type { BookingService } from '../booking/booking.service.js';
import { formatDateDisplay } from '../../common/utils/date-format.util.js';
import {
  extractTourBookingMetadata,
  extractTourMetadata,
  isTourService,
} from '../../common/utils/tour-service.util.js';
import {
  resolveTourBookingDateRange,
  tourBookingOverlapsDateRange,
} from '../../common/utils/tour-calendar.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseExplainTourBookingRecordFromPrompt,
  type ParsedExplainTourBookingRecord,
  type TourBookingRecordAspect,
} from './ai-tour-booking-record.util.js';

export interface TourBookingRecordLogicDeps {
  bookingService: Pick<BookingService, 'findAll' | 'findOne'>;
}

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

function isTourBooking(booking: Booking): boolean {
  if (isTourService((booking.service?.metadata ?? {}) as Record<string, unknown>)) {
    return true;
  }
  return Boolean(
    extractTourBookingMetadata(booking.metadata).tourStartDate ||
      extractTourBookingMetadata(booking.metadata).paxCount,
  );
}

async function loadBookingById(
  deps: TourBookingRecordLogicDeps,
  businessId: string,
  bookingId: string,
): Promise<Booking | null> {
  try {
    const booking = await deps.bookingService.findOne(bookingId);
    return booking.businessId === businessId ? booking : null;
  } catch {
    return null;
  }
}

async function resolveBooking(
  deps: TourBookingRecordLogicDeps,
  businessId: string,
  parsed: ParsedExplainTourBookingRecord,
): Promise<Booking | null> {
  if (parsed.bookingId) {
    return loadBookingById(deps, businessId, parsed.bookingId);
  }

  const bookings = await deps.bookingService.findAll(businessId);
  const tourBookings = bookings.filter(isTourBooking);

  if (parsed.customerName) {
    const needle = parsed.customerName.toLowerCase();
    const matches = tourBookings.filter((booking) =>
      (booking.customer?.name ?? '').toLowerCase().includes(needle),
    );
    if (matches.length === 1) return matches[0];
    if (parsed.serviceName) {
      const serviceNeedle = parsed.serviceName.toLowerCase();
      const narrowed = matches.filter((booking) =>
        (booking.service?.name ?? '').toLowerCase().includes(serviceNeedle),
      );
      if (narrowed.length === 1) return narrowed[0];
    }
    if (matches.length > 0) return matches[0];
  }

  if (parsed.serviceName) {
    const serviceNeedle = parsed.serviceName.toLowerCase();
    const matches = tourBookings.filter((booking) =>
      (booking.service?.name ?? '').toLowerCase().includes(serviceNeedle),
    );
    if (matches.length === 1) return matches[0];
  }

  return tourBookings.length === 1 ? tourBookings[0] : null;
}

function formatDateRange(start: string, end: string): string {
  const startLabel = formatDateDisplay(start);
  const endLabel = formatDateDisplay(end);
  return start === end ? startLabel : `${startLabel}–${endLabel}`;
}

function buildAspectSummary(
  booking: Booking,
  aspect: TourBookingRecordAspect,
  details: {
    paxCount: number | null;
    tourStartDate: string;
    tourEndDate: string;
    specialRequirements: string | null;
    calendarSpanDays: number;
  },
): string {
  const label = booking.service?.name ?? 'Tour booking';
  const customer = booking.customer?.name ?? 'the customer';
  const parts: string[] = [];

  if (aspect === 'all' || aspect === 'paxCount') {
    parts.push(
      details.paxCount != null
        ? `paxCount ${details.paxCount}`
        : 'paxCount not stored (defaults to 1 at checkout)',
    );
  }

  if (aspect === 'all' || aspect === 'dates') {
    parts.push(
      `tourStartDate ${details.tourStartDate}, tourEndDate ${details.tourEndDate} (${formatDateRange(details.tourStartDate, details.tourEndDate)})`,
    );
  }

  if (aspect === 'all' || aspect === 'specialRequirements') {
    parts.push(
      details.specialRequirements
        ? `specialRequirements "${details.specialRequirements}"`
        : 'no specialRequirements stored',
    );
  }

  if (aspect === 'all' || aspect === 'calendarSpan') {
    if (details.calendarSpanDays >= 2) {
      parts.push(
        `provider calendar shows this booking on each day from ${formatDateRange(details.tourStartDate, details.tourEndDate)} because vert-tour-1.10 overlaps tourStartDate–tourEndDate across calendar weeks`,
      );
    } else {
      parts.push(
        'provider calendar treats this as a single-day tour span (tourStartDate equals tourEndDate)',
      );
    }
  }

  return `"${label}" for ${customer} (booking ${booking.id}) — ${parts.join('; ')}.`;
}

export async function handleExplainTourBookingRecordLogic(
  deps: TourBookingRecordLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainTourBookingRecordFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_tour_booking_record',
      'Ask about one tour booking record (e.g. "Explain pax and tour dates on booking bk-1" or "Why does this tour span multiple days on the calendar?").',
      {
        clarify: true,
        missing: ['bookingId', 'customerName', 'aspect'],
      },
    );
  }

  const booking = await resolveBooking(deps, businessId, parsed);
  if (!booking) {
    return failure(
      'explain_tour_booking_record',
      parsed.bookingId
        ? `Could not find tour booking "${parsed.bookingId}".`
        : 'Specify which tour booking to explain (booking ID, or customer name when unambiguous).',
      {
        clarify: !parsed.bookingId,
        bookingId: parsed.bookingId ?? null,
        customerName: parsed.customerName ?? null,
      },
    );
  }

  if (!isTourBooking(booking)) {
    return failure(
      'explain_tour_booking_record',
      `Booking ${booking.id} is not a tour booking — no tourStartDate / pax metadata to explain.`,
      { bookingId: booking.id },
    );
  }

  const tourMeta = extractTourBookingMetadata(booking.metadata);
  const range =
    resolveTourBookingDateRange({
      metadata: booking.metadata,
      startTime: booking.startTime,
    }) ?? {
      tourStartDate: booking.startTime.toISOString().slice(0, 10),
      tourEndDate: booking.endTime.toISOString().slice(0, 10),
    };

  const tourServiceMeta = extractTourMetadata(
    (booking.service?.metadata ?? {}) as Record<string, unknown>,
  );
  const calendarSpanDays =
    range.tourStartDate === range.tourEndDate
      ? 1
      : Math.max(
          1,
          Math.round(
            (new Date(`${range.tourEndDate}T12:00:00.000Z`).getTime() -
              new Date(`${range.tourStartDate}T12:00:00.000Z`).getTime()) /
              86400000,
          ) + 1,
        );

  const summary = buildAspectSummary(booking, parsed.aspect, {
    paxCount: tourMeta.paxCount ?? null,
    tourStartDate: range.tourStartDate,
    tourEndDate: range.tourEndDate,
    specialRequirements: tourMeta.specialRequirements ?? null,
    calendarSpanDays,
  });

  return success('explain_tour_booking_record', summary, {
    bookingId: booking.id,
    customerName: booking.customer?.name ?? null,
    serviceId: booking.serviceId,
    serviceName: booking.service?.name ?? null,
    aspect: parsed.aspect,
    paxCount: tourMeta.paxCount ?? null,
    tourStartDate: range.tourStartDate,
    tourEndDate: range.tourEndDate,
    specialRequirements: tourMeta.specialRequirements ?? null,
    calendarSpanDays,
    dayLevelBooking: tourServiceMeta
      ? isTourService((booking.service?.metadata ?? {}) as Record<string, unknown>)
      : null,
    overlapsProviderCalendarWeek: tourBookingOverlapsDateRange(
      { metadata: booking.metadata, startTime: booking.startTime },
      range.tourStartDate,
      range.tourEndDate,
    ),
  });
}
