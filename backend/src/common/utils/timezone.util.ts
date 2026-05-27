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
