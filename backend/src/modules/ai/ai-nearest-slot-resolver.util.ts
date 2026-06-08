import {
  parseMultilingualTimeOfDayWindow,
  promptMentionsMultilingualTomorrow,
} from './ai-check-and-book-multilingual.util.js';
import {
  parseTimeOfDayWindow,
  type TimeOfDayWindow,
} from './ai-operations.util.js';
import {
  notBeforeTimeFromWindow,
  resolveTomorrowDateKey,
} from './ai-payments.util.js';

/** Unified query for PublicBookingService.findNearestBookableSlot (ai-cmd-h2.3). */
export interface NearestBookableSlotQuery {
  employeeId: string | null;
  notBeforeTime: string | null;
  startDateKey: string | null;
  timeOfDay: string | null;
}

export function resolveNearestBookableSlotEmployeeId(
  params: Record<string, unknown>,
  namedEmployeeId?: string | null,
): string | null {
  if (params.allProviders === true) return null;
  return namedEmployeeId ?? (params.employeeId as string | undefined) ?? null;
}

export function resolveNearestBookableSlotNotBeforeTime(
  params: Record<string, unknown>,
  prompt = '',
): string | null {
  return (
    notBeforeTimeFromWindow(prompt, params) ??
    (params.timeFrom as string | undefined) ??
    (params.notBeforeTime as string | undefined) ??
    null
  );
}

export function resolveNearestBookableSlotStartDateKey(
  params: Record<string, unknown>,
  prompt = '',
): string | null {
  return (
    (params.date as string | undefined) ??
    (/\btomorrow\b/i.test(prompt) || promptMentionsMultilingualTomorrow(prompt)
      ? resolveTomorrowDateKey()
      : null)
  );
}

export function resolveNearestBookableSlotTimeOfDay(
  params: Record<string, unknown>,
  prompt = '',
): string | null {
  return (
    (params.timeOfDay as string | undefined) ??
    parseTimeOfDayWindow(prompt, params) ??
    parseMultilingualTimeOfDayWindow(prompt, params) ??
    null
  );
}

/** Time-of-day filter for public check_availability / recommend_specialists. */
export function buildPublicAvailabilityTimeFilter(
  params: Record<string, unknown>,
  prompt = '',
): { timeOfDay: TimeOfDayWindow | null; notBeforeTime: string | null } {
  const rawTimeOfDay = resolveNearestBookableSlotTimeOfDay(params, prompt);
  const timeOfDay =
    rawTimeOfDay === 'morning' ||
    rawTimeOfDay === 'afternoon' ||
    rawTimeOfDay === 'evening'
      ? rawTimeOfDay
      : null;
  return {
    timeOfDay,
    notBeforeTime: resolveNearestBookableSlotNotBeforeTime(params, prompt),
  };
}

/** Same slot resolver inputs as customer book_nearest_slot / dashboard payments handler. */
export function buildNearestBookableSlotQuery(
  params: Record<string, unknown>,
  prompt = '',
  namedEmployeeId?: string | null,
): NearestBookableSlotQuery {
  return {
    employeeId: resolveNearestBookableSlotEmployeeId(params, namedEmployeeId),
    notBeforeTime: resolveNearestBookableSlotNotBeforeTime(params, prompt),
    startDateKey: resolveNearestBookableSlotStartDateKey(params, prompt),
    timeOfDay: resolveNearestBookableSlotTimeOfDay(params, prompt),
  };
}
