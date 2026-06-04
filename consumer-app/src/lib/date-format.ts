export function toIntlLocale(locale?: string): string | undefined {
  if (locale === 'hy') return 'hy-AM';
  if (locale === 'ru') return 'ru-RU';
  if (locale === 'en') return 'en-GB';
  return undefined;
}

export function formatDateDisplay(input: Date | string, locale = 'en'): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const intlLocale = toIntlLocale(locale) ?? 'en-GB';
  return new Intl.DateTimeFormat(intlLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/** Wall-clock slot labels (UTC hour/minute = business wall time). */
export function formatScheduleTime(input: Date | string, locale = 'en'): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const intlLocale = toIntlLocale(locale) ?? 'en-GB';
  return new Intl.DateTimeFormat(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(d);
}

export function formatScheduleTimeRange(
  start: Date | string,
  end: Date | string,
  locale = 'en',
): string {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return `${formatScheduleTime(start, locale)}–${formatScheduleTime(end, locale)}`;
  }
  const intlLocale = toIntlLocale(locale) ?? 'en-GB';
  if (typeof Intl.DateTimeFormat.prototype.formatRange === 'function') {
    return new Intl.DateTimeFormat(intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).formatRange(s, e);
  }
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
