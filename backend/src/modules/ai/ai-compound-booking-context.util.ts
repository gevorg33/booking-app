import {
  extractMultilingualServiceNameFromPrompt,
  isMultilingualCheckProvidersPrompt,
  parseMultilingualTimeOfDayWindow,
  promptMentionsMultilingualTomorrow,
} from './ai-check-and-book-multilingual.util.js';
import {
  isAnyProviderBookingPrompt,
  isFirstAvailableBookingPrompt,
} from './ai-intent-heuristics.js';
import { parseTimeOfDayWindow } from './ai-operations.util.js';
import {
  extractSingleIsoDayFromPrompt,
  parseEarliestBookingTimeFromPrompt,
} from './ai-orchestration.helpers.js';
import {
  extractServiceNameFromPrompt,
  isAvailabilityFillerServiceName,
} from './ai-payments.util.js';

function resolveTomorrowDateKey(now: Date = new Date()): string {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return tomorrow.toISOString().slice(0, 10);
}

function notBeforeTimeFromWindow(
  prompt: string,
  params: Record<string, unknown>,
): string | null {
  const window =
    parseTimeOfDayWindow(prompt, params) ??
    parseMultilingualTimeOfDayWindow(prompt, params);
  if (window === 'evening') return '17:00';
  if (window === 'afternoon') return '12:00';
  if (window === 'morning') return '00:00';
  return (params.notBeforeTime as string | undefined) ?? null;
}

/** Booking params forwarded across every compound sub-step (ai-cmd-h2). */
export const SHARED_BOOKING_CONTEXT_KEYS = [
  'date',
  'timeOfDay',
  'notBeforeTime',
  'serviceName',
  'serviceCategory',
  'allProviders',
  'bookingFirstAvailable',
  'timeFrom',
  'maxPrice',
  'serviceRank',
  'serviceId',
  // e2e-bug.229 — preserve selected checkout slot across compound / session merges.
  'employeeId',
  'startTime',
  'paxCount',
  'availabilityWindows',
  'chosenAvailabilityWindow',
  'chosenAvailabilityWindowIndex',
] as const;

export type SharedBookingContextKey =
  (typeof SHARED_BOOKING_CONTEXT_KEYS)[number];

export interface CompoundStepWithBookingParams {
  action: string;
  params: Record<string, unknown>;
}

function promptImpliesAllProviders(prompt: string): boolean {
  return (
    isAnyProviderBookingPrompt(prompt) ||
    isMultilingualCheckProvidersPrompt(prompt) ||
    (/\b(who|which|anyone|anybody)\b/i.test(prompt) &&
      /\b(?:free|available|open|availability)\b/i.test(prompt)) ||
    (/\bcheck\b/i.test(prompt) && /\bproviders?\b/i.test(prompt)) ||
    /\bwho\s+has\s+availability\b/i.test(prompt)
  );
}

function isConcreteServiceName(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  // e2e-bug.89 — reject "next available" and other book-slot fillers.
  return trimmed.length > 0 && !isAvailabilityFillerServiceName(trimmed);
}

/** Resolve date/time/service/provider hints once from the full prompt (or segment). */
export function buildSharedBookingContextFromPrompt(
  text: string,
  timeZone = 'UTC',
): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  const serviceName =
    extractServiceNameFromPrompt(text) ??
    extractMultilingualServiceNameFromPrompt(text);
  if (serviceName) base.serviceName = serviceName;

  const timeOfDay =
    parseTimeOfDayWindow(text, {}) ??
    parseMultilingualTimeOfDayWindow(text, {});
  if (timeOfDay) base.timeOfDay = timeOfDay;

  if (/\btomorrow\b/i.test(text) || promptMentionsMultilingualTomorrow(text)) {
    base.date = resolveTomorrowDateKey();
  } else {
    const isoDay = extractSingleIsoDayFromPrompt(text, timeZone);
    if (isoDay) base.date = isoDay;
  }

  const notBeforeTime = notBeforeTimeFromWindow(text, base);
  if (notBeforeTime) base.notBeforeTime = notBeforeTime;

  const earliestTime = parseEarliestBookingTimeFromPrompt(text);
  if (earliestTime) base.timeFrom = earliestTime;

  if (promptImpliesAllProviders(text)) {
    base.allProviders = true;
  }

  if (isFirstAvailableBookingPrompt(text)) {
    base.bookingFirstAvailable = true;
  }

  return base;
}

/** Merge array/object compound params without blanking inherited values. */
function mergeCompoundParamValue(
  key: string,
  existing: unknown,
  incoming: unknown,
): unknown {
  if (incoming == null) return existing;
  if (key === 'availabilityWindows' && Array.isArray(incoming)) {
    return incoming.length > 0 ? incoming : existing;
  }
  if (key === 'chosenAvailabilityWindow' && typeof incoming === 'object') {
    return incoming;
  }
  if (incoming === '') return existing;
  return incoming;
}

/** Merge segment context into shared without blanking inherited values. */
export function mergeSharedBookingContext(
  shared: Record<string, unknown>,
  segmentContext: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...shared };
  for (const [key, value] of Object.entries(segmentContext)) {
    if (value == null || value === '') continue;
    if (key === 'serviceName') {
      if (!isConcreteServiceName(value)) continue;
      if (
        isConcreteServiceName(merged.serviceName) &&
        merged.serviceName.length > value.length
      ) {
        continue;
      }
    }
    merged[key] = mergeCompoundParamValue(key, merged[key], value);
  }
  return merged;
}

export function pickSharedBookingContextSlice(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const slice: Record<string, unknown> = {};
  for (const key of SHARED_BOOKING_CONTEXT_KEYS) {
    const value = params[key];
    if (value != null && value !== '') slice[key] = value;
  }
  return slice;
}

/** Forward-fill booking context across ordered compound steps. */
export function propagateSharedBookingContextAcrossSteps<
  T extends CompoundStepWithBookingParams,
>(steps: T[]): T[] {
  const context: Record<string, unknown> = {};
  return steps.map((step) => {
    const mergedParams = mergeSharedBookingContext(context, step.params);
    for (const key of SHARED_BOOKING_CONTEXT_KEYS) {
      const value = mergedParams[key];
      if (value != null && value !== '') context[key] = value;
    }
    return { ...step, params: mergedParams };
  });
}

/** Merge accumulated compound context into the next step params. */
export function mergeSharedBookingStepParams(
  context: Record<string, unknown>,
  stepParams: Record<string, unknown>,
): Record<string, unknown> {
  return mergeSharedBookingContext(context, stepParams);
}
