import {
  parseMultilingualTimeOfDayWindow,
  promptMentionsMultilingualTomorrow,
} from './ai-check-and-book-multilingual.util.js';
import { parseTimeOfDayWindow } from './ai-operations.util.js';
import { notBeforeTimeFromWindow } from './ai-payments.util.js';
import { resolvePublicAvailabilityWindows } from './ai-orchestration.helpers.js';
import type { TimeOfDayWindow } from './ai-operations.util.js';
import {
  formatTimeDisplay,
  getTodayDateKey,
  toIsoDay,
} from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import {
  pickEarliestSlotAcrossWindows,
  scanWindowsForSlots,
  type AvailabilityWindowScanQuery,
} from './ai-flexible-availability.util.js';

const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * e2e-bug.268 — first-available / nearest scans must never start before today
 * in the business timezone. Past or non-ISO date fragments fall back to today.
 */
export function clampFirstAvailableStartIsoDay(
  requestedDate: string | null | undefined,
  timeZone: string,
): string {
  const todayKey = getTodayDateKey(timeZone);
  if (requestedDate == null || String(requestedDate).trim() === '') {
    return todayKey;
  }
  const iso = toIsoDay(String(requestedDate).trim(), timeZone);
  if (!ISO_DAY_RE.test(iso)) return todayKey;
  return iso < todayKey ? todayKey : iso;
}

/** Drop past / non-ISO calendar days from a first-available window. */
export function dropPastFirstAvailableDateKeys(
  dateKeys: readonly string[],
  timeZone: string,
): string[] {
  const todayKey = getTodayDateKey(timeZone);
  const out: string[] = [];
  for (const raw of dateKeys) {
    const iso = ISO_DAY_RE.test(raw) ? raw : toIsoDay(raw, timeZone);
    if (!ISO_DAY_RE.test(iso)) continue;
    if (iso < todayKey) continue;
    out.push(iso);
  }
  return out;
}

export function isFutureOrTodayIsoDay(
  isoDay: string,
  timeZone: string,
): boolean {
  if (!ISO_DAY_RE.test(isoDay)) return false;
  return isoDay >= getTodayDateKey(timeZone);
}

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
  timeZone = 'UTC',
): string | null {
  const raw =
    (params.date as string | undefined) ??
    (/\btomorrow\b/i.test(prompt) || promptMentionsMultilingualTomorrow(prompt)
      ? addDaysToDateKey(getTodayDateKey(timeZone), 1, timeZone)
      : null);
  if (raw == null) return null;
  // e2e-bug.268 — never hand a past calendar day to nearest-slot scanners.
  return clampFirstAvailableStartIsoDay(raw, timeZone);
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
  timeZone = 'UTC',
): NearestBookableSlotQuery {
  return {
    employeeId: resolveNearestBookableSlotEmployeeId(params, namedEmployeeId),
    notBeforeTime: resolveNearestBookableSlotNotBeforeTime(params, prompt),
    startDateKey: resolveNearestBookableSlotStartDateKey(
      params,
      prompt,
      timeZone,
    ),
    timeOfDay: resolveNearestBookableSlotTimeOfDay(params, prompt),
  };
}

/** Resolve OR availability windows for nearest-slot scan (avail-1.6). */
export function buildNearestAvailabilityWindowQueries(
  params: Record<string, unknown>,
  prompt: string,
  timeZone: string,
): NearestAvailabilityWindowQuery[] {
  const baseQuery = buildNearestBookableSlotQuery(
    params,
    prompt,
    undefined,
    timeZone,
  );
  const windows = resolvePublicAvailabilityWindows(params, prompt, timeZone);

  if (windows.length === 0) {
    return [
      {
        dateKeys: baseQuery.startDateKey
          ? dropPastFirstAvailableDateKeys([baseQuery.startDateKey], timeZone)
          : [],
        timeOfDay: (baseQuery.timeOfDay as TimeOfDayWindow | null) ?? null,
        notBeforeTime: baseQuery.notBeforeTime,
      },
    ];
  }

  return windows.map((window) => ({
    dateKeys: dropPastFirstAvailableDateKeys(window.dateKeys, timeZone),
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

/** Wire findNearestBookableSlotAcrossWindows on a public-booking mock (integration specs). */
export function attachPublicBookingNearestAcrossWindowsMock(publicBookingService: {
  findNearestBookableSlot: jest.Mock;
  findNearestBookableSlotAcrossWindows?: jest.Mock;
}) {
  publicBookingService.findNearestBookableSlotAcrossWindows = jest.fn(
    async (slug, options) =>
      findNearestBookableSlotAcrossWindowsWithFinder(
        slug,
        options,
        publicBookingService.findNearestBookableSlot,
      ),
  );
}

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
  const picked = await scanWindowsForSlots(options.windows, async (window) =>
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
