import {
  parseMultilingualTimeOfDayWindow,
  promptMentionsMultilingualTomorrow,
} from './ai-check-and-book-multilingual.util.js';
import { parseTimeOfDayWindow } from './ai-operations.util.js';
import {
  notBeforeTimeFromWindow,
  resolveTomorrowDateKey,
} from './ai-payments.util.js';
import { resolvePublicAvailabilityWindows } from './ai-orchestration.helpers.js';
import type { TimeOfDayWindow } from './ai-operations.util.js';
import { formatTimeDisplay } from '../../common/utils/date-format.util.js';
import {
  pickEarliestSlotAcrossWindows,
  scanWindowsForSlots,
  type AvailabilityWindowScanQuery,
} from './ai-flexible-availability.util.js';

/** Unified query for PublicBookingService.findNearestBookableSlot (ai-cmd-h2.3). */
export interface NearestBookableSlotQuery {
  employeeId: string | null;
  notBeforeTime: string | null;
  startDateKey: string | null;
  timeOfDay: string | null;
}

/** Per-window nearest-slot scan inputs (avail-1.6). */
export type NearestAvailabilityWindowQuery = AvailabilityWindowScanQuery;

export type ChosenNearestAvailabilityWindow = {
  slot: {
    employeeId: string;
    employeeName: string;
    dateKey: string;
    startTime: string;
  };
  windowIndex: number;
  timeOfDay: TimeOfDayWindow | null;
  dateKeys: string[];
};

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

/** Resolve OR availability windows for nearest-slot scan (avail-1.6). */
export function buildNearestAvailabilityWindowQueries(
  params: Record<string, unknown>,
  prompt: string,
  timeZone: string,
): NearestAvailabilityWindowQuery[] {
  const baseQuery = buildNearestBookableSlotQuery(params, prompt);
  const windows = resolvePublicAvailabilityWindows(params, prompt, timeZone);

  if (windows.length === 0) {
    return [
      {
        dateKeys: baseQuery.startDateKey ? [baseQuery.startDateKey] : [],
        timeOfDay: (baseQuery.timeOfDay as TimeOfDayWindow | null) ?? null,
        notBeforeTime: baseQuery.notBeforeTime,
      },
    ];
  }

  return windows.map((window) => ({
    dateKeys: window.dateKeys,
    timeOfDay: window.timeOfDay ?? null,
    notBeforeTime: window.timeFrom ?? baseQuery.notBeforeTime,
  }));
}

export function pickEarliestNearestAvailabilityWindow<
  T extends { startTime: string },
>(
  candidates: Array<{
    slot: T;
    windowIndex: number;
    timeOfDay: TimeOfDayWindow | null;
    dateKeys: string[];
  }>,
): {
  slot: T;
  windowIndex: number;
  timeOfDay: TimeOfDayWindow | null;
  dateKeys: string[];
} | null {
  return pickEarliestSlotAcrossWindows(candidates);
}

/** Apply winning OR window + slot onto booking params and session handoff (avail-1.6). */
export function applyChosenAvailabilityWindowToParams(
  params: Record<string, unknown>,
  chosen: ChosenNearestAvailabilityWindow,
): Record<string, unknown> {
  return {
    ...params,
    date: chosen.slot.dateKey,
    timeSlot: formatTimeDisplay(chosen.slot.startTime),
    startTime: chosen.slot.startTime,
    employeeId: chosen.slot.employeeId,
    employeeName: chosen.slot.employeeName,
    timeOfDay: chosen.timeOfDay ?? undefined,
    chosenAvailabilityWindowIndex: chosen.windowIndex,
    chosenAvailabilityWindow: {
      dateKeys: chosen.dateKeys,
      timeOfDay: chosen.timeOfDay,
    },
  };
}

type FindNearestBookableSlotFn = (
  slug: string,
  options: {
    serviceId: string;
    employeeId?: string | null;
    notBeforeTime?: string | null;
    startDateKey?: string | null;
    dateKeys?: string[] | null;
    timeOfDay?: TimeOfDayWindow | null;
  },
) => Promise<ChosenNearestAvailabilityWindow['slot'] | null>;

/** Delegate OR-window scan to an existing single-window finder (tests + service reuse). */
export async function findNearestBookableSlotAcrossWindowsWithFinder(
  slug: string,
  options: {
    serviceId: string;
    employeeId?: string | null;
    windows: NearestAvailabilityWindowQuery[];
  },
  findInWindow: FindNearestBookableSlotFn,
): Promise<ChosenNearestAvailabilityWindow | null> {
  const picked = await scanWindowsForSlots(
    options.windows,
    async (window) =>
      findInWindow(slug, {
        serviceId: options.serviceId,
        employeeId: options.employeeId,
        notBeforeTime: window.notBeforeTime ?? null,
        startDateKey: window.dateKeys[0] ?? null,
        dateKeys: window.dateKeys.length > 0 ? window.dateKeys : null,
        timeOfDay: window.timeOfDay,
      }),
  );

  if (!picked) return null;

  return {
    slot: picked.slot,
    windowIndex: picked.windowIndex,
    timeOfDay: picked.timeOfDay,
    dateKeys: picked.dateKeys,
  };
}
