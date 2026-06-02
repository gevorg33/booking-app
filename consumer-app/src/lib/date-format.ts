export function formatDateDisplay(input: Date | string, locale = 'en'): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const intlLocale = locale === 'hy' ? 'hy-AM' : locale === 'ru' ? 'ru-RU' : 'en-GB';
  return new Intl.DateTimeFormat(intlLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/** Wall-clock slot labels (UTC hour/minute = business wall time). */
export function formatScheduleTime(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export function formatDateTimeLabel(iso: string, locale = 'en'): string {
  return `${formatDateDisplay(iso, locale)} ${formatScheduleTime(iso)}`;
}
