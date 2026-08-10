import { BadRequestException } from '@nestjs/common';
import { type Repository } from 'typeorm';
import type { BookingService } from '../booking/booking.service.js';
import type { OnboardingService } from '../onboarding/onboarding.service.js';
import { Business } from '../business/entities/business.entity.js';
import type { ServiceService } from '../service/service.service.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { resolveTourBookingDateRange } from '../../common/utils/tour-calendar.util.js';
import {
  extractTourBookingMetadata,
  extractTourMetadata,
  isTourService,
  resolveTourCatalogServiceByName,
  type TourDifficulty,
} from '../../common/utils/tour-service.util.js';
import {
  parseApplyTourPlaybookFromPrompt,
  parseConfigureTourServiceFromPrompt,
  parseExplainTourServicesFromPrompt,
  type ParsedConfigureTourService,
  type ParsedExplainTourServices,
} from './ai-tour-service.util.js';

export interface TourServiceLogicDeps {
  serviceService: Pick<ServiceService, 'findAll' | 'update'>;
  bookingService: Pick<BookingService, 'findAll' | 'findOne'>;
}

export interface TourPlaybookLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  onboardingService: Pick<OnboardingService, 'applyVerticalPlaybook'>;
}

const TOUR_OPERATOR_BUSINESS_TYPE = 'tour_operator';

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

function formatDifficulty(difficulty: TourDifficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

function buildSummary(
  serviceName: string,
  parsed: ParsedConfigureTourService,
): string {
  const parts: string[] = [];
  if (parsed.enableTour) parts.push('enabled tour mode');
  if (parsed.maxGroupSize !== undefined) {
    parts.push(`max group size ${parsed.maxGroupSize}`);
  }
  if (parsed.difficulty) {
    parts.push(`difficulty ${formatDifficulty(parsed.difficulty)}`);
  }
  if (parsed.durationDays !== undefined) {
    parts.push(`${parsed.durationDays} day(s)`);
  }
  if (parsed.meetingPoint) parts.push(`meeting point "${parsed.meetingPoint}"`);
  if (parsed.includedItems) parts.push('included items updated');
  if (parsed.coverImage) parts.push('cover image updated');
  return `Updated "${serviceName}" — ${parts.join(', ')}.`;
}

export async function handleConfigureTourServiceLogic(
  deps: TourServiceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseConfigureTourServiceFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'configure_tour_service',
      'Specify the service and tour settings to update (e.g. "Mark City Tour as a tour with max 12 people" or "Set difficulty to moderate for the mountain trek").',
      {
        clarify: true,
        missing: ['serviceName', 'maxGroupSize', 'difficulty'],
      },
    );
  }

  const services = await deps.serviceService.findAll(businessId);
  const service = parsed.serviceId
    ? services.find((item) => item.id === parsed.serviceId)
    : parsed.serviceName
      ? resolveTourCatalogServiceByName(services, parsed.serviceName)
      : undefined;

  if (!service) {
    return failure(
      'configure_tour_service',
      `Could not find a catalog service matching "${parsed.serviceName ?? parsed.serviceId}".`,
      { serviceName: parsed.serviceName, serviceId: parsed.serviceId },
    );
  }

  const existingTour = extractTourMetadata(
    (service.metadata ?? {}) as Record<string, unknown>,
  );

  const updateDto: Record<string, unknown> = {};
  if (parsed.enableTour) updateDto.serviceType = 'tour';
  if (parsed.maxGroupSize !== undefined) {
    updateDto.maxGroupSize = parsed.maxGroupSize;
  }
  if (parsed.difficulty) updateDto.difficulty = parsed.difficulty;
  if (parsed.coverImage) updateDto.coverImage = parsed.coverImage;
  if (parsed.meetingPoint) updateDto.meetingPoint = parsed.meetingPoint;
  if (parsed.includedItems) updateDto.includedItems = parsed.includedItems;
  if (parsed.durationDays !== undefined) {
    updateDto.durationDays = parsed.durationDays;
  }

  const updated = await deps.serviceService.update(service.id, updateDto);

  const tourMeta = extractTourMetadata(
    (updated.metadata ?? {}) as Record<string, unknown>,
  );

  return success('configure_tour_service', buildSummary(service.name, parsed), {
    serviceId: service.id,
    serviceName: service.name,
    wasTour: Boolean(existingTour),
    tour: tourMeta,
    applied: parsed,
  });
}

const UPCOMING_TOUR_STATUSES = new Set<BookingStatus>([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
]);

export interface TourServiceSummary {
  id: string;
  name: string;
  maxGroupSize: number | null;
  coverImage: string | null;
  difficulty: TourDifficulty | null;
  durationDays: number | null;
  meetingPoint: string | null;
}

export interface UpcomingTourBookingSummary {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  customerName: string | null;
  paxCount: number | null;
  tourStartDate: string;
  tourEndDate: string;
  status: string;
}

function formatTourServiceLine(service: TourServiceSummary): string {
  const parts = [`${service.name}`];
  if (service.maxGroupSize) parts.push(`max ${service.maxGroupSize} pax`);
  if (service.difficulty) parts.push(service.difficulty);
  if (service.durationDays) parts.push(`${service.durationDays} day(s)`);
  if (service.coverImage) parts.push(`cover ${service.coverImage}`);
  return parts.join(' — ');
}

function formatUpcomingBookingLine(
  booking: UpcomingTourBookingSummary,
): string {
  const pax = booking.paxCount ?? 1;
  const customer = booking.customerName ?? 'Guest';
  const range =
    booking.tourStartDate === booking.tourEndDate
      ? booking.tourStartDate
      : `${booking.tourStartDate}–${booking.tourEndDate}`;
  return `${range}: ${booking.serviceName} — ${customer} (${pax} pax, ${booking.status})`;
}

function buildExplainTourServicesSummary(
  parsed: ParsedExplainTourServices,
  tourServices: TourServiceSummary[],
  upcomingBookings: UpcomingTourBookingSummary[],
): string {
  const parts: string[] = [];
  const filterNote = parsed.serviceName ? ` for "${parsed.serviceName}"` : '';

  if (parsed.includeServices !== false) {
    if (tourServices.length === 0) {
      parts.push(`No tour catalog services found${filterNote}.`);
    } else {
      parts.push(
        `${tourServices.length} tour service${tourServices.length === 1 ? '' : 's'}${filterNote}: ${tourServices.map(formatTourServiceLine).join('; ')}.`,
      );
    }
  }

  if (parsed.includeBookings !== false) {
    if (upcomingBookings.length === 0) {
      parts.push(
        `No upcoming tour bookings in the next ${parsed.daysAhead ?? 30} days${filterNote}.`,
      );
    } else {
      parts.push(
        `${upcomingBookings.length} upcoming tour booking${upcomingBookings.length === 1 ? '' : 's'}${filterNote}: ${upcomingBookings.map(formatUpcomingBookingLine).join('; ')}.`,
      );
    }
  }

  return parts.join(' ');
}

function isUpcomingTourBooking(
  booking: {
    status: BookingStatus;
    metadata?: Record<string, unknown> | null;
    startTime: Date;
    service?: { metadata?: Record<string, unknown> | null } | null;
  },
  tourServiceIds: Set<string>,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  if (!UPCOMING_TOUR_STATUSES.has(booking.status)) return false;
  const serviceId = (booking as { serviceId?: string }).serviceId;
  const isTourBooking =
    (serviceId && tourServiceIds.has(serviceId)) ||
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

export async function handleExplainTourServicesLogic(
  deps: TourServiceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainTourServicesFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_tour_services',
      'Ask about tour services or upcoming departures (e.g. "List tour services with group sizes" or "Show upcoming tour bookings with pax").',
      { clarify: true },
    );
  }

  const allServices = await deps.serviceService.findAll(businessId);
  let tourServices = allServices
    .filter((service) =>
      isTourService((service.metadata ?? {}) as Record<string, unknown>),
    )
    .map((service) => {
      const tour = extractTourMetadata(
        (service.metadata ?? {}) as Record<string, unknown>,
      );
      return {
        id: service.id,
        name: service.name,
        maxGroupSize: tour?.maxGroupSize ?? null,
        coverImage: tour?.coverImage ?? null,
        difficulty: tour?.difficulty ?? null,
        durationDays: tour?.durationDays ?? null,
        meetingPoint: tour?.meetingPoint ?? null,
      };
    });

  if (parsed.serviceId) {
    tourServices = tourServices.filter(
      (service) => service.id === parsed.serviceId,
    );
  } else if (parsed.serviceName) {
    const match = resolveTourCatalogServiceByName(
      tourServices,
      parsed.serviceName,
    );
    tourServices = match ? [match] : [];
  }

  const daysAhead = parsed.daysAhead ?? 30;
  const rangeStart = getTodayDateKey();
  const rangeEnd = addDaysToDateKey(rangeStart, daysAhead, 'UTC');
  const tourServiceIds = new Set(tourServices.map((service) => service.id));

  const bookings = await deps.bookingService.findAll(
    businessId,
    undefined,
    undefined,
    false,
    rangeStart,
    rangeEnd,
  );

  const upcomingBookings = bookings
    .filter((booking) =>
      isUpcomingTourBooking(
        booking,
        tourServiceIds.size > 0
          ? tourServiceIds
          : new Set(
              allServices
                .filter((service) =>
                  isTourService(
                    (service.metadata ?? {}) as Record<string, unknown>,
                  ),
                )
                .map((service) => service.id),
            ),
        rangeStart,
        rangeEnd,
      ),
    )
    .map((booking) => {
      const tourMeta = extractTourBookingMetadata(booking.metadata);
      const range = resolveTourBookingDateRange({
        metadata: booking.metadata,
        startTime: booking.startTime,
      }) ?? {
        tourStartDate: booking.startTime.toISOString().slice(0, 10),
        tourEndDate: booking.endTime.toISOString().slice(0, 10),
      };
      return {
        bookingId: booking.id,
        serviceId: booking.serviceId,
        serviceName: booking.service?.name ?? 'Tour',
        customerName: booking.customer?.name ?? null,
        paxCount: tourMeta.paxCount ?? null,
        tourStartDate: range.tourStartDate,
        tourEndDate: range.tourEndDate,
        status: booking.status,
      };
    })
    .filter((booking) => {
      if (!parsed.serviceName && !parsed.serviceId) return true;
      if (parsed.serviceId) return booking.serviceId === parsed.serviceId;
      const match = parsed.serviceName
        ? resolveTourCatalogServiceByName(tourServices, parsed.serviceName)
        : undefined;
      return match ? booking.serviceId === match.id : false;
    })
    .sort((a, b) => a.tourStartDate.localeCompare(b.tourStartDate));

  const summary = buildExplainTourServicesSummary(
    parsed,
    tourServices,
    upcomingBookings,
  );

  return success('explain_tour_services', summary, {
    daysAhead,
    tourServices: parsed.includeServices !== false ? tourServices : [],
    upcomingBookings: parsed.includeBookings !== false ? upcomingBookings : [],
    serviceName: parsed.serviceName ?? null,
    serviceId: parsed.serviceId ?? null,
  });
}

export async function handleApplyTourPlaybookLogic(
  deps: TourPlaybookLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseApplyTourPlaybookFromPrompt(
    String(prompt ?? params._prompt ?? ''),
  );
  if (!parsed) {
    return failure(
      'apply_tour_playbook',
      'Ask to apply the tour playbook (e.g. "Apply tour playbook" or "Set up tour operator starter catalog and schedule").',
      { clarify: true },
    );
  }

  if (!userId) {
    return failure(
      'apply_tour_playbook',
      'Sign in as a team member to apply the tour playbook and create schedule slots.',
      { clarify: true, missing: ['userId'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('apply_tour_playbook', 'Business not found.');
  }

  const businessType =
    typeof business.settings?.businessType === 'string'
      ? business.settings.businessType
      : null;
  if (businessType !== TOUR_OPERATOR_BUSINESS_TYPE) {
    return failure(
      'apply_tour_playbook',
      `Tour playbook applies to tour_operator businesses — this salon is typed "${businessType ?? 'unset'}". Set business type to tour operator in onboarding first.`,
      { businessType, expectedBusinessType: TOUR_OPERATOR_BUSINESS_TYPE },
    );
  }

  try {
    const result = await deps.onboardingService.applyVerticalPlaybook(
      businessId,
      userId,
    );

    const scheduleNote =
      result.alreadyConfigured === true
        ? 'Schedule was already configured — catalog entries were added where missing.'
        : `Applied "${result.templatesApplied?.join(', ') ?? 'Tour operating hours'}" (${result.slotsCreated ?? 0} slots for ${result.employeeName ?? 'staff'}).`;

    const summary = `Tour playbook applied — ${result.categoriesCreated ?? 0} categories, ${result.servicesCreated ?? 0} services created. ${scheduleNote}`;

    return success('apply_tour_playbook', summary, {
      playbookId: result.playbookId,
      categoriesCreated: result.categoriesCreated,
      servicesCreated: result.servicesCreated,
      slotsCreated: result.slotsCreated,
      templatesApplied: result.templatesApplied,
      alreadyConfigured: result.alreadyConfigured ?? false,
      employeeName: result.employeeName ?? null,
      status: result.status,
    });
  } catch (error) {
    if (error instanceof BadRequestException) {
      const message =
        typeof error.message === 'string'
          ? error.message
          : 'Could not apply tour playbook.';
      return failure('apply_tour_playbook', message);
    }
    throw error;
  }
}
