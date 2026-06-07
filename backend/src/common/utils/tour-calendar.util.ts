import { extractTourBookingMetadata } from './tour-service.util.js';
import { addDaysToDateKey } from './timezone.util.js';

/** Inclusive YYYY-MM-DD range overlap (lexicographic dates are safe). */
export function dateKeysOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export function resolveTourBookingDateRange(input: {
  metadata?: Record<string, unknown> | null;
  startTime: Date;
}): { tourStartDate: string; tourEndDate: string } | null {
  const tour = extractTourBookingMetadata(input.metadata);
  if (tour.tourStartDate) {
    return {
      tourStartDate: tour.tourStartDate,
      tourEndDate: tour.tourEndDate ?? tour.tourStartDate,
    };
  }
  return null;
}

export function tourBookingOverlapsDateRange(
  input: {
    metadata?: Record<string, unknown> | null;
    startTime: Date;
  },
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const tourRange = resolveTourBookingDateRange(input);
  if (tourRange) {
    return dateKeysOverlap(
      tourRange.tourStartDate,
      tourRange.tourEndDate,
      rangeStart,
      rangeEnd,
    );
  }
  const dayKey = input.startTime.toISOString().slice(0, 10);
  return dayKey >= rangeStart && dayKey <= rangeEnd;
}

/** Provider calendar palette (vert-tour-1.10) — stable order per serviceId. */
export const TOUR_SERVICE_COLORS = [
  'blue',
  'violet',
  'pink',
  'cyan',
  'yellow',
  'teal',
  'rose',
  'indigo',
  'lime',
  'fuchsia',
] as const;

export interface CalendarWeekBooking {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  serviceId?: string | null;
  service?: { id?: string; name?: string | null } | null;
  customer?: { name?: string | null } | null;
  metadata?: Record<string, unknown> | null;
}

export interface TourCalendarSpan {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  customerName: string | null;
  status: string;
  tourStartDate: string;
  tourEndDate: string;
  paxCount: number | null;
  specialRequirements: string | null;
  colStart: number;
  colEnd: number;
  lane: number;
}

export function isTourCalendarBooking(booking: CalendarWeekBooking): boolean {
  return resolveTourBookingDateRange(booking) !== null;
}

/** Monday-based week of 7 YYYY-MM-DD keys containing anchorDateKey. */
export function buildWeekDateKeys(
  anchorDateKey: string,
  timeZone = 'UTC',
): string[] {
  const anchor = new Date(`${anchorDateKey}T12:00:00.000Z`);
  const day = anchor.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const mondayKey = addDaysToDateKey(anchorDateKey, mondayOffset, timeZone);
  return Array.from({ length: 7 }, (_, i) =>
    addDaysToDateKey(mondayKey, i, timeZone),
  );
}

export function computeWeekColumnSpan(
  tourStartDate: string,
  tourEndDate: string,
  weekDateKeys: string[],
): { colStart: number; colEnd: number } | null {
  if (weekDateKeys.length === 0) return null;
  const weekStart = weekDateKeys[0];
  const weekEnd = weekDateKeys[weekDateKeys.length - 1];
  if (!dateKeysOverlap(tourStartDate, tourEndDate, weekStart, weekEnd)) {
    return null;
  }

  const visibleStart = tourStartDate < weekStart ? weekStart : tourStartDate;
  const visibleEnd = tourEndDate > weekEnd ? weekEnd : tourEndDate;

  const colStart = weekDateKeys.indexOf(visibleStart);
  const colEnd = weekDateKeys.indexOf(visibleEnd);
  if (colStart < 0 || colEnd < 0) return null;
  return { colStart, colEnd };
}

export function assignTourSpanLanes(
  spans: Array<Pick<TourCalendarSpan, 'colStart' | 'colEnd'>>,
): number[] {
  const lanes: Array<{ colEnd: number }> = [];
  return spans.map((span) => {
    let lane = 0;
    while (lane < lanes.length && span.colStart <= lanes[lane].colEnd) {
      lane += 1;
    }
    if (lane === lanes.length) {
      lanes.push({ colEnd: span.colEnd });
    } else {
      lanes[lane].colEnd = span.colEnd;
    }
    return lane;
  });
}

export function buildTourCalendarSpans(
  bookings: CalendarWeekBooking[],
  weekDateKeys: string[],
): TourCalendarSpan[] {
  const raw = bookings
    .filter(isTourCalendarBooking)
    .map((booking) => {
      const range = resolveTourBookingDateRange(booking)!;
      const placement = computeWeekColumnSpan(
        range.tourStartDate,
        range.tourEndDate,
        weekDateKeys,
      );
      if (!placement) return null;
      const tour = extractTourBookingMetadata(booking.metadata);
      const serviceId = booking.serviceId ?? booking.service?.id ?? booking.id;
      return {
        bookingId: booking.id,
        serviceId,
        serviceName: booking.service?.name ?? 'Tour',
        customerName: booking.customer?.name ?? null,
        status: booking.status,
        tourStartDate: range.tourStartDate,
        tourEndDate: range.tourEndDate,
        paxCount: tour.paxCount ?? null,
        specialRequirements: tour.specialRequirements ?? null,
        colStart: placement.colStart,
        colEnd: placement.colEnd,
        lane: 0,
      };
    })
    .filter((span): span is TourCalendarSpan => span !== null)
    .sort((a, b) => a.colStart - b.colStart || a.colEnd - b.colEnd);

  const lanes = assignTourSpanLanes(raw);
  return raw.map((span, index) => ({ ...span, lane: lanes[index] }));
}

export function buildServiceColorMap(
  serviceIds: string[],
  palette: readonly string[] = TOUR_SERVICE_COLORS,
): Record<string, string> {
  const unique = [...new Set(serviceIds.filter(Boolean))];
  const map: Record<string, string> = {};
  unique.forEach((id, i) => {
    map[id] = palette[i % palette.length];
  });
  return map;
}
