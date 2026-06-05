import {
  formatDateWithFormat,
  formatTimeWithFormat,
  getActiveBusinessDateFormats,
} from './business-date-format.js';

export function formatDateDisplay(input: Date | string, _locale = 'en'): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const { dateFormat } = getActiveBusinessDateFormats();
  return formatDateWithFormat(d, dateFormat);
}

/** Wall-clock slot labels (UTC hour/minute = business wall time). */
export function formatScheduleTime(input: Date | string, _locale = 'en'): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const { timeFormat } = getActiveBusinessDateFormats();
  return formatTimeWithFormat(d, timeFormat, 'UTC');
}

export function formatScheduleTimeRange(
  start: Date | string,
  end: Date | string,
  locale = 'en',
): string {
  return `${formatScheduleTime(start, locale)}–${formatScheduleTime(end, locale)}`;
}

export function formatDateTimeLabel(iso: string, locale = 'en'): string {
  return `${formatDateDisplay(iso, locale)} ${formatScheduleTime(iso, locale)}`;
}

export function formatBookingDateTimeRange(
  start: Date | string,
  end: Date | string,
  locale = 'en',
): string {
  return `${formatDateDisplay(start, locale)} · ${formatScheduleTimeRange(start, end, locale)}`;
}
