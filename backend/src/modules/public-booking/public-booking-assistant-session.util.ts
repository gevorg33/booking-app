import { pickSharedBookingContextSlice } from '../ai/ai-compound-booking-context.util.js';
import { serializeRankedServiceIds } from '../ai/ai-rank-session-pick.util.js';

/** Discovery + booking keys restored from public assistant session on follow-up turns. */
export const PUBLIC_ASSISTANT_SESSION_MERGE_KEYS = [
  'employeeName',
  'date',
  'serviceName',
  'serviceCategory',
  'timeSlot',
  'timeOfDay',
  'customerName',
  'customerEmail',
  'customerPhone',
  'maxPrice',
  'serviceId',
  'serviceRank',
  'rankedServiceIds',
  'availabilityWindows',
  'chosenAvailabilityWindow',
  'chosenAvailabilityWindowIndex',
] as const;

export function parsePublicAssistantSessionValue(
  key: string,
  value: unknown,
): unknown {
  if (value == null || value === '') return undefined;
  if (key === 'maxPrice' || key === 'chosenAvailabilityWindowIndex') {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  }
  if (key === 'availabilityWindows' || key === 'chosenAvailabilityWindow') {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        return undefined;
      }
    }
    return value;
  }
  return value;
}

function shouldSkipSessionServiceIdentityMerge(
  key: string,
  merged: Record<string, unknown>,
): boolean {
  if (
    key === 'serviceId' &&
    merged.serviceName != null &&
    merged.serviceName !== '' &&
    merged.serviceId == null
  ) {
    return true;
  }
  if (
    key === 'serviceRank' &&
    merged.serviceName != null &&
    merged.serviceName !== '' &&
    merged.serviceRank == null
  ) {
    return true;
  }
  return false;
}

export function mergePublicAssistantSessionParams(
  params: Record<string, unknown>,
  session?: Record<string, unknown>,
  action?: string,
): Record<string, unknown> {
  if (!session) return params;
  const merged = { ...params };
  const skipForNearest =
    action === 'book_appointment' && params.bookingFirstAvailable === true;
  const skipSessionDate =
    (action === 'check_availability' || action === 'recommend_specialists') &&
    ((Array.isArray(params.weekdays) && params.weekdays.length > 0) ||
      params.dateFrom != null ||
      params.dateTo != null);

  for (const key of PUBLIC_ASSISTANT_SESSION_MERGE_KEYS) {
    if (
      skipForNearest &&
      (key === 'date' || key === 'timeSlot' || key === 'employeeName')
    ) {
      continue;
    }
    if (key === 'date' && skipSessionDate) {
      continue;
    }
    if (merged[key] != null && merged[key] !== '') continue;
    if (shouldSkipSessionServiceIdentityMerge(key, merged)) continue;
    const parsed = parsePublicAssistantSessionValue(key, session[key]);
    if (parsed != null && parsed !== '') {
      merged[key] = parsed;
    }
  }

  for (const [key, value] of Object.entries(
    pickSharedBookingContextSlice(session),
  )) {
    if (merged[key] != null && merged[key] !== '') continue;
    if (shouldSkipSessionServiceIdentityMerge(key, merged)) continue;
    const parsed = parsePublicAssistantSessionValue(key, value);
    if (parsed != null && parsed !== '') {
      merged[key] = parsed;
    }
  }

  if (session.checkProvidersHandoff && !merged.checkProvidersHandoff) {
    merged.checkProvidersHandoff = session.checkProvidersHandoff;
  }
  if (session.priorCheckSummary && !merged.priorCheckSummary) {
    merged.priorCheckSummary = session.priorCheckSummary;
  }
  if (session.availableProviders && !merged.availableProviders) {
    merged.availableProviders = session.availableProviders;
  }

  return merged;
}

export function serializePublicAssistantDiscoverySessionFields(
  params: Record<string, unknown>,
): Record<string, string | null> {
  const out: Record<string, string | null> = {
    maxPrice: params.maxPrice != null ? String(params.maxPrice) : null,
    serviceRank:
      typeof params.serviceRank === 'string' && params.serviceRank.length > 0
        ? params.serviceRank
        : null,
    timeOfDay:
      typeof params.timeOfDay === 'string' && params.timeOfDay.length > 0
        ? params.timeOfDay
        : null,
    availabilityWindows: Array.isArray(params.availabilityWindows)
      ? JSON.stringify(params.availabilityWindows)
      : null,
    chosenAvailabilityWindow:
      params.chosenAvailabilityWindow != null
        ? JSON.stringify(params.chosenAvailabilityWindow)
        : null,
    chosenAvailabilityWindowIndex:
      params.chosenAvailabilityWindowIndex != null
        ? String(params.chosenAvailabilityWindowIndex)
        : null,
    rankedServiceIds:
      serializeRankedServiceIds(
        Array.isArray(params.rankedServiceIds)
          ? params.rankedServiceIds.filter(
              (entry): entry is string => typeof entry === 'string',
            )
          : [],
      ),
  };
  return out;
}
