export { resolveDisplayLocale, toIntlLocale } from '@/lib/app-locale';
export {
  addCalendarDays,
  getBrowserTimeZone,
  getTodayDateKey,
  parseDateInput,
  parseDateKey,
  parseDisplayDate,
  todayDateAnchor,
  toDateKey,
} from '@/lib/calendar-date.util';
export {
  formatAppointmentDateLabel,
  formatDateKeyPublicLabel,
  formatDateKeyStripParts,
  formatNearestSlotDateLabel,
  formatWeekdayShortByDayIndex,
  resolveNearestSlotDateLabel,
} from '@/lib/locale-date-format';

import { resolveDisplayLocale, toIntlLocale } from '@/lib/app-locale';
import {
  type BusinessDateFormat,
  type BusinessTimeFormat,
  formatDateKeyWithFormat,
  formatDateWithFormat,
  formatTimeWithFormat,
  getActiveBusinessDateFormats,
  parseBusinessDateInput,
  parseBusinessDateToKey,
  setActiveBusinessDateFormats,
  tenantDateFormatPreference,
  businessDateInputPlaceholder,
  businessDateFormatPattern,
  businessDateToKey,
} from '@/lib/business-date-format';
import {
  addCalendarDays,
  getBrowserTimeZone,
  getTodayDateKey,
  parseDateInput,
  parseDateKey,
  parseDisplayDate,
  todayDateAnchor,
  toDateKey,
} from '@/lib/calendar-date.util';

export {
  setActiveBusinessDateFormats,
  getActiveBusinessDateFormats,
  tenantDateFormatPreference,
} from '@/lib/business-date-format';

export interface DateDisplayOptions {
  dateFormat?: BusinessDateFormat;
  timeFormat?: BusinessTimeFormat;
  timeZone?: string;
}

function resolveDateFormat(options?: DateDisplayOptions): BusinessDateFormat {
  return options?.dateFormat ?? getActiveBusinessDateFormats().dateFormat;
}

function resolveTimeFormat(options?: DateDisplayOptions): BusinessTimeFormat {
  return options?.timeFormat ?? getActiveBusinessDateFormats().timeFormat;
}

/** Review date for public profile cards: "29 May 2026". */
export function formatPublicReviewDate(
  input: Date | string,
  locale?: string,
  timeZone = 'UTC',
): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const intlLocale = toIntlLocale(resolveDisplayLocale(locale)) ?? 'en-GB';
  return new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(d);
}

/** User-facing date: business format (overrides locale when tenant formats are active). */
export function formatDateDisplay(
  input: Date | string,
  _locale?: string,
  options?: DateDisplayOptions,
): string {
  const d =
    typeof input === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(input)
      ? parseBusinessDateInput(input, resolveDateFormat(options))
      : parseDisplayDate(input);
  if (!d || Number.isNaN(d.getTime())) return String(input);
  return formatDateWithFormat(d, resolveDateFormat(options));
}

/** User-facing time: business 24h/12h. Schedule slots use UTC wall-clock via formatScheduleTime. */
export function formatTimeDisplay(
  input: Date | string,
  _locale?: string,
  timeZoneOrOptions: string | DateDisplayOptions = 'UTC',
  maybeOptions?: DateDisplayOptions,
): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const options =
    typeof timeZoneOrOptions === 'string'
      ? { ...maybeOptions, timeZone: timeZoneOrOptions }
      : timeZoneOrOptions;
  return formatTimeWithFormat(
    d,
    resolveTimeFormat(options),
    options.timeZone ?? 'UTC',
  );
}

/**
 * Schedule/booking times are stored with UTC hour/minute matching business wall clock
 * (e.g. 10:00 in the dashboard = 10:00 UTC). Use this for public booking slot labels.
 */
export function formatScheduleTime(
  input: Date | string,
  _locale?: string,
  options?: DateDisplayOptions,
): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return formatTimeWithFormat(d, resolveTimeFormat(options), 'UTC');
}

export function formatScheduleTimeRange(
  start: Date | string,
  end: Date | string,
  locale?: string,
  options?: DateDisplayOptions,
): string {
  return `${formatScheduleTime(start, locale, options)}–${formatScheduleTime(end, locale, options)}`;
}

export function formatTimeRangeDisplay(
  start: Date | string,
  end: Date | string,
  locale?: string,
  timeZoneOrOptions: string | DateDisplayOptions = 'UTC',
  maybeOptions?: DateDisplayOptions,
): string {
  const options =
    typeof timeZoneOrOptions === 'string'
      ? { ...maybeOptions, timeZone: timeZoneOrOptions }
      : timeZoneOrOptions;
  return `${formatTimeDisplay(start, locale, options)}–${formatTimeDisplay(end, locale, options)}`;
}

/** Date + schedule time range for booking summaries. */
export function formatBookingDateTimeRange(
  start: Date | string,
  end: Date | string,
  locale?: string,
  options?: DateDisplayOptions,
): string {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  return `${formatDateDisplay(startDate, locale, options)} · ${formatScheduleTimeRange(start, end, locale, options)}`;
}

/** Normalize user/LLM date to ISO day for APIs and date inputs. */
export function toIsoDay(value: string, options?: DateDisplayOptions): string {
  const key = parseBusinessDateToKey(value, resolveDateFormat(options));
  return key ?? value;
}

export function todayDisplay(timeZone?: string, options?: DateDisplayOptions): string {
  const key = getTodayDateKey(timeZone);
  return formatDateKeyWithFormat(key, resolveDateFormat(options));
}

/** End of UTC day — valid through the selected calendar day (promo codes, gift cards). */
export function dateKeyToExpiresAtEndOfDay(day: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return `${day}T23:59:59.999Z`;
}

export function isExpiredAt(expiresAt: string | Date | null | undefined): boolean {
  if (!expiresAt) return false;
  const d = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

