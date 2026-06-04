/** Parse DD_MM_YYYY, DD/MM/YYYY, or YYYY-MM-DD into a UTC midnight Date. */
export function parseDateInput(value: string): Date | null {
  const display = value.match(/^(\d{2})_(\d{2})_(\d{4})$/);
  if (display) {
    return new Date(`${display[3]}-${display[2]}-${display[1]}T00:00:00.000Z`);
  }
  const slash = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) {
    return new Date(`${slash[3]}-${slash[2]}-${slash[1]}T00:00:00.000Z`);
  }
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function getTodayDateKey(timeZone?: string): string {
  const tz = timeZone ?? getBrowserTimeZone();
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

/** YYYY-MM-DD for HTML date inputs and API day filters (browser timezone). */
export function toDateKey(d: Date, timeZone?: string): string {
  const tz = timeZone ?? getBrowserTimeZone();
  if (Number.isNaN(d.getTime())) return getTodayDateKey(tz);
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
}

export { parseDateKey } from '@/lib/date-key-parse.util';
import { parseDateKey } from '@/lib/date-key-parse.util';

/** Today as a stable Date anchor in the user's timezone. */
export function todayDateAnchor(timeZone?: string): Date {
  return parseDateKey(getTodayDateKey(timeZone)) ?? new Date();
}

/** Add calendar days without UTC day-boundary drift. */
export function addCalendarDays(d: Date, days: number, timeZone?: string): Date {
  const key = toDateKey(d, timeZone);
  const [y, m, day] = key.split('-').map((n) => parseInt(n, 10));
  const shifted = new Date(Date.UTC(y, m - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  const iso = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
  return parseDateKey(iso) ?? shifted;
}

export function parseDisplayDate(input: Date | string): Date | null {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return parseDateKey(input);
  }
  if (typeof input === 'string') return parseDateInput(input);
  return input;
}
