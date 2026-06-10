import type { CommandResult } from './command-completion.types.js';
import type { ProviderAvailabilityRow } from './ai-provider-availability.util.js';

/** Availability snapshot from check_providers_for_service / check_availability. */
export interface CheckProvidersHandoff {
  summary: string;
  serviceName?: string;
  serviceId?: string;
  date?: string;
  timeOfDay?: string | null;
  notBeforeTime?: string | null;
  availableProviders?: string[];
  availability?: ProviderAvailabilityRow[];
  noProviders?: boolean;
}

export function buildCheckProvidersHandoffFromResult(
  result: Pick<CommandResult, 'summary' | 'details'>,
): CheckProvidersHandoff | null {
  const details = (result.details ?? {}) as Record<string, unknown>;
  if (!result.summary && !details.serviceName) return null;

  return {
    summary: result.summary,
    serviceName: details.serviceName as string | undefined,
    serviceId: details.serviceId as string | undefined,
    date: details.date as string | undefined,
    timeOfDay: (details.timeOfDay as string | null | undefined) ?? null,
    notBeforeTime: (details.notBeforeTime as string | null | undefined) ?? null,
    availableProviders: details.availableProviders as string[] | undefined,
    availability: details.availability as ProviderAvailabilityRow[] | undefined,
    noProviders: details.noProviders as boolean | undefined,
  };
}

export function pickCheckProvidersHandoff(
  params: Record<string, unknown>,
): CheckProvidersHandoff | null {
  const direct = params.checkProvidersHandoff;
  if (
    direct &&
    typeof direct === 'object' &&
    typeof (direct as CheckProvidersHandoff).summary === 'string'
  ) {
    return direct as CheckProvidersHandoff;
  }

  const availableProviders = params.availableProviders;
  const serviceName = params.serviceName;
  if (
    !serviceName &&
    !Array.isArray(availableProviders) &&
    typeof params.priorCheckSummary !== 'string'
  ) {
    return null;
  }

  const summary =
    typeof params.priorCheckSummary === 'string'
      ? params.priorCheckSummary
      : Array.isArray(availableProviders)
        ? availableProviders.length > 0
          ? `Checked providers: ${availableProviders.join(', ')}`
          : 'No providers were free for the requested window.'
        : '';

  if (!summary && !serviceName) return null;

  return {
    summary,
    serviceName: typeof serviceName === 'string' ? serviceName : undefined,
    serviceId:
      typeof params.serviceId === 'string' ? params.serviceId : undefined,
    date: typeof params.date === 'string' ? params.date : undefined,
    timeOfDay:
      typeof params.timeOfDay === 'string' ? params.timeOfDay : undefined,
    notBeforeTime:
      typeof params.notBeforeTime === 'string'
        ? params.notBeforeTime
        : undefined,
    availableProviders: Array.isArray(availableProviders)
      ? (availableProviders as string[])
      : undefined,
    availability: Array.isArray(params.availability)
      ? (params.availability as ProviderAvailabilityRow[])
      : undefined,
    noProviders:
      typeof params.noProviders === 'boolean' ? params.noProviders : undefined,
  };
}

export function attachCheckProvidersHandoff(
  details: Record<string, unknown>,
  handoff: CheckProvidersHandoff | null | undefined,
): Record<string, unknown> {
  if (!handoff) return details;
  return { ...details, checkProvidersHandoff: handoff };
}

export function mergeCheckProvidersHandoffIntoContext(
  context: Record<string, unknown>,
  result: CommandResult,
): Record<string, unknown> {
  if (
    result.action !== 'check_providers_for_service' &&
    result.action !== 'check_availability'
  ) {
    return context;
  }

  const details = (result.details ?? {}) as Record<string, unknown>;
  const handoff =
    (details.checkProvidersHandoff as CheckProvidersHandoff | undefined) ??
    buildCheckProvidersHandoffFromResult(result);
  if (!handoff) return context;

  const next: Record<string, unknown> = {
    ...context,
    checkProvidersHandoff: handoff,
    priorCheckSummary: handoff.summary,
  };
  if (handoff.availableProviders) {
    next.availableProviders = handoff.availableProviders;
  }
  if (handoff.availability) next.availability = handoff.availability;
  if (handoff.serviceName) next.serviceName = handoff.serviceName;
  if (handoff.serviceId) next.serviceId = handoff.serviceId;
  if (handoff.date) next.date = handoff.date;
  if (handoff.timeOfDay) next.timeOfDay = handoff.timeOfDay;
  if (handoff.notBeforeTime) next.notBeforeTime = handoff.notBeforeTime;
  if (handoff.noProviders != null) next.noProviders = handoff.noProviders;
  return next;
}
