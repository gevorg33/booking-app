import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TZ = 'UTC';

export function resolveTimezone(tz?: string | null): string {
  if (!tz || tz.trim() === '') return DEFAULT_TZ;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

export function pickTimezone(...candidates: (string | null | undefined)[]): string {
  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim() !== '') {
      return resolveTimezone(String(candidate).trim());
    }
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

export function addDaysToDateKey(dateKey: string, days: number, timeZone: string): string {
  return dayjs.tz(dateKey, resolveTimezone(timeZone)).add(days, 'day').format('YYYY-MM-DD');
}

/** e.g. "27 May, Tuesday" in business timezone. */
export function formatZonedDateLabel(dateKey: string, timeZone: string): string {
  const d = dayjs.tz(dateKey, resolveTimezone(timeZone));
  return `${d.format('D')} ${d.format('MMMM')}, ${d.format('dddd')}`;
}

export function formatZonedTime(instant: Date | string, timeZone: string): string {
  return dayjs(instant).tz(resolveTimezone(timeZone)).format('HH:mm');
}

/** Wall-clock "now" in business timezone (date + minutes since midnight). */
export function getWallClockNow(timeZone: string): { dateKey: string; minutes: number } {
  const d = dayjs().tz(resolveTimezone(timeZone));
  return {
    dateKey: d.format('YYYY-MM-DD'),
    minutes: d.hour() * 60 + d.minute(),
  };
}

function wallClockMinutesFromTimeSlot(timeSlot: string): number {
  const [h, m] = timeSlot.split(':').map((part) => parseInt(part, 10));
  return h * 60 + (m ?? 0);
}

/**
 * Bookings store UTC date/time components as wall-clock values (13:00 UTC = 13:00 on the calendar).
 * Compare against business-local now, not real UTC instants.
 */
export function isWallClockStartInPast(startTime: Date, timeZone: string): boolean {
  const isoDay = startTime.toISOString().split('T')[0];
  const slotMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
  const now = getWallClockNow(timeZone);
  if (isoDay < now.dateKey) return true;
  if (isoDay > now.dateKey) return false;
  return slotMinutes <= now.minutes;
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
  const notBeforeMin = notBeforeTime ? wallClockMinutesFromTimeSlot(notBeforeTime) : null;

  if (isoDay < now.dateKey) return false;

  if (isoDay === now.dateKey) {
    const minExclusive = Math.max(now.minutes, notBeforeMin ?? -1);
    return slotMin > minExclusive;
  }

  if (notBeforeMin != null) return slotMin >= notBeforeMin;
  return true;
}
