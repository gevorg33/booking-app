export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

import {
  DEFAULT_BUSINESS_DATE_FORMAT,
  DEFAULT_BUSINESS_TIME_FORMAT,
  formatDateWithFormat,
  formatTimeWithFormat,
  normalizeBusinessDateFormat,
  normalizeBusinessTimeFormat,
  parseBusinessDateInput,
  parseBusinessDateToKey,
} from './business-date-format';
import { useAuthStore } from '../services/auth-store';

function resolveBusinessFormats() {
  const { business } = useAuthStore.getState();
  return {
    dateFormat:
      normalizeBusinessDateFormat(business?.dateFormat) ?? DEFAULT_BUSINESS_DATE_FORMAT,
    timeFormat:
      normalizeBusinessTimeFormat(business?.timeFormat) ?? DEFAULT_BUSINESS_TIME_FORMAT,
  };
}

export function getTodayDateKey(timeZone?: string): string {
  const tz = timeZone ?? getBrowserTimeZone();
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

export function parseDateKey(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toDateKey(d: Date, timeZone?: string): string {
  const tz = timeZone ?? getBrowserTimeZone();
  if (Number.isNaN(d.getTime())) return getTodayDateKey(tz);
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
}

export function addCalendarDays(d: Date, days: number, timeZone?: string): Date {
  const key = toDateKey(d, timeZone);
  const [y, m, day] = key.split('-').map((n) => parseInt(n, 10));
  const shifted = new Date(Date.UTC(y, m - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  const iso = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
  return parseDateKey(iso) ?? shifted;
}

export function formatDateDisplay(input: Date | string, _locale?: string): string {
  const { dateFormat } = resolveBusinessFormats();
  const d =
    typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)
      ? (parseDateKey(input) ?? new Date(input))
      : typeof input === 'string'
        ? (parseBusinessDateInput(input, dateFormat) ?? new Date(input))
        : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return formatDateWithFormat(d, dateFormat);
}

export function parseTypedBusinessDateToKey(value: string): string | null {
  const { dateFormat } = resolveBusinessFormats();
  return parseBusinessDateToKey(value, dateFormat);
}

export {
  businessDateFormatPattern,
  businessDateInputPlaceholder,
  parseBusinessDateInput,
  parseBusinessDateToKey,
  readAuthBusinessDateFormats,
} from './business-date-format';

export function formatTimeDisplay(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const { timeFormat } = resolveBusinessFormats();
  return formatTimeWithFormat(d, timeFormat, 'UTC');
}

export function formatTimeRangeDisplay(start: Date | string, end: Date | string): string {
  return `${formatTimeDisplay(start)}–${formatTimeDisplay(end)}`;
}

export function todayDisplay(): string {
  return formatDateDisplay(new Date());
}

export function formatMinutesDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}
