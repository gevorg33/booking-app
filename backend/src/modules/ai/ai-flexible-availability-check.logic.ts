import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import { formatDateDisplay, formatTimeDisplay } from '../../common/utils/date-format.util.js';
import {
  addDaysToDateKey,
  getDateKeyInTimezone,
} from '../../common/utils/timezone.util.js';
import { formatWeekdayShortByDayIndex, intlLocaleTag } from '../../common/i18n/locale-date.util.js';
import { t, type AppLocale } from '../../common/i18n/messages.js';
import {
  filterSlotsByTimeOfDay,
  type TimeOfDayWindow,
} from './ai-operations.util.js';
import type { ResolvedPublicAvailabilityWindow } from './ai-orchestration.helpers.js';
import {
  resolveBudgetMaxPrice,
  type BudgetCatalogService,
} from './ai-budget-service-discovery.util.js';
import { applyBudgetFilterForRecommendSpecialists } from './ai-budget-list-services.logic.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export type PublicAvailabilityProviderReport = {
  employeeId: string;
  employeeName: string;
  times: string[];
  firstSlot: string;
};

export type PublicAvailabilityDayReport = {
  dateKey: string;
  providers: PublicAvailabilityProviderReport[];
};

export type PublicAvailabilityWindowReport = {
  label: string;
  dayReports: PublicAvailabilityDayReport[];
};

export type PublicProviderSlot = {
  startTime: string;
  endTime: string;
};

/** Apply dashboard-style timeOfDay filter to public provider slots (avail-1.5). */
export function filterPublicProviderSlotsByTimeOfDay(
  slots: readonly PublicProviderSlot[],
  timeOfDay: TimeOfDayWindow | null | undefined,
): PublicProviderSlot[] {
  if (!timeOfDay || slots.length === 0) return [...slots];

  const mapped = slots.map((slot) => ({
    start: formatTimeDisplay(slot.startTime),
    end: formatTimeDisplay(slot.endTime),
    slot,
  }));
  return filterSlotsByTimeOfDay(mapped, timeOfDay).map((entry) => entry.slot);
}

export function shouldGroupPublicAvailabilityByWindow(
  windows: readonly ResolvedPublicAvailabilityWindow[],
  params: Record<string, unknown>,
): boolean {
  if (windows.length > 1) return true;
  return (
    Array.isArray(params.availabilityWindows) &&
    params.availabilityWindows.length > 1
  );
}

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

function formatPublicTimeOfDayLabel(
  timeOfDay: TimeOfDayWindow,
  locale: AppLocale,
): string {
  if (timeOfDay === 'morning') {
    return t(locale, 'assistant.availabilityTimeOfDayMorning');
  }
  if (timeOfDay === 'afternoon') {
    return t(locale, 'assistant.availabilityTimeOfDayAfternoon');
  }
  return t(locale, 'assistant.availabilityTimeOfDayEvening');
}

/** Human label for an OR window section, e.g. "Tomorrow evening" or "Friday afternoon". */
export function buildPublicAvailabilityWindowLabel(
  window: ResolvedPublicAvailabilityWindow,
  locale: AppLocale,
  timeZone: string,
  todayDateKey?: string,
): string {
  const todayKey =
    todayDateKey ?? getDateKeyInTimezone(new Date(), timeZone);
  const tomorrowKey = addDaysToDateKey(todayKey, 1, timeZone);
  const timeOfDayLabel = window.timeOfDay
    ? formatPublicTimeOfDayLabel(window.timeOfDay, locale)
    : '';
  const firstDateKey = window.dateKeys[0];

  if (!firstDateKey) {
    return timeOfDayLabel;
  }

  if (window.dateKeys.length === 1 && firstDateKey === tomorrowKey) {
    return timeOfDayLabel
      ? t(locale, 'assistant.availabilityWindowTomorrow', {
          timeOfDay: timeOfDayLabel,
        })
      : t(locale, 'assistant.availabilityWindowTomorrowPlain');
  }

  if (window.dateKeys.length === 1 && firstDateKey === todayKey) {
    return timeOfDayLabel
      ? t(locale, 'assistant.availabilityWindowToday', {
          timeOfDay: timeOfDayLabel,
        })
      : t(locale, 'assistant.availabilityWindowTodayPlain');
  }

  const weekdayIndexes = [
    ...new Set(window.dateKeys.map((dateKey) => dayjs.tz(dateKey, timeZone).day())),
  ];
  if (weekdayIndexes.length === 1) {
    const weekday = formatWeekdayLongFromDateKey(firstDateKey, timeZone, locale);
    return timeOfDayLabel
      ? t(locale, 'assistant.availabilityWindowWeekday', {
          weekday,
          timeOfDay: timeOfDayLabel,
        })
      : weekday;
  }

  const date = formatDateDisplay(firstDateKey, locale);
  return timeOfDayLabel
    ? t(locale, 'assistant.availabilityWindowDate', { date, timeOfDay: timeOfDayLabel })
    : date;
}

export function mergePublicProviderSlotTimes(input: {
  providers: PublicAvailabilityProviderReport[];
  employeeId: string;
  employeeName: string;
  slots: readonly PublicProviderSlot[];
}): PublicAvailabilityProviderReport[] {
  const times = input.slots.map((slot) => formatTimeDisplay(slot.startTime));
  if (times.length === 0) return input.providers;

  const existing = input.providers.find(
    (provider) => provider.employeeId === input.employeeId,
  );
  if (existing) {
    existing.times = [...new Set([...existing.times, ...times])].sort();
    const earliest = input.slots.reduce((min, slot) =>
      slot.startTime < min ? slot.startTime : min,
    input.slots[0]!.startTime);
    if (earliest < existing.firstSlot) {
      existing.firstSlot = earliest;
    }
    return input.providers;
  }

  input.providers.push({
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    times,
    firstSlot: input.slots[0]!.startTime,
  });
  return input.providers;
}

function formatDayLine(input: {
  day: PublicAvailabilityDayReport;
  locale: AppLocale;
  timeZone: string;
  singleProvider: boolean;
  maxTimes: number;
}): string[] {
  const dayDate = dayjs.tz(input.day.dateKey, input.timeZone);
  const weekday = formatWeekdayShortByDayIndex(dayDate.day(), input.locale);
  const displayDay = formatDateDisplay(input.day.dateKey, input.locale);

  if (input.singleProvider) {
    const times = input.day.providers[0]?.times ?? [];
    return [
      t(input.locale, 'assistant.availabilityDaySingleProvider', {
        weekday,
        date: displayDay,
        times:
          times.slice(0, input.maxTimes).join(', ') +
          (times.length > input.maxTimes ? '…' : ''),
      }),
    ];
  }

  const lines = [`${weekday} ${displayDay}:`];
  for (const provider of input.day.providers) {
    const times =
      provider.times.slice(0, input.maxTimes).join(', ') +
      (provider.times.length > input.maxTimes ? '…' : '');
    lines.push(`• ${provider.employeeName}: ${times}`);
  }
  return lines;
}

function resolveAvailabilityBudgetMax(maxPrice: unknown): number | null {
  return resolveBudgetMaxPrice(maxPrice);
}

/** Budget intersection before slot scan — same ceiling semantics as list_services (avail-1.7 / budget-1.4). */
export function applyBudgetFilterForAvailabilityCheck<
  T extends BudgetCatalogService,
>(matchedServices: readonly T[], maxPrice: unknown): {
  services: T[];
  noMatchSummary: string | null;
  budgetMax: number | null;
} {
  const budgetMax = resolveAvailabilityBudgetMax(maxPrice);
  const filtered = applyBudgetFilterForRecommendSpecialists(
    matchedServices,
    maxPrice,
  );
  return {
    services: filtered.services,
    noMatchSummary: filtered.noMatchSummary,
    budgetMax,
  };
}

function availabilityHeaderKey(
  groupByWindow: boolean,
  budgetMax: number | null,
): string {
  if (budgetMax != null) {
    return groupByWindow
      ? 'assistant.availabilityHeaderOptionsBudget'
      : 'assistant.availabilityHeaderBudget';
  }
  return groupByWindow
    ? 'assistant.availabilityHeaderOptions'
    : 'assistant.availabilityHeader';
}

/** Grouped OR summary when every window is empty (avail-neither-window-en). */
export function shouldUseGroupedAvailabilityNoSlotsSummary(
  groupByWindow: boolean,
  windowReports: readonly PublicAvailabilityWindowReport[],
): boolean {
  return groupByWindow && windowReports.length >= 2;
}

export function composePublicAvailabilityGroupedEmptyWindowsSummary(input: {
  serviceLabel: string;
  locale: AppLocale;
  timeZone: string;
  singleProvider: boolean;
  windowReports: PublicAvailabilityWindowReport[];
  maxPrice?: unknown;
  overlapClarifyNote?: string | null;
}): string {
  return composePublicAvailabilityCheckSummary({
    ...input,
    groupByWindow: true,
    flatDayReports: [],
    totalDayCount: 0,
  });
}

export function formatAvailabilityNearestAlternativeNote(input: {
  locale: AppLocale;
  timeZone: string;
  employeeName: string;
  dateKey: string;
  startTime: string;
}): string {
  const weekday = formatWeekdayShortByDayIndex(
    dayjs.tz(`${input.dateKey}T12:00:00`, input.timeZone).day(),
    input.locale,
  );
  return t(input.locale, 'assistant.availabilityNearestAlternative', {
    weekday,
    date: formatDateDisplay(input.dateKey, input.locale),
    time: formatTimeDisplay(input.startTime),
    provider: input.employeeName,
  });
}

export function appendAvailabilityNearestAlternativeNote(
  summary: string,
  note: string,
): string {
  if (!note.trim()) return summary;
  return `${summary}\n\n${note.trim()}`;
}

/** No-slot copy with optional budget ceiling mention (avail-1.7). */
export function composeAvailabilityNoSlotsSummary(input: {
  locale: AppLocale;
  serviceLabel: string;
  providerLabel: string;
  daysLabel: string;
  maxPrice?: unknown;
}): string {
  const budgetMax = resolveAvailabilityBudgetMax(input.maxPrice);
  const key =
    budgetMax != null
      ? 'assistant.availabilityNoSlotsBudget'
      : 'assistant.availabilityNoSlots';
  return t(input.locale, key, {
    service: input.serviceLabel,
    provider: input.providerLabel,
    days: input.daysLabel,
    ...(budgetMax != null ? { maxPrice: String(budgetMax) } : {}),
  });
}

/** Compose availability summary with optional OR window section labels (avail-1.5). */
export function composePublicAvailabilityCheckSummary(input: {
  serviceLabel: string;
  locale: AppLocale;
  timeZone: string;
  singleProvider: boolean;
  groupByWindow: boolean;
  windowReports: PublicAvailabilityWindowReport[];
  flatDayReports: PublicAvailabilityDayReport[];
  totalDayCount: number;
  maxPrice?: unknown;
  overlapClarifyNote?: string | null;
}): string {
  const lines: string[] = [];
  const budgetMax = resolveAvailabilityBudgetMax(input.maxPrice);
  const headerKey = availabilityHeaderKey(input.groupByWindow, budgetMax);
  const headerVars: Record<string, string> = {
    service: input.serviceLabel,
    ...(budgetMax != null ? { maxPrice: String(budgetMax) } : {}),
  };

  if (input.overlapClarifyNote?.trim()) {
    lines.push(input.overlapClarifyNote.trim(), '');
  }

  if (input.groupByWindow) {
    lines.push(
      t(input.locale, headerKey, {
        ...headerVars,
        count: String(input.windowReports.length),
      }),
      '',
    );
    for (const windowReport of input.windowReports) {
      lines.push(`${windowReport.label}:`);
      if (windowReport.dayReports.length === 0) {
        lines.push(
          t(input.locale, 'assistant.availabilityWindowNoSlots', {
            label: windowReport.label,
          }),
        );
      } else {
        for (const day of windowReport.dayReports) {
          lines.push(
            ...formatDayLine({
              day,
              locale: input.locale,
              timeZone: input.timeZone,
              singleProvider: input.singleProvider,
              maxTimes: input.singleProvider ? 8 : 6,
            }),
          );
        }
      }
      lines.push('');
    }
    if (lines.at(-1) === '') lines.pop();
    return lines.join('\n');
  }

  lines.push(
    t(input.locale, headerKey, {
      ...headerVars,
      days:
        input.totalDayCount === 1 && input.flatDayReports[0]
          ? formatDateDisplay(input.flatDayReports[0].dateKey, input.locale)
          : String(input.flatDayReports.length),
    }),
    '',
  );

  for (const day of input.flatDayReports) {
    lines.push(
      ...formatDayLine({
        day,
        locale: input.locale,
        timeZone: input.timeZone,
        singleProvider: input.singleProvider,
        maxTimes: input.singleProvider ? 8 : 6,
      }),
    );
  }

  return lines.join('\n');
}
