import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import { t, type AppLocale } from '../../common/i18n/messages.js';
import { intlLocaleTag } from '../../common/i18n/locale-date.util.js';
import {
  addDaysToDateKey,
} from '../../common/utils/timezone.util.js';
import type { ResolvedPublicAvailabilityWindow } from './ai-orchestration.helpers.js';
import {
  buildPublicAvailabilityWindowLabel,
} from './ai-flexible-availability-check.logic.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export type AvailabilityWindowOverlapInfo = {
  hasOverlap: boolean;
  sharedDateKeys: string[];
  tomorrowIsSharedWeekday: boolean;
  sharedWeekdayLabel: string | null;
  distinctTimeWindowsOnSharedDay: boolean;
};

function formatWeekdayLongFromDateKey(
  dateKey: string,
  timeZone: string,
  locale: AppLocale,
): string {
  const instant = dayjs.tz(dateKey, timeZone).toDate();
  return new Intl.DateTimeFormat(intlLocaleTag(locale), {
    weekday: 'long',
    timeZone,
  }).format(instant);
}

function sameAvailabilityTimeFilter(
  a: ResolvedPublicAvailabilityWindow,
  b: ResolvedPublicAvailabilityWindow,
): boolean {
  return (
    (a.timeOfDay ?? null) === (b.timeOfDay ?? null) &&
    (a.timeFrom ?? null) === (b.timeFrom ?? null) &&
    (a.timeTo ?? null) === (b.timeTo ?? null) &&
    (a.timeSlot ?? null) === (b.timeSlot ?? null)
  );
}

function dateKeysIntersect(a: readonly string[], b: readonly string[]): boolean {
  const setB = new Set(b);
  return a.some((key) => setB.has(key));
}

function windowTimeSignature(window: ResolvedPublicAvailabilityWindow): string {
  return [
    window.timeOfDay ?? '',
    window.timeFrom ?? '',
    window.timeTo ?? '',
    window.timeSlot ?? '',
  ].join('|');
}

function hasDistinctTimeWindowsOnSharedDay(
  windows: readonly ResolvedPublicAvailabilityWindow[],
  sharedDateKeys: readonly string[],
): boolean {
  for (const dateKey of sharedDateKeys) {
    const signatures = new Set(
      windows
        .filter((window) => window.dateKeys.includes(dateKey))
        .map((window) => windowTimeSignature(window)),
    );
    if (signatures.size > 1) return true;
  }
  return false;
}

/** Merge windows that share the same time filter and overlapping date keys (avail-1.9). */
export function mergeIdenticalAvailabilityWindows(
  windows: readonly ResolvedPublicAvailabilityWindow[],
): ResolvedPublicAvailabilityWindow[] {
  const merged: ResolvedPublicAvailabilityWindow[] = [];

  for (const window of windows) {
    const existing = merged.find(
      (entry) =>
        sameAvailabilityTimeFilter(entry, window) &&
        dateKeysIntersect(entry.dateKeys, window.dateKeys),
    );
    if (existing) {
      existing.dateKeys = [
        ...new Set([...existing.dateKeys, ...window.dateKeys]),
      ].sort();
      continue;
    }
    merged.push({
      ...window,
      dateKeys: [...window.dateKeys],
    });
  }

  return merged;
}

export function detectAvailabilityWindowOverlap(
  windows: readonly ResolvedPublicAvailabilityWindow[],
  timeZone: string,
  todayDateKey: string,
): AvailabilityWindowOverlapInfo {
  const tomorrowKey = addDaysToDateKey(todayDateKey, 1, timeZone);
  const dateKeyCounts = new Map<string, number>();

  for (const window of windows) {
    for (const dateKey of window.dateKeys) {
      dateKeyCounts.set(dateKey, (dateKeyCounts.get(dateKey) ?? 0) + 1);
    }
  }

  const sharedDateKeys = [...dateKeyCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([dateKey]) => dateKey)
    .sort();

  const hasOverlap = sharedDateKeys.length > 0;
  const tomorrowIsSharedWeekday = sharedDateKeys.includes(tomorrowKey);
  const distinctTimeWindowsOnSharedDay = hasDistinctTimeWindowsOnSharedDay(
    windows,
    sharedDateKeys,
  );

  return {
    hasOverlap,
    sharedDateKeys,
    tomorrowIsSharedWeekday,
    sharedWeekdayLabel: hasOverlap
      ? formatWeekdayLongFromDateKey(sharedDateKeys[0]!, timeZone, 'en')
      : null,
    distinctTimeWindowsOnSharedDay,
  };
}

export function buildAvailabilityWindowOverlapClarifyNote(
  overlap: AvailabilityWindowOverlapInfo,
  locale: AppLocale,
  timeZone: string,
): string | null {
  if (!overlap.hasOverlap || !overlap.distinctTimeWindowsOnSharedDay) {
    return null;
  }

  const weekday =
    overlap.sharedWeekdayLabel ??
    (overlap.sharedDateKeys[0]
      ? formatWeekdayLongFromDateKey(
          overlap.sharedDateKeys[0],
          timeZone,
          locale,
        )
      : '');

  if (overlap.tomorrowIsSharedWeekday && weekday) {
    return t(locale, 'assistant.availabilityOverlapTomorrowIsWeekday', {
      weekday,
    });
  }

  if (weekday) {
    return t(locale, 'assistant.availabilityOverlapSameDay', { weekday });
  }

  return null;
}

/** Label OR sections honestly when calendar days overlap (avail-1.9). */
export function buildPublicAvailabilityWindowLabelForCheck(input: {
  window: ResolvedPublicAvailabilityWindow;
  overlap: AvailabilityWindowOverlapInfo;
  locale: AppLocale;
  timeZone: string;
  todayDateKey: string;
}): string {
  const soleDateKey =
    input.window.dateKeys.length === 1 ? input.window.dateKeys[0] : null;

  if (
    input.overlap.hasOverlap &&
    soleDateKey &&
    input.overlap.sharedDateKeys.includes(soleDateKey)
  ) {
    const relabeled: ResolvedPublicAvailabilityWindow = {
      ...input.window,
      dateKeys: [soleDateKey],
    };
    const fakeToday = addDaysToDateKey(soleDateKey, -2, input.timeZone);
    return buildPublicAvailabilityWindowLabel(
      relabeled,
      input.locale,
      input.timeZone,
      fakeToday,
    );
  }

  return buildPublicAvailabilityWindowLabel(
    input.window,
    input.locale,
    input.timeZone,
    input.todayDateKey,
  );
}

export function prepareAvailabilityWindowsForCheck(input: {
  windows: readonly ResolvedPublicAvailabilityWindow[];
  locale: AppLocale;
  timeZone: string;
  todayDateKey: string;
}): {
  windows: ResolvedPublicAvailabilityWindow[];
  overlap: AvailabilityWindowOverlapInfo;
  overlapClarifyNote: string | null;
} {
  const merged = mergeIdenticalAvailabilityWindows(input.windows);
  const overlap = detectAvailabilityWindowOverlap(
    merged,
    input.timeZone,
    input.todayDateKey,
  );
  const overlapClarifyNote = buildAvailabilityWindowOverlapClarifyNote(
    overlap,
    input.locale,
    input.timeZone,
  );

  return {
    windows: merged,
    overlap,
    overlapClarifyNote,
  };
}

export type AvailabilityBudgetClarifyDetails = {
  clarify: true;
  reason: 'budget_no_match';
  maxPrice: number;
};

/** Honest clarify when budget excludes every matched service before slot scan (avail-1.9). */
export function buildAvailabilityBudgetClarifyDetails(
  maxPrice: number,
): AvailabilityBudgetClarifyDetails {
  return {
    clarify: true,
    reason: 'budget_no_match',
    maxPrice,
  };
}

export function resolveAvailabilityBudgetClarifyMaxPrice(
  maxPrice: unknown,
  budgetMax: number | null,
): number | null {
  if (budgetMax != null) return budgetMax;
  if (typeof maxPrice === 'number' && Number.isFinite(maxPrice)) {
    return maxPrice;
  }
  if (typeof maxPrice === 'string' && maxPrice.trim()) {
    const parsed = Number.parseFloat(maxPrice);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
