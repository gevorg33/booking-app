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
  addCalendarDays,
  getBrowserTimeZone,
  getTodayDateKey,
  parseDateInput,
  parseDateKey,
  parseDisplayDate,
  todayDateAnchor,
  toDateKey,
} from '@/lib/calendar-date.util';

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

/** User-facing date: locale-aware short format. */
export function formatDateDisplay(input: Date | string, locale?: string): string {
  const d = parseDisplayDate(input);
  if (!d || Number.isNaN(d.getTime())) return String(input);
  const intlLocale = toIntlLocale(resolveDisplayLocale(locale));
  if (intlLocale) {
    return new Intl.DateTimeFormat(intlLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(d);
  }
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getUTCFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

/** User-facing time: 24-hour HH:mm. Schedule slots use UTC wall-clock via formatScheduleTime. */
export function formatTimeDisplay(
  input: Date | string,
  locale?: string,
  timeZone = 'UTC',
): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const intlLocale = toIntlLocale(resolveDisplayLocale(locale));
  if (intlLocale) {
    return new Intl.DateTimeFormat(intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).format(d);
  }
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

/**
 * Schedule/booking times are stored with UTC hour/minute matching business wall clock
 * (e.g. 10:00 in the dashboard = 10:00 UTC). Use this for public booking slot labels.
 */
export function formatScheduleTime(input: Date | string, locale?: string): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const intlLocale = toIntlLocale(resolveDisplayLocale(locale));
  if (intlLocale) {
    return new Intl.DateTimeFormat(intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(d);
  }
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export function formatScheduleTimeRange(
  start: Date | string,
  end: Date | string,
  locale?: string,
): string {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return `${formatScheduleTime(start, locale)}–${formatScheduleTime(end, locale)}`;
  }
  const intlLocale = toIntlLocale(resolveDisplayLocale(locale));
  if (intlLocale && typeof Intl.DateTimeFormat.prototype.formatRange === 'function') {
    return new Intl.DateTimeFormat(intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).formatRange(s, e);
  }
  return `${formatScheduleTime(start, locale)}–${formatScheduleTime(end, locale)}`;
}

export function formatTimeRangeDisplay(
  start: Date | string,
  end: Date | string,
  locale?: string,
  timeZone = 'UTC',
): string {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return `${formatTimeDisplay(start, locale, timeZone)}–${formatTimeDisplay(end, locale, timeZone)}`;
  }
  const intlLocale = toIntlLocale(resolveDisplayLocale(locale));
  if (intlLocale && typeof Intl.DateTimeFormat.prototype.formatRange === 'function') {
    return new Intl.DateTimeFormat(intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).formatRange(s, e);
  }
  return `${formatTimeDisplay(start, locale, timeZone)}–${formatTimeDisplay(end, locale, timeZone)}`;
}

/** Date + schedule time range for booking summaries. */
export function formatBookingDateTimeRange(
  start: Date | string,
  end: Date | string,
  locale?: string,
): string {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  return `${formatDateDisplay(startDate, locale)} · ${formatScheduleTimeRange(start, end, locale)}`;
}

/** Normalize user/LLM date to ISO day for APIs and date inputs. */
export function toIsoDay(value: string): string {
  const d = parseDateInput(value);
  if (!d) return value;
  return d.toISOString().split('T')[0];
}

export function todayDisplay(timeZone?: string): string {
  const key = getTodayDateKey(timeZone);
  const [yyyy, mm, dd] = key.split('-');
  return `${dd}/${mm}/${yyyy}`;
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

