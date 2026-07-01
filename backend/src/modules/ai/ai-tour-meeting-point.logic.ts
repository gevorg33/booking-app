import type { Booking } from '../booking/entities/booking.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import type { BookingService } from '../booking/booking.service.js';
import type { ServiceService } from '../service/service.service.js';
import {
  extractTourBookingMetadata,
  extractTourMetadata,
  isTourService,
} from '../../common/utils/tour-service.util.js';
import { formatDateDisplay } from '../../common/utils/date-format.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseExplainTourMeetingPointFromPrompt,
  type ParsedExplainTourMeetingPoint,
} from './ai-tour-meeting-point.util.js';
import type { TourMeetingPointAspect } from './ai-tour-meeting-point.fixtures.js';

export interface TourMeetingPointLogicDeps {
  serviceService: Pick<ServiceService, 'findAll'>;
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

function isTourBooking(booking: Booking): boolean {
  if (
    isTourService((booking.service?.metadata ?? {}) as Record<string, unknown>)
  ) {
    return true;
  }
  return Boolean(
    extractTourBookingMetadata(booking.metadata).tourStartDate ||
    extractTourBookingMetadata(booking.metadata).paxCount,
  );
}

function pickPreferredTourBooking(bookings: Booking[]): Booking | null {
  if (bookings.length === 0) return null;
  const upcoming = bookings
    .filter((booking) => booking.status === BookingStatus.CONFIRMED)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  return upcoming[0] ?? bookings[0] ?? null;
}

async function loadBookingById(
  deps: TourMeetingPointLogicDeps,
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

async function resolveTourBooking(
  deps: TourMeetingPointLogicDeps,
  businessId: string,
  parsed: ParsedExplainTourMeetingPoint,
  sessionCustomerId?: string,
): Promise<Booking | null> {
  if (parsed.bookingId) {
    const booking = await loadBookingById(deps, businessId, parsed.bookingId);
    if (!booking) return null;
    if (
      sessionCustomerId &&
      booking.customerId &&
      booking.customerId !== sessionCustomerId
    ) {
      return null;
    }
    return booking;
  }

  const bookings = await deps.bookingService.findAll(businessId);
  let tourBookings = bookings.filter(isTourBooking);

  if (sessionCustomerId) {
    tourBookings = tourBookings.filter(
      (booking) => booking.customerId === sessionCustomerId,
    );
  }

  if (parsed.serviceName) {
    const serviceNeedle = parsed.serviceName.toLowerCase();
    const matches = tourBookings.filter((booking) =>
      (booking.service?.name ?? '').toLowerCase().includes(serviceNeedle),
    );
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) return pickPreferredTourBooking(matches);
  }

  return tourBookings.length === 1
    ? tourBookings[0]
    : pickPreferredTourBooking(tourBookings);
}

function formatArrivalTime(startTime: Date, timeZone = 'UTC'): string {
  const dateKey = startTime.toISOString().slice(0, 10);
  const timeLabel = startTime.toISOString().slice(11, 16);
  return `${formatDateDisplay(dateKey)} at ${timeLabel} (${timeZone})`;
}

export function buildExplainTourMeetingPointSummary(input: {
  serviceName: string;
  meetingPoint: string | null;
  arrivalTimeIso?: string | null;
  tourStartDate?: string | null;
  aspect: TourMeetingPointAspect;
  hasBooking: boolean;
  timeZone?: string;
}): string {
  const parts: string[] = [`"${input.serviceName}"`];
  const includeMeeting =
    input.aspect === 'meeting_point' || input.aspect === 'all';
  const includeArrival =
    input.aspect === 'arrival_time' || input.aspect === 'all';

  if (includeMeeting) {
    parts.push(
      input.meetingPoint
        ? `meeting point: ${input.meetingPoint}`
        : 'no meeting point is listed for this tour yet',
    );
  }

  if (includeArrival) {
    if (input.arrivalTimeIso) {
      const startTime = new Date(input.arrivalTimeIso);
      parts.push(
        `arrive by ${formatArrivalTime(startTime, input.timeZone ?? 'UTC')}`,
      );
    } else if (input.tourStartDate) {
      parts.push(
        `departure date ${formatDateDisplay(input.tourStartDate)} — choose a slot at checkout to lock the exact arrival time`,
      );
    } else if (input.hasBooking) {
      parts.push('no departure time is stored on this booking yet');
    } else {
      parts.push(
        'book a departure slot to see the exact arrival time on your confirmation',
      );
    }
  }

  return `${parts.join(' — ')}.`;
}

export async function handleExplainTourMeetingPointLogic(
  deps: TourMeetingPointLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const parsed = parseExplainTourMeetingPointFromPrompt(
    prompt || String(params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_tour_meeting_point',
      'Ask about a tour meeting point or arrival time (e.g. "Where do we meet for my tour?" or "What time should I arrive for Mountain Trek?").',
      { clarify: true, missing: ['aspect'] },
    );
  }

  const sessionCustomerId = resolveSessionCustomerId(params);
  const booking = await resolveTourBooking(
    deps,
    businessId,
    parsed,
    sessionCustomerId,
  );

  const services = await deps.serviceService.findAll(businessId);
  const service = booking?.service
    ? booking.service
    : parsed.serviceName
      ? resolveByName(services, parsed.serviceName)
      : undefined;

  if (!service) {
    return failure(
      'explain_tour_meeting_point',
      sessionCustomerId
        ? 'I could not find a tour booking or catalog service to explain meeting details for. Name the tour or finish checkout.'
        : 'Name the tour or finish booking so I can read the meeting point and arrival time.',
      {
        clarify: true,
        missing: ['serviceName'],
      },
    );
  }

  if (
    !isTourService((service.metadata ?? {}) as Record<string, unknown>) &&
    !booking
  ) {
    return failure(
      'explain_tour_meeting_point',
      `"${service.name}" is not configured as a tour — meeting point applies to tour services only.`,
      { serviceName: service.name, serviceId: service.id },
    );
  }

  const tourMeta = extractTourMetadata(
    (service.metadata ?? {}) as Record<string, unknown>,
  );
  const bookingMeta = booking
    ? extractTourBookingMetadata(booking.metadata)
    : null;

  const summary = buildExplainTourMeetingPointSummary({
    serviceName: service.name,
    meetingPoint: tourMeta?.meetingPoint ?? null,
    arrivalTimeIso: booking?.startTime?.toISOString() ?? null,
    tourStartDate: bookingMeta?.tourStartDate ?? null,
    aspect: parsed.aspect,
    hasBooking: Boolean(booking),
    timeZone: String(params._timeZone ?? params.timeZone ?? 'UTC'),
  });

  return success('explain_tour_meeting_point', summary, {
    aspect: parsed.aspect,
    bookingId: booking?.id ?? null,
    serviceId: service.id,
    serviceName: service.name,
    meetingPoint: tourMeta?.meetingPoint ?? null,
    arrivalTime: booking?.startTime?.toISOString() ?? null,
    tourStartDate: bookingMeta?.tourStartDate ?? null,
    navigate: {
      path: 'booking',
      query: {
        serviceId: service.id,
        ...(booking?.id ? { bookingId: booking.id } : {}),
      },
    },
  });
}
