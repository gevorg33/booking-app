import type { ServiceService } from '../service/service.service.js';
import {
  extractTourMetadata,
  formatTourDurationBadge,
  isTourService,
  resolveTourCatalogServiceByName,
  resolveTourDurationDays,
} from '../../common/utils/tour-service.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseExplainTourBookingFromPrompt,
  type ParsedExplainTourBooking,
  type TourBookingAspect,
} from './ai-tour-booking.util.js';

export interface TourBookingLogicDeps {
  serviceService: Pick<ServiceService, 'findAll'>;
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

function formatCurrencyLabel(code: string | null | undefined): string {
  const normalized = (code ?? 'EUR').toUpperCase();
  const symbols: Record<string, string> = {
    EUR: '€',
    AMD: '֏',
    RUB: '₽',
    USD: '$',
    GBP: '£',
  };
  const symbol = symbols[normalized];
  return symbol ? `${symbol} (${normalized})` : normalized;
}

function buildAspectSummary(
  serviceName: string,
  aspect: TourBookingAspect,
  details: {
    maxGroupSize: number | null;
    pricePerPerson: number;
    currency: string;
    durationBadge: string;
    durationDays: number;
  },
): string {
  const parts: string[] = [];

  if (aspect === 'all' || aspect === 'groupSize') {
    parts.push(
      details.maxGroupSize
        ? `max group size ${details.maxGroupSize}`
        : 'no group size cap is set',
    );
  }

  if (aspect === 'all' || aspect === 'pricing') {
    parts.push(
      `unit price ${details.pricePerPerson} per person (${formatCurrencyLabel(details.currency)}); checkout total multiplies by pax`,
    );
  }

  if (aspect === 'all' || aspect === 'duration') {
    const durationText =
      details.durationDays >= 2
        ? `${details.durationBadge} (${details.durationDays} days)`
        : details.durationBadge;
    parts.push(`duration ${durationText}`);
  }

  return `"${serviceName}" on the booking page — ${parts.join('; ')}.`;
}

export async function handleExplainTourBookingLogic(
  deps: TourBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainTourBookingFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_tour_booking',
      'Ask about a tour on the booking page (e.g. "What is the max group size for City Tour?" or "Is Mountain Trek priced per person?").',
      {
        clarify: true,
        missing: ['serviceName', 'aspect'],
      },
    );
  }

  return executeExplainTourBooking(deps, businessId, parsed);
}

async function executeExplainTourBooking(
  deps: TourBookingLogicDeps,
  businessId: string,
  parsed: ParsedExplainTourBooking,
): Promise<CommandResult> {
  const services = await deps.serviceService.findAll(businessId);
  const service = parsed.serviceId
    ? services.find((item) => item.id === parsed.serviceId)
    : parsed.serviceName
      ? resolveTourCatalogServiceByName(services, parsed.serviceName)
      : undefined;

  if (!service) {
    return failure(
      'explain_tour_booking',
      parsed.serviceName
        ? `Could not find a catalog service matching "${parsed.serviceName}".`
        : 'Specify which tour to explain (service name from the booking catalog).',
      {
        clarify: !parsed.serviceName,
        serviceName: parsed.serviceName ?? null,
      },
    );
  }

  if (!isTourService((service.metadata ?? {}) as Record<string, unknown>)) {
    return failure(
      'explain_tour_booking',
      `"${service.name}" is not configured as a tour on the booking page — use list_services for standard service duration and price.`,
      { serviceName: service.name, serviceId: service.id },
    );
  }

  const tour = extractTourMetadata(
    (service.metadata ?? {}) as Record<string, unknown>,
  );
  const durationDays = resolveTourDurationDays(service);
  const summary = buildAspectSummary(service.name, parsed.aspect, {
    maxGroupSize: tour?.maxGroupSize ?? null,
    pricePerPerson: Number(service.price),
    currency: service.currency ?? 'EUR',
    durationBadge: formatTourDurationBadge(service),
    durationDays,
  });

  return success('explain_tour_booking', summary, {
    serviceId: service.id,
    serviceName: service.name,
    aspect: parsed.aspect,
    maxGroupSize: tour?.maxGroupSize ?? null,
    pricePerPerson: Number(service.price),
    currency: service.currency ?? 'EUR',
    durationBadge: formatTourDurationBadge(service),
    durationDays,
    priceMultipliesByPax: true,
  });
}
