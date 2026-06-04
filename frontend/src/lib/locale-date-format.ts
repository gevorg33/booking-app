import { resolveDisplayLocale, toIntlLocale } from '@/lib/app-locale';
import {
  addCalendarDays,
  getTodayDateKey,
  parseDateKey,
  parseDisplayDate,
} from '@/lib/calendar-date.util';

/** Long label for YYYY-MM-DD in a business timezone, e.g. "4 June, Thursday". */
export function formatDateKeyPublicLabel(
  dateKey: string,
  locale?: string,
  timeZone = 'UTC',
): string {
  const anchor = parseDateKey(dateKey);
  if (!anchor) return dateKey;
  const intlLocale = toIntlLocale(locale) ?? toIntlLocale(resolveDisplayLocale()) ?? 'en-GB';
  const monthDay = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'long',
    timeZone,
  }).format(anchor);
  const weekday = new Intl.DateTimeFormat(intlLocale, {
    weekday: 'long',
    timeZone,
  }).format(anchor);
  return `${monthDay}, ${weekday}`;
}

/** 0 = Sunday (Date#getDay). */
export function formatWeekdayShortByDayIndex(dayIndex: number, locale?: string): string {
  const intlLocale = toIntlLocale(resolveDisplayLocale(locale)) ?? 'en-GB';
  const anchor = parseDateKey('2024-01-07');
  if (!anchor) return '';
  const d = addCalendarDays(anchor, dayIndex, 'UTC');
  return new Intl.DateTimeFormat(intlLocale, { weekday: 'short', timeZone: 'UTC' }).format(d);
}

export function formatDateKeyStripParts(
  dateKey: string,
  locale?: string,
  timeZone = 'UTC',
): { weekday: string; dayNum: string; month: string } {
  const anchor = parseDateKey(dateKey);
  if (!anchor) {
    return { weekday: '', dayNum: '', month: '' };
  }
  const intlLocale = toIntlLocale(resolveDisplayLocale(locale)) ?? 'en-GB';
  return {
    weekday: new Intl.DateTimeFormat(intlLocale, { weekday: 'short', timeZone }).format(anchor),
    dayNum: new Intl.DateTimeFormat(intlLocale, { day: 'numeric', timeZone }).format(anchor),
    month: new Intl.DateTimeFormat(intlLocale, { month: 'short', timeZone }).format(anchor),
  };
}

/** Appointment header: weekday + month + day (order follows locale). */
export function formatAppointmentDateLabel(
  input: Date | string,
  locale?: string,
  timeZone = 'UTC',
): string {
  const d = parseDisplayDate(input);
  if (!d || Number.isNaN(d.getTime())) return String(input);
  const intlLocale = toIntlLocale(resolveDisplayLocale(locale)) ?? 'en-GB';
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone,
  }).format(d);
}

/** Nearest-slot date phrase with localized "today" when the date is today in the business TZ. */
export function formatNearestSlotDateLabel(
  dateKey: string,
  locale?: string,
  timeZone = 'UTC',
  todayInline = 'today',
): string {
  const formatted = formatDateKeyPublicLabel(dateKey, locale, timeZone);
  if (dateKey === getTodayDateKey(timeZone)) {
    return `${todayInline}, ${formatted}`;
  }
  return formatted;
}

/** Prefer API-localized label (SSR/hydration-safe); format on the client only as fallback. */
export function resolveNearestSlotDateLabel(
  provider: { nearestDate?: string | null; nearestDateLabel?: string | null },
  locale?: string,
  timeZone = 'UTC',
  todayInline = 'today',
): string | null {
  if (provider.nearestDateLabel) return provider.nearestDateLabel;
  if (provider.nearestDate) {
    return formatNearestSlotDateLabel(provider.nearestDate, locale, timeZone, todayInline);
  }
  return null;
}
