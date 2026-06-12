import {
  type BusinessDateFormat,
  type BusinessTimeFormat,
  formatDateWithFormat,
  formatTimeWithFormat,
  readBusinessDateFormatSettings,
} from './business-date-format.util.js';
import {
  addDaysToDateKey,
  getDateKeyInTimezone,
  resolveTimezone,
} from './timezone.util.js';

export { readBusinessDateFormatSettings } from './business-date-format.util.js';

export interface DateDisplayOptions {
  dateFormat?: BusinessDateFormat;
  timeFormat?: BusinessTimeFormat;
  timeZone?: string;
}

function resolveDateFormat(
  options?: DateDisplayOptions,
): BusinessDateFormat | undefined {
  return options?.dateFormat;
}

function resolveTimeFormat(
  options?: DateDisplayOptions,
): BusinessTimeFormat | undefined {
  return options?.timeFormat;
}

/** DD/MM/YYYY from YYYY-MM-DD calendar key. */
export function dateKeyToDisplay(dateKey: string): string {
  const [yyyy, mm, dd] = dateKey.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

/** Calendar date key (YYYY-MM-DD) for "now" in the given timezone. */
export function getTodayDateKey(timeZone = 'UTC'): string {
  return getDateKeyInTimezone(new Date(), timeZone);
}

function intlLocale(locale?: string): string | undefined {
  if (locale === 'hy') return 'hy-AM';
  if (locale === 'ru') return 'ru-RU';
  if (locale === 'en') return 'en-GB';
  return undefined;
}

/** User-facing date: business format when provided, else locale-aware or DD/MM/YYYY (UTC). */
export function formatDateDisplay(
  input: Date | string,
  locale?: string,
  options?: DateDisplayOptions,
): string {
  const d =
    typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)
      ? new Date(`${input}T12:00:00.000Z`)
      : typeof input === 'string'
        ? parseDateInput(input)
        : input;
  if (!d || Number.isNaN(d.getTime())) return String(input);
  const dateFormat = resolveDateFormat(options);
  if (dateFormat) {
    return formatDateWithFormat(d, dateFormat);
  }
  const intl = intlLocale(locale);
  if (intl) {
    return new Intl.DateTimeFormat(intl, {
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

/** User-facing time: business 24h/12h when provided, else 24-hour HH:mm (UTC). */
export function formatTimeDisplay(
  input: Date | string,
  options?: DateDisplayOptions,
): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const timeFormat = resolveTimeFormat(options);
  if (timeFormat) {
    return formatTimeWithFormat(d, timeFormat, options?.timeZone ?? 'UTC');
  }
  if (options?.timeZone) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: options.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const hh = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const min = parts.find((p) => p.type === 'minute')?.value ?? '00';
    return `${hh}:${min}`;
  }
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export function formatTimeRangeDisplay(
  start: Date | string,
  end: Date | string,
  locale?: string,
  options?: DateDisplayOptions,
): string {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return `${formatTimeDisplay(start, options)}–${formatTimeDisplay(end, options)}`;
  }
  if (options?.timeFormat) {
    return `${formatTimeDisplay(start, options)}–${formatTimeDisplay(end, options)}`;
  }
  const intl = intlLocale(locale);
  if (intl && typeof Intl.DateTimeFormat.prototype.formatRange === 'function') {
    return new Intl.DateTimeFormat(intl, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatRange(s, e);
  }
  return `${formatTimeDisplay(start, options)}–${formatTimeDisplay(end, options)}`;
}

/** Parse DD/MM/YYYY, legacy DD_MM_YYYY, or YYYY-MM-DD into a UTC midnight Date. */
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

/** Normalize user/LLM date to ISO day for storage and queries. */
export function toIsoDay(value: string, timeZone = 'UTC'): string {
  const relative = resolveRelativeDateKeyword(value, timeZone);
  if (relative) return relative;
  const d = parseDateInput(value);
  if (!d) return value;
  return d.toISOString().split('T')[0];
}

/** Resolve today / tomorrow / yesterday keywords to ISO day in timezone. */
export function resolveRelativeDateKeyword(
  value: string,
  timeZone = 'UTC',
): string | null {
  const tz = resolveTimezone(timeZone);
  const todayKey = getTodayDateKey(tz);
  const lower = value.trim().toLowerCase();
  if (lower === 'today' || lower === 'tonight') return todayKey;
  if (lower === 'tomorrow') return addDaysToDateKey(todayKey, 1, tz);
  if (lower === 'yesterday') return addDaysToDateKey(todayKey, -1, tz);
  return null;
}

/** When prompt mentions today/tomorrow/yesterday, override params.date. */
export function applyRelativeDateFromPrompt(
  params: Record<string, any>,
  prompt?: string,
  timeZone = 'UTC',
): void {
  const tz = resolveTimezone(timeZone);
  const lower = (prompt ?? '').toLowerCase();

  if (/\btomorrow\b/i.test(lower)) {
    params.date = dateKeyToDisplay(
      addDaysToDateKey(getTodayDateKey(tz), 1, tz),
    );
    return;
  }
  if (/\btoday\b/i.test(lower) || /\btonight\b/i.test(lower)) {
    params.date = todayDisplay(tz);
    return;
  }
  if (/\byesterday\b/i.test(lower)) {
    params.date = dateKeyToDisplay(
      addDaysToDateKey(getTodayDateKey(tz), -1, tz),
    );
  }
}

/** Combine ISO/display day + HH:mm into a UTC ISO timestamp. */
export function buildUtcStartTimeFromDayAndTime(
  dayValue: string,
  timeSlot: string,
): string {
  const isoDay = toIsoDay(dayValue);
  const day = parseDateInput(isoDay);
  if (!day) {
    throw new Error(`Invalid booking date: ${dayValue}`);
  }
  const [hours, minutes] = timeSlot
    .split(':')
    .map((part) => parseInt(part, 10));
  day.setUTCHours(hours, minutes ?? 0, 0, 0);
  return day.toISOString();
}

export function todayDisplay(timeZone = 'UTC'): string {
  return dateKeyToDisplay(getTodayDateKey(timeZone));
}
