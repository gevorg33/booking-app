export const TOUR_SERVICE_COLORS = [
  'bg-blue-600/25 border-blue-500/60 text-blue-300',
  'bg-violet-600/25 border-violet-500/60 text-violet-300',
  'bg-pink-600/25 border-pink-500/60 text-pink-300',
  'bg-cyan-600/25 border-cyan-500/60 text-cyan-300',
  'bg-yellow-600/25 border-yellow-500/60 text-yellow-300',
  'bg-teal-600/25 border-teal-500/60 text-teal-300',
  'bg-rose-600/25 border-rose-500/60 text-rose-300',
  'bg-indigo-600/25 border-indigo-500/60 text-indigo-300',
  'bg-lime-600/25 border-lime-500/60 text-lime-300',
  'bg-fuchsia-600/25 border-fuchsia-500/60 text-fuchsia-300',
];

export interface TourBookingMetadata {
  paxCount?: number;
  tourStartDate?: string;
  tourEndDate?: string;
  specialRequirements?: string;
}

export interface CalendarWeekBooking {
  id: string;
  startTime: string;
  endTime: string;
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

export function extractTourBookingMetadata(
  metadata: Record<string, unknown> | null | undefined,
): TourBookingMetadata {
  const result: TourBookingMetadata = {};
  if (
    typeof metadata?.paxCount === 'number' &&
    Number.isFinite(metadata.paxCount) &&
    metadata.paxCount > 0
  ) {
    result.paxCount = Math.floor(metadata.paxCount);
  }
  if (typeof metadata?.tourStartDate === 'string') {
    result.tourStartDate = metadata.tourStartDate;
  }
  if (typeof metadata?.tourEndDate === 'string') {
    result.tourEndDate = metadata.tourEndDate;
  }
  if (typeof metadata?.specialRequirements === 'string') {
    result.specialRequirements = metadata.specialRequirements;
  }
  return result;
}

export function dateKeysOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export function resolveTourBookingDateRange(
  booking: CalendarWeekBooking,
): { tourStartDate: string; tourEndDate: string } | null {
  const tour = extractTourBookingMetadata(booking.metadata);
  if (tour.tourStartDate) {
    return {
      tourStartDate: tour.tourStartDate,
      tourEndDate: tour.tourEndDate ?? tour.tourStartDate,
    };
  }
  return null;
}

export function isTourCalendarBooking(booking: CalendarWeekBooking): boolean {
  return resolveTourBookingDateRange(booking) !== null;
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

  const visibleStart =
    tourStartDate < weekStart ? weekStart : tourStartDate;
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
    while (
      lane < lanes.length &&
      span.colStart <= lanes[lane].colEnd
    ) {
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
  palette: string[] = TOUR_SERVICE_COLORS,
): Record<string, string> {
  const unique = [...new Set(serviceIds.filter(Boolean))];
  const map: Record<string, string> = {};
  unique.forEach((id, i) => {
    map[id] = palette[i % palette.length];
  });
  return map;
}

export function mergeServiceColorMaps(
  ...maps: Array<Record<string, string>>
): Record<string, string> {
  return Object.assign({}, ...maps);
}

export function formatTourSpanLabel(
  span: Pick<TourCalendarSpan, 'serviceName' | 'paxCount' | 'customerName'>,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const parts = [span.serviceName];
  if (span.paxCount) {
    parts.push(t('calendarPage.tourSpanPax', { count: span.paxCount }));
  }
  if (span.customerName) {
    parts.push(span.customerName);
  }
  return parts.join(' · ');
}

export function tourSpanRowHeight(laneCount: number): number {
  if (laneCount <= 0) return 0;
  return laneCount * 28 + 8;
}
