import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import { formatTimeDisplay } from '../utils/date-format.util.js';
import { resolveTimezone } from '../utils/timezone.util.js';
import type { AppLocale } from './messages.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const TODAY_INLINE: Record<AppLocale, string> = {
  en: 'today',
  hy: 'այսօր',
  ru: 'сегодня',
};

export function intlLocaleTag(locale: AppLocale): string {
  if (locale === 'hy') return 'hy-AM';
  if (locale === 'ru') return 'ru-RU';
  return 'en-GB';
}

/** 0 = Sunday (Date#getDay / dayjs.day). */
export function formatWeekdayShortByDayIndex(
  dayIndex: number,
  locale: AppLocale,
): string {
  const anchor = dayjs.utc('2024-01-07').add(dayIndex, 'day').toDate();
  return new Intl.DateTimeFormat(intlLocaleTag(locale), {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(anchor);
}

export function formatDateKeyStripParts(
  dateKey: string,
  timeZone: string,
  locale: AppLocale,
): { weekday: string; dayNum: string; month: string } {
  const tz = resolveTimezone(timeZone);
  const instant = dayjs.tz(dateKey, tz).toDate();
  const intl = intlLocaleTag(locale);
  return {
    weekday: new Intl.DateTimeFormat(intl, {
      weekday: 'short',
      timeZone: tz,
    }).format(instant),
    dayNum: new Intl.DateTimeFormat(intl, {
      day: 'numeric',
      timeZone: tz,
    }).format(instant),
    month: new Intl.DateTimeFormat(intl, {
      month: 'short',
      timeZone: tz,
    }).format(instant),
  };
}

/** Checkout-style: "Thursday, 4 June" (order follows locale). */
export function formatDateKeyAppointmentLabel(
  dateKey: string,
  timeZone: string,
  locale: AppLocale,
): string {
  const tz = resolveTimezone(timeZone);
  const instant = dayjs.tz(dateKey, tz).toDate();
  return new Intl.DateTimeFormat(intlLocaleTag(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: tz,
  }).format(instant);
}

/** Long label for a calendar date key in a business timezone, e.g. "4 June, Thursday". */
export function formatDateKeyPublicLabel(
  dateKey: string,
  timeZone: string,
  locale: AppLocale,
): string {
  const tz = resolveTimezone(timeZone);
  const instant = dayjs.tz(dateKey, tz).toDate();
  const intl = intlLocaleTag(locale);
  const monthDay = new Intl.DateTimeFormat(intl, {
    day: 'numeric',
    month: 'long',
    timeZone: tz,
  }).format(instant);
  const weekday = new Intl.DateTimeFormat(intl, {
    weekday: 'long',
    timeZone: tz,
  }).format(instant);
  return `${monthDay}, ${weekday}`;
}

const NEAREST_SLOT_AT_CONNECTOR: Record<AppLocale, string> = {
  en: 'at',
  hy: 'ժամը',
  ru: 'в',
};

/** Nearest-slot start time, e.g. "June 13 at 09:00" (wall-clock UTC components). */
export function formatNearestSlotStartTimeLabel(
  startTime: string,
  locale: AppLocale = 'en',
): string {
  const d = new Date(startTime);
  if (Number.isNaN(d.getTime())) return startTime;

  const intl = locale === 'en' ? 'en-US' : intlLocaleTag(locale);
  const month = new Intl.DateTimeFormat(intl, {
    month: 'long',
    timeZone: 'UTC',
  }).format(d);
  const day = new Intl.DateTimeFormat(intl, {
    day: 'numeric',
    timeZone: 'UTC',
  }).format(d);
  const datePart = locale === 'ru' ? `${day} ${month}` : `${month} ${day}`;
  const connector = NEAREST_SLOT_AT_CONNECTOR[locale] ?? 'at';
  return `${datePart} ${connector} ${formatTimeDisplay(startTime)}`;
}

/** Nearest-slot heading date, with localized "today" prefix when applicable. */
export function formatNearestSlotDateLabel(
  dateKey: string,
  todayDateKey: string,
  timeZone: string,
  locale: AppLocale,
): string {
  const formatted = formatDateKeyPublicLabel(dateKey, timeZone, locale);
  if (dateKey === todayDateKey) {
    return `${TODAY_INLINE[locale]}, ${formatted}`;
  }
  return formatted;
}
