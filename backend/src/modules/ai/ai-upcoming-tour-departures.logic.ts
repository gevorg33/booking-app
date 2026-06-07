import type { BookingService } from '../booking/booking.service.js';
import type { ServiceService } from '../service/service.service.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  formatDateDisplay,
  getTodayDateKey,
} from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { resolveTourBookingDateRange } from '../../common/utils/tour-calendar.util.js';
import {
  extractTourBookingMetadata,
  extractTourMetadata,
  isTourService,
  resolveRemainingTourSpots,
  sumBookedTourPax,
} from '../../common/utils/tour-service.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseListUpcomingTourDeparturesFromPrompt,
  type ParsedListUpcomingTourDepartures,
} from './ai-upcoming-tour-departures.util.js';

export interface UpcomingTourDeparturesLogicDeps {
  serviceService: Pick<ServiceService, 'findAll'>;
  bookingService: Pick<BookingService, 'findAll'>;
}

const CONFIRMED_TOUR_STATUSES = new Set<BookingStatus>([
  BookingStatus.CONFIRMED,
]);

export interface TourDepartureSummary {
  serviceId: string;
  serviceName: string;
  departureDate: string;
  tourEndDate: string;
  bookedPax: number;
  bookingCount: number;
  maxGroupSize: number | null;
  remainingCapacity: number | null;
  bookings: Array<{
    bookingId: string;
    customerName: string | null;
    paxCount: number;
  }>;
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

function resolveServiceByName<T extends { id: string; name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const needle = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}

function isConfirmedTourBooking(
  booking: {
    status: BookingStatus;
    metadata?: Record<string, unknown> | null;
    startTime: Date;
    serviceId: string;
    service?: {
      metadata?: Record<string, unknown> | null;
      name?: string;
    } | null;
  },
  tourServiceIds: Set<string>,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  if (!CONFIRMED_TOUR_STATUSES.has(booking.status)) return false;
  const isTourBooking =
    tourServiceIds.has(booking.serviceId) ||
    isTourService(booking.service?.metadata ?? null) ||
    Boolean(extractTourBookingMetadata(booking.metadata).tourStartDate);
  if (!isTourBooking) return false;

  const range = resolveTourBookingDateRange({
    metadata: booking.metadata,
    startTime: booking.startTime,
  });
  if (range) {
    return range.tourEndDate >= rangeStart && range.tourStartDate <= rangeEnd;
  }
  const dayKey = booking.startTime.toISOString().slice(0, 10);
  return dayKey >= rangeStart && dayKey <= rangeEnd;
}

function aggregateDepartures(
  bookings: Array<{
    id: string;
    serviceId: string;
    metadata?: Record<string, unknown> | null;
    startTime: Date;
    endTime: Date;
    customer?: { name?: string | null } | null;
    service?: { name?: string | null } | null;
  }>,
  maxGroupByServiceId: Map<string, number | null>,
): TourDepartureSummary[] {
  const grouped = new Map<string, TourDepartureSummary>();

  for (const booking of bookings) {
    const tourMeta = extractTourBookingMetadata(booking.metadata);
    const range = resolveTourBookingDateRange({
      metadata: booking.metadata,
      startTime: booking.startTime,
    }) ?? {
      tourStartDate: booking.startTime.toISOString().slice(0, 10),
      tourEndDate: booking.endTime.toISOString().slice(0, 10),
    };
    const departureDate = range.tourStartDate;
    const key = `${booking.serviceId}:${departureDate}`;
    const paxCount = tourMeta.paxCount ?? 1;
    const existing = grouped.get(key);

    if (existing) {
      existing.bookedPax += paxCount;
      existing.bookingCount += 1;
      existing.bookings.push({
        bookingId: booking.id,
        customerName: booking.customer?.name ?? null,
        paxCount,
      });
      continue;
    }

    const maxGroupSize = maxGroupByServiceId.get(booking.serviceId) ?? null;
    grouped.set(key, {
      serviceId: booking.serviceId,
      serviceName: booking.service?.name ?? 'Tour',
      departureDate,
      tourEndDate: range.tourEndDate,
      bookedPax: paxCount,
      bookingCount: 1,
      maxGroupSize,
      remainingCapacity: null,
      bookings: [
        {
          bookingId: booking.id,
          customerName: booking.customer?.name ?? null,
          paxCount,
        },
      ],
    });
  }

  const departures = [...grouped.values()].map((departure) => ({
    ...departure,
    remainingCapacity: resolveRemainingTourSpots(
      departure.maxGroupSize ?? undefined,
      departure.bookedPax,
    ),
  }));

  return departures.sort((a, b) =>
    a.departureDate === b.departureDate
      ? a.serviceName.localeCompare(b.serviceName)
      : a.departureDate.localeCompare(b.departureDate),
  );
}

function formatDepartureLine(departure: TourDepartureSummary): string {
  const day = formatDateDisplay(departure.departureDate);
  const capacity =
    departure.remainingCapacity != null
      ? `${departure.bookedPax} pax booked, ${departure.remainingCapacity} remaining (max ${departure.maxGroupSize})`
      : `${departure.bookedPax} pax booked (${departure.bookingCount} booking${departure.bookingCount === 1 ? '' : 's'}, no max group cap)`;
  return `${day}: ${departure.serviceName} — ${capacity}`;
}

function buildSummary(
  parsed: ParsedListUpcomingTourDepartures,
  departures: TourDepartureSummary[],
): string {
  const filterNote = parsed.serviceName ? ` for "${parsed.serviceName}"` : '';
  const daysAhead = parsed.daysAhead ?? 30;

  if (departures.length === 0) {
    return `No confirmed tour departures in the next ${daysAhead} days${filterNote}.`;
  }

  return `${departures.length} confirmed tour departure${departures.length === 1 ? '' : 's'} in the next ${daysAhead} days${filterNote}: ${departures.map(formatDepartureLine).join('; ')}.`;
}

export async function handleListUpcomingTourDeparturesLogic(
  deps: UpcomingTourDeparturesLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseListUpcomingTourDeparturesFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'list_upcoming_tour_departures',
      'Ask to list upcoming tour departures (e.g. "List upcoming tour departures with pax and remaining capacity" or "Summarize confirmed departures by date").',
      { clarify: true },
    );
  }

  const allServices = await deps.serviceService.findAll(businessId);
  const tourServices = allServices.filter((service) =>
    isTourService((service.metadata ?? {}) as Record<string, unknown>),
  );

  let scopedServices = tourServices;
  if (parsed.serviceId) {
    scopedServices = tourServices.filter(
      (service) => service.id === parsed.serviceId,
    );
  } else if (parsed.serviceName) {
    const match = resolveServiceByName(tourServices, parsed.serviceName);
    scopedServices = match ? [match] : [];
  }

  const daysAhead = parsed.daysAhead ?? 30;
  const rangeStart = getTodayDateKey();
  const rangeEnd = addDaysToDateKey(rangeStart, daysAhead, 'UTC');
  const tourServiceIds = new Set(
    (scopedServices.length > 0 ? scopedServices : tourServices).map(
      (service) => service.id,
    ),
  );

  const maxGroupByServiceId = new Map<string, number | null>();
  for (const service of tourServices) {
    const tour = extractTourMetadata(
      (service.metadata ?? {}) as Record<string, unknown>,
    );
    maxGroupByServiceId.set(service.id, tour?.maxGroupSize ?? null);
  }

  const bookings = await deps.bookingService.findAll(
    businessId,
    undefined,
    undefined,
    false,
    rangeStart,
    rangeEnd,
  );

  const confirmedTourBookings = bookings.filter((booking) =>
    isConfirmedTourBooking(
      {
        ...booking,
        serviceId: booking.serviceId,
      },
      tourServiceIds,
      rangeStart,
      rangeEnd,
    ),
  );

  let departures = aggregateDepartures(
    confirmedTourBookings,
    maxGroupByServiceId,
  );

  if (parsed.serviceId || parsed.serviceName) {
    const allowedIds = new Set(scopedServices.map((service) => service.id));
    departures = departures.filter((departure) =>
      allowedIds.has(departure.serviceId),
    );
  }

  const summary = buildSummary(parsed, departures);

  return success('list_upcoming_tour_departures', summary, {
    daysAhead,
    serviceName: parsed.serviceName ?? null,
    serviceId: parsed.serviceId ?? null,
    departures,
    totalBookedPax: sumBookedTourPax(confirmedTourBookings),
    departureCount: departures.length,
  });
}
