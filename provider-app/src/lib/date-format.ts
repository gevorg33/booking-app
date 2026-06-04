export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function resolveAppLocale(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const lang = navigator.language?.slice(0, 2).toLowerCase();
  if (lang === 'hy' || lang === 'ru' || lang === 'en') return lang;
  return undefined;
}

function toIntlLocale(locale?: string): string | undefined {
  const resolved = locale ?? resolveAppLocale();
  if (resolved === 'hy') return 'hy-AM';
  if (resolved === 'ru') return 'ru-RU';
  if (resolved === 'en') return 'en-GB';
  return undefined;
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

export function formatDateDisplay(input: Date | string, locale?: string): string {
  const d =
    typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)
      ? (parseDateKey(input) ?? new Date(input))
      : typeof input === 'string'
        ? new Date(input)
        : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const intlLocale = toIntlLocale(locale) ?? 'en-GB';
  return new Intl.DateTimeFormat(intlLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function formatTimeDisplay(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export function formatTimeRangeDisplay(start: Date | string, end: Date | string): string {
  return `${formatTimeDisplay(start)}–${formatTimeDisplay(end)}`;
}

export function todayDisplay(): string {
  return formatDateDisplay(new Date());
}
