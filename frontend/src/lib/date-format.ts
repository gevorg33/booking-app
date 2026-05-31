/** Review date for public profile cards: "29 May 2026". */
export function formatPublicReviewDate(input: Date | string, timeZone = 'UTC'): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(d);
}

/** User-facing date: locale-aware short format. */
export function formatDateDisplay(input: Date | string, locale?: string): string {
  const d = typeof input === 'string' ? parseDateInput(input) : input;
  if (!d || Number.isNaN(d.getTime())) return String(input);
  const intlLocale =
    locale === 'hy' ? 'hy-AM' : locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : undefined;
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
  return `${dd}_${mm}_${yyyy}`;
}

/** User-facing time: 24-hour HH:mm (defaults to UTC). Pass timeZone for timezone-aware display. */
export function formatTimeDisplay(input: Date | string, timeZone = 'UTC'): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(d);
}

/**
 * Schedule/booking times are stored with UTC hour/minute matching business wall clock
 * (e.g. 10:00 in the dashboard = 10:00 UTC). Use this for public booking slot labels.
 */
export function formatScheduleTime(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export function formatTimeRangeDisplay(
  start: Date | string,
  end: Date | string,
  timeZone = 'UTC',
): string {
  return `${formatTimeDisplay(start, timeZone)}–${formatTimeDisplay(end, timeZone)}`;
}

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

/** Normalize user/LLM date to ISO day for APIs and date inputs. */
export function toIsoDay(value: string): string {
  const d = parseDateInput(value);
  if (!d) return value;
  return d.toISOString().split('T')[0];
}

export function getTodayDateKey(timeZone?: string): string {
  const tz = timeZone ?? getBrowserTimeZone();
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** YYYY-MM-DD for HTML date inputs and API day filters (browser timezone). */
export function toDateKey(d: Date, timeZone?: string): string {
  const tz = timeZone ?? getBrowserTimeZone();
  if (Number.isNaN(d.getTime())) return getTodayDateKey(tz);
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
}

/** Stable Date anchor for a calendar day key (UTC noon on that day). */
export function parseDateKey(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

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

export function todayDisplay(timeZone?: string): string {
  const key = getTodayDateKey(timeZone);
  const [yyyy, mm, dd] = key.split('-');
  return `${dd}_${mm}_${yyyy}`;
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
