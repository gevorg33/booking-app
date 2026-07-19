import { BookingStatus } from '../booking/entities/booking.entity.js';
import type { BookingService } from '../booking/booking.service.js';
import type { ServiceService } from '../service/service.service.js';
import { formatDateDisplay } from '../../common/utils/date-format.util.js';
import {
  clampTourPaxCount,
  extractTourMetadata,
  isTourService,
  resolveRemainingTourSpots,
  resolveTourCatalogServiceByName,
  sumBookedTourPax,
} from '../../common/utils/tour-service.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseDiagnoseTourCapacityFromPrompt,
  parseProactiveTourCapacityFromPrompt,
  type ParsedDiagnoseTourCapacity,
  type TourCapacityAspect,
} from './ai-tour-capacity.util.js';

export interface TourCapacityLogicDeps {
  serviceService: Pick<ServiceService, 'findAll'>;
  bookingService: Pick<BookingService, 'findAll'>;
}

const ACTIVE_TOUR_BOOKING_STATUSES = new Set<BookingStatus>([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
]);

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

async function countTourPaxForDate(
  deps: TourCapacityLogicDeps,
  businessId: string,
  serviceId: string,
  dateKey: string,
): Promise<number> {
  const bookings = await deps.bookingService.findAll(
    businessId,
    undefined,
    undefined,
    false,
    dateKey,
    dateKey,
  );

  const dayStart = new Date(`${dateKey}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateKey}T23:59:59.999Z`);

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

type CapacityDiagnosis = {
  maxGroupSize: number | null;
  requestedPax: number | null;
  clampedPax: number | null;
  bookedPax: number | null;
  remainingSpots: number | null;
  rejectionReason:
    | 'fullyBooked'
    | 'insufficientSpots'
    | 'clampedPax'
    | 'maxGroup'
    | null;
  checkoutMessage: string | null;
};

function diagnoseCheckoutCapacity(input: {
  maxGroupSize: number | null;
  requestedPax: number | null;
  bookedPax: number | null;
}): CapacityDiagnosis {
  const maxGroupSize = input.maxGroupSize;
  const requestedPax = input.requestedPax;
  const bookedPax = input.bookedPax;
  const clampedPax =
    requestedPax != null && maxGroupSize
      ? clampTourPaxCount(requestedPax, maxGroupSize)
      : requestedPax;
  const remainingSpots =
    maxGroupSize != null && bookedPax != null
      ? resolveRemainingTourSpots(maxGroupSize, bookedPax)
      : null;

  let rejectionReason: CapacityDiagnosis['rejectionReason'] = null;
  let checkoutMessage: string | null = null;

  if (
    requestedPax != null &&
    maxGroupSize &&
    requestedPax > maxGroupSize &&
    clampedPax === maxGroupSize
  ) {
    rejectionReason = 'clampedPax';
  }

  if (remainingSpots != null && clampedPax != null) {
    if (remainingSpots === 0) {
      rejectionReason = 'fullyBooked';
      checkoutMessage = 'This tour date is fully booked';
    } else if (clampedPax > remainingSpots) {
      rejectionReason = 'insufficientSpots';
      checkoutMessage = `Only ${remainingSpots} spot${remainingSpots === 1 ? '' : 's'} remaining for this tour date`;
    }
  } else if (
    requestedPax != null &&
    maxGroupSize &&
    requestedPax > maxGroupSize
  ) {
    rejectionReason = rejectionReason ?? 'maxGroup';
  }

  return {
    maxGroupSize,
    requestedPax,
    clampedPax,
    bookedPax,
    remainingSpots,
    rejectionReason,
    checkoutMessage,
  };
}

function buildAspectSummary(
  serviceName: string | null,
  aspect: TourCapacityAspect,
  dateKey: string | undefined,
  diagnosis: CapacityDiagnosis,
): string {
  const label = serviceName ? `"${serviceName}"` : 'Tour checkout';
  const day = dateKey
    ? formatDateDisplay(dateKey)
    : 'the selected departure date';
  const parts: string[] = [];

  if (aspect === 'all' || aspect === 'clampedPax' || aspect === 'maxGroup') {
    if (
      diagnosis.requestedPax != null &&
      diagnosis.maxGroupSize &&
      diagnosis.requestedPax > diagnosis.maxGroupSize
    ) {
      parts.push(
        `checkout clamps pax from ${diagnosis.requestedPax} to ${diagnosis.clampedPax} (max group ${diagnosis.maxGroupSize}) before validating remaining capacity`,
      );
    } else if (diagnosis.maxGroupSize) {
      parts.push(`max group size is ${diagnosis.maxGroupSize}`);
    }
  }

  if (
    aspect === 'all' ||
    aspect === 'fullyBooked' ||
    aspect === 'insufficientSpots'
  ) {
    if (diagnosis.bookedPax != null && diagnosis.maxGroupSize) {
      parts.push(
        `${diagnosis.bookedPax} pax already booked for ${day} (${diagnosis.remainingSpots ?? '?'} spots remaining of ${diagnosis.maxGroupSize})`,
      );
    }
    if (diagnosis.rejectionReason === 'fullyBooked') {
      parts.push(
        `checkout rejects the date because remainingSpots is 0 — "${diagnosis.checkoutMessage}"`,
      );
    } else if (diagnosis.rejectionReason === 'insufficientSpots') {
      parts.push(
        `checkout rejects ${diagnosis.clampedPax ?? diagnosis.requestedPax ?? 'that'} pax because only ${diagnosis.remainingSpots} spot(s) remain — "${diagnosis.checkoutMessage}"`,
      );
    }
  }

  if (parts.length === 0) {
    parts.push(
      'checkout validates tour pax by clamping to max group size, then comparing clamped pax to remainingSpots for the departure date',
    );
  }

  return `${label} — ${parts.join('; ')}.`;
}

export async function handleDiagnoseTourCapacityLogic(
  deps: TourCapacityLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const promptText = String(prompt ?? params._prompt ?? '');
  const parsed =
    params.tourGroupCheckout === true
      ? parseProactiveTourCapacityFromPrompt(promptText, params)
      : parseDiagnoseTourCapacityFromPrompt(promptText, params);
  if (!parsed) {
    return failure(
      'diagnose_tour_capacity',
      params.tourGroupCheckout === true
        ? 'Tour group checkout needs a tour name, pax count, and date to check remaining seats before booking.'
        : 'Ask why tour checkout rejected a pax count or date (e.g. "Why did checkout reject 4 people for the mountain trek?" or "Why only 2 spots remaining?").',
      { clarify: true },
    );
  }

  const services = await deps.serviceService.findAll(businessId);
  const tourServices = services.filter((service) =>
    isTourService((service.metadata ?? {}) as Record<string, unknown>),
  );

  const service = parsed.serviceId
    ? tourServices.find((item) => item.id === parsed.serviceId)
    : parsed.serviceName
      ? resolveTourCatalogServiceByName(tourServices, parsed.serviceName)
      : tourServices.length === 1
        ? tourServices[0]
        : undefined;

  if (!service) {
    return failure(
      'diagnose_tour_capacity',
      parsed.serviceName
        ? `Could not find a tour service matching "${parsed.serviceName}".`
        : 'Specify which tour service checkout rejected (service name from the booking page).',
      { clarify: !parsed.serviceName, serviceName: parsed.serviceName ?? null },
    );
  }

  const tour = extractTourMetadata(
    (service.metadata ?? {}) as Record<string, unknown>,
  );
  const maxGroupSize = tour?.maxGroupSize ?? null;

  let bookedPax: number | null = null;
  if (parsed.dateKey) {
    bookedPax = await countTourPaxForDate(
      deps,
      businessId,
      service.id,
      parsed.dateKey,
    );
  }

  const diagnosis = diagnoseCheckoutCapacity({
    maxGroupSize,
    requestedPax: parsed.requestedPax ?? null,
    bookedPax,
  });

  const summary = buildAspectSummary(
    service.name,
    parsed.aspect,
    parsed.dateKey,
    diagnosis,
  );

  return success('diagnose_tour_capacity', summary, {
    serviceId: service.id,
    serviceName: service.name,
    aspect: parsed.aspect,
    dateKey: parsed.dateKey ?? null,
    requestedPax: parsed.requestedPax ?? null,
    maxGroupSize,
    clampedPax: diagnosis.clampedPax,
    bookedPax: diagnosis.bookedPax,
    remainingSpots: diagnosis.remainingSpots,
    rejectionReason: diagnosis.rejectionReason,
    checkoutMessage: diagnosis.checkoutMessage,
  });
}
