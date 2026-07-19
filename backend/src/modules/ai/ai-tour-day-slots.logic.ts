import { BookingStatus } from '../booking/entities/booking.entity.js';
import type { BookingService } from '../booking/booking.service.js';
import type { ServiceService } from '../service/service.service.js';
import { formatDateDisplay } from '../../common/utils/date-format.util.js';
import {
  extractTourMetadata,
  isDayLevelTour,
  isTourService,
  resolveRemainingTourSpots,
  resolveTourCatalogServiceByName,
  resolveTourDurationDays,
  sumBookedTourPax,
} from '../../common/utils/tour-service.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseExplainTourDaySlotsFromPrompt,
  type ParsedExplainTourDaySlots,
  type TourDaySlotsAspect,
} from './ai-tour-day-slots.util.js';

export interface TourDaySlotsLogicDeps {
  serviceService: Pick<ServiceService, 'findAll'>;
  bookingService: Pick<BookingService, 'findAll'>;
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

const ACTIVE_TOUR_BOOKING_STATUSES = new Set<BookingStatus>([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
]);

async function countTourPaxForDate(
  deps: TourDaySlotsLogicDeps,
  businessId: string,
  serviceId: string,
  dateKey: string,
): Promise<number> {
  const dayStart = new Date(`${dateKey}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateKey}T23:59:59.999Z`);
  const bookings = await deps.bookingService.findAll(
    businessId,
    undefined,
    undefined,
    false,
    dateKey,
    dateKey,
  );

  const overlapping = bookings.filter((booking) => {
    if (booking.serviceId !== serviceId) return false;
    if (!ACTIVE_TOUR_BOOKING_STATUSES.has(booking.status)) return false;
    const tourDate = (booking.metadata as Record<string, unknown> | undefined)
      ?.tourStartDate;
    if (typeof tourDate === 'string') return tourDate === dateKey;
    return booking.startTime <= dayEnd && booking.endTime >= dayStart;
  });

  return sumBookedTourPax(overlapping);
}

function buildAspectSummary(
  serviceName: string | null,
  aspect: TourDaySlotsAspect,
  details: {
    dayLevelBooking: boolean;
    durationDays: number;
    maxGroupSize: number | null;
    dateKey?: string;
    bookedPax?: number;
    remainingSpots?: number | null;
  },
): string {
  const label = serviceName ? `"${serviceName}"` : 'Day-level tours';
  const parts: string[] = [];

  if (aspect === 'all' || aspect === 'oneDeparture') {
    if (details.dayLevelBooking) {
      parts.push(
        `${label} uses day-level booking (vert-tour-1.6): the page shows one departure per calendar day — the earliest bookable guide slot — because the tour spans ${details.durationDays} day(s)`,
      );
    } else {
      parts.push(
        `${label} keeps every bookable time slot for the selected day (not day-level / multi-day collapse)`,
      );
    }
  }

  if (aspect === 'all' || aspect === 'remainingSpots') {
    if (details.maxGroupSize) {
      if (details.dateKey && details.remainingSpots != null) {
        const day = formatDateDisplay(details.dateKey);
        parts.push(
          `remainingSpots on ${day} is ${details.remainingSpots} (max group ${details.maxGroupSize}${details.bookedPax != null ? `, ${details.bookedPax} pax already booked for that departure date` : ''})`,
        );
      } else {
        parts.push(
          `remainingSpots is max group size minus pax already booked for the same departure date (hidden when no cap is configured)`,
        );
      }
    } else {
      parts.push('no max group size is set, so remainingSpots is not shown');
    }
  }

  if (aspect === 'all' || aspect === 'fullyBooked') {
    if (details.dateKey && details.remainingSpots != null) {
      const day = formatDateDisplay(details.dateKey);
      if (details.remainingSpots === 0) {
        parts.push(
          `${day} is fully booked — remainingSpots is 0, so no departure times are listed (the date-only picker defers unavailable days)`,
        );
      } else if (details.maxGroupSize) {
        parts.push(
          `${day} still has ${details.remainingSpots} spot(s); it is not fully booked`,
        );
      }
    } else {
      parts.push(
        'a departure date is fully booked when remainingSpots reaches 0 — all times for that day are hidden on the booking page',
      );
    }
  }

  return `${parts.join('; ')}.`;
}

export async function handleExplainTourDaySlotsLogic(
  deps: TourDaySlotsLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainTourDaySlotsFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_tour_day_slots',
      'Ask about tour day slots (e.g. "Why does Mountain Trek show one departure per day?" or "How many spots are left on 15/08/2026?").',
      {
        clarify: true,
        missing: ['serviceName', 'date', 'aspect'],
      },
    );
  }

  return executeExplainTourDaySlots(deps, businessId, parsed);
}

async function executeExplainTourDaySlots(
  deps: TourDaySlotsLogicDeps,
  businessId: string,
  parsed: ParsedExplainTourDaySlots,
): Promise<CommandResult> {
  const services = await deps.serviceService.findAll(businessId);
  const service = parsed.serviceId
    ? services.find((item) => item.id === parsed.serviceId)
    : parsed.serviceName
      ? resolveTourCatalogServiceByName(services, parsed.serviceName)
      : undefined;

  if (parsed.serviceName || parsed.serviceId) {
    if (!service) {
      return failure(
        'explain_tour_day_slots',
        `Could not find a catalog service matching "${parsed.serviceName ?? parsed.serviceId}".`,
        {
          clarify: !parsed.serviceName,
          serviceName: parsed.serviceName ?? null,
        },
      );
    }

    if (!isTourService((service.metadata ?? {}) as Record<string, unknown>)) {
      return failure(
        'explain_tour_day_slots',
        `"${service.name}" is not a tour — day-level departures and remainingSpots apply only to tour services.`,
        { serviceName: service.name, serviceId: service.id },
      );
    }
  }

  const tour = service
    ? extractTourMetadata((service.metadata ?? {}) as Record<string, unknown>)
    : null;
  const dayLevelBooking = service ? isDayLevelTour(service) : true;
  const durationDays = service ? resolveTourDurationDays(service) : 2;
  const maxGroupSize = tour?.maxGroupSize ?? null;

  let bookedPax: number | undefined;
  let remainingSpots: number | null | undefined;
  if (service && parsed.dateKey && maxGroupSize) {
    bookedPax = await countTourPaxForDate(
      deps,
      businessId,
      service.id,
      parsed.dateKey,
    );
    remainingSpots = resolveRemainingTourSpots(maxGroupSize, bookedPax);
  }

  const summary = buildAspectSummary(service?.name ?? null, parsed.aspect, {
    dayLevelBooking,
    durationDays,
    maxGroupSize,
    dateKey: parsed.dateKey,
    bookedPax,
    remainingSpots,
  });

  return success('explain_tour_day_slots', summary, {
    serviceId: service?.id ?? null,
    serviceName: service?.name ?? parsed.serviceName ?? null,
    aspect: parsed.aspect,
    dateKey: parsed.dateKey ?? null,
    dayLevelBooking,
    durationDays,
    maxGroupSize,
    bookedPax: bookedPax ?? null,
    remainingSpots: remainingSpots ?? null,
    fullyBooked:
      parsed.dateKey && remainingSpots != null ? remainingSpots === 0 : null,
  });
}
