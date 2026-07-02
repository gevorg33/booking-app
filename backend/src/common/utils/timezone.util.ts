import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TZ = 'UTC';

/** When timezone is unset (UTC), infer wall-clock TZ from tenant locale for slot filtering. */
const LOCALE_WALL_CLOCK_TIMEZONES: Record<string, string> = {
  hy: 'Asia/Yerevan',
};

export function resolveTimezone(tz?: string | null): string {
  if (!tz || tz.trim() === '') return DEFAULT_TZ;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

export function pickTimezone(
  ...candidates: (string | null | undefined)[]
): string {
  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim() !== '') {
      return resolveTimezone(String(candidate).trim());
    }
  }
  return DEFAULT_TZ;
}

/**
 * Schedule slots store UTC hour/minute as business wall clock. When timezone is still
 * the DB default (UTC), infer from tenant locale so "past today" filtering matches
 * local shop hours (e.g. hy → Asia/Yerevan).
 */
export function resolveBusinessWallClockTimezone(
  timezone?: string | null,
  locale?: string | null,
): string {
  const tz = resolveTimezone(timezone);
  if (tz !== DEFAULT_TZ) return tz;
  const loc = locale?.trim().toLowerCase();
  if (loc && LOCALE_WALL_CLOCK_TIMEZONES[loc]) {
    return LOCALE_WALL_CLOCK_TIMEZONES[loc];
  }
  return DEFAULT_TZ;
}

/** Calendar date (YYYY-MM-DD) for an instant in a timezone. */
export function getDateKeyInTimezone(instant: Date, timeZone: string): string {
  return dayjs(instant).tz(resolveTimezone(timeZone)).format('YYYY-MM-DD');
}

/** UTC range covering a full calendar day in the given timezone. */
export function getUtcBoundsForDateKey(
  dateKey: string,
  timeZone: string,
): { start: Date; end: Date } {
  const tz = resolveTimezone(timeZone);
  return {
    start: dayjs.tz(`${dateKey} 00:00:00`, tz).utc().toDate(),
    end: dayjs.tz(`${dateKey} 23:59:59`, tz).utc().toDate(),
  };
}

export function addDaysToDateKey(
  dateKey: string,
  days: number,
  timeZone: string,
): string {
  return dayjs
    .tz(dateKey, resolveTimezone(timeZone))
    .add(days, 'day')
    .format('YYYY-MM-DD');
}

/** e.g. "27 May, Tuesday" in business timezone (localized when locale is en/hy/ru). */
export function formatZonedDateLabel(
  dateKey: string,
  timeZone: string,
  locale: 'en' | 'hy' | 'ru' = 'en',
): string {
  const tz = resolveTimezone(timeZone);
  const instant = dayjs.tz(dateKey, tz).toDate();
  const intl = locale === 'hy' ? 'hy-AM' : locale === 'ru' ? 'ru-RU' : 'en-GB';
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

export function formatZonedTime(
  instant: Date | string,
  timeZone: string,
): string {
  return dayjs(instant).tz(resolveTimezone(timeZone)).format('HH:mm');
}

/** Wall-clock "now" in business timezone (date + minutes since midnight). */
export function getWallClockNow(timeZone: string): {
  dateKey: string;
  minutes: number;
} {
  return getWallClockNowFromInstant(new Date(), timeZone);
}

export type WallClockNow = {
  dateKey: string;
  minutes: number;
};

/** Wall-clock calendar position for a specific instant in a timezone. */
export function getWallClockNowFromInstant(
  instant: Date,
  timeZone: string,
): WallClockNow {
  const d = dayjs(instant).tz(resolveTimezone(timeZone));
  return {
    dateKey: d.format('YYYY-MM-DD'),
    minutes: d.hour() * 60 + d.minute(),
  };
}

export function wallClockMinutesFromDate(instant: Date): number {
  return instant.getUTCHours() * 60 + instant.getUTCMinutes();
}

export function wallClockDateKeyFromDate(instant: Date): string {
  return instant.toISOString().split('T')[0];
}

export function isWallClockStartInPastAt(
  startTime: Date,
  wallNow: WallClockNow,
): boolean {
  const isoDay = wallClockDateKeyFromDate(startTime);
  const slotMinutes = wallClockMinutesFromDate(startTime);
  if (isoDay < wallNow.dateKey) return true;
  if (isoDay > wallNow.dateKey) return false;
  return slotMinutes <= wallNow.minutes;
}

export function isWallClockStartStrictlyFutureAt(
  startTime: Date,
  wallNow: WallClockNow,
): boolean {
  const isoDay = wallClockDateKeyFromDate(startTime);
  const slotMinutes = wallClockMinutesFromDate(startTime);
  if (isoDay < wallNow.dateKey) return false;
  if (isoDay > wallNow.dateKey) return true;
  return slotMinutes > wallNow.minutes;
}

export function isWallClockRangeActiveAt(
  startTime: Date,
  endTime: Date,
  wallNow: WallClockNow,
): boolean {
  return (
    isWallClockStartInPastAt(startTime, wallNow) &&
    !isWallClockStartInPastAt(endTime, wallNow)
  );
}

export function minutesUntilWallClockStartAt(
  startTime: Date,
  wallNow: WallClockNow,
): number {
  const isoDay = wallClockDateKeyFromDate(startTime);
  const slotMinutes = wallClockMinutesFromDate(startTime);
  if (isoDay < wallNow.dateKey) return 0;
  if (isoDay > wallNow.dateKey) {
    const dayDiff = Math.round(
      (Date.parse(`${isoDay}T00:00:00.000Z`) -
        Date.parse(`${wallNow.dateKey}T00:00:00.000Z`)) /
        86_400_000,
    );
    return Math.max(0, dayDiff * 24 * 60 + slotMinutes - wallNow.minutes);
  }
  return Math.max(0, slotMinutes - wallNow.minutes);
}

export function computeWallClockNowMarkerPercent(
  rangeStart: Date,
  rangeEnd: Date,
  wallNow: WallClockNow,
): number | null {
  const startDay = wallClockDateKeyFromDate(rangeStart);
  const endDay = wallClockDateKeyFromDate(rangeEnd);
  const startMin = wallClockMinutesFromDate(rangeStart);
  const endMin = wallClockMinutesFromDate(rangeEnd);
  if (endMin <= startMin || startDay !== endDay) return null;
  if (wallNow.dateKey !== startDay) {
    if (wallNow.dateKey < startDay) return null;
    if (wallNow.dateKey > endDay) return null;
  }
  if (wallNow.minutes < startMin || wallNow.minutes > endMin) return null;
  const percent = ((wallNow.minutes - startMin) / (endMin - startMin)) * 100;
  return Math.min(100, Math.max(0, Math.round(percent * 10) / 10));
}

function wallClockMinutesFromTimeSlot(timeSlot: string): number {
  const [h, m] = timeSlot.split(':').map((part) => parseInt(part, 10));
  return h * 60 + (m ?? 0);
}

/**
 * Bookings store UTC date/time components as wall-clock values (13:00 UTC = 13:00 on the calendar).
 * Compare against business-local now, not real UTC instants.
 */
export function isWallClockStartInPast(
  startTime: Date,
  timeZone: string,
): boolean {
  return isWallClockStartInPastAt(startTime, getWallClockNow(timeZone));
}

/** Whether a calendar slot is still bookable (after now, optionally not before HH:MM). */
export function isWallClockSlotBookable(
  isoDay: string,
  timeSlot: string,
  timeZone: string,
  notBeforeTime?: string | null,
): boolean {
  const now = getWallClockNow(timeZone);
  const slotMin = wallClockMinutesFromTimeSlot(timeSlot);
  const notBeforeMin = notBeforeTime
    ? wallClockMinutesFromTimeSlot(notBeforeTime)
    : null;

  if (isoDay < now.dateKey) return false;

  if (isoDay === now.dateKey) {
    const minExclusive = Math.max(now.minutes, notBeforeMin ?? -1);
    return slotMin > minExclusive;
  }

  if (notBeforeMin != null) return slotMin >= notBeforeMin;
  return true;
}
