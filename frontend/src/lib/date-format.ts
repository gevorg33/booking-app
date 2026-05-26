/** User-facing date: DD_MM_YYYY (UTC). */
export function formatDateDisplay(input: Date | string): string {
  const d = typeof input === 'string' ? parseDateInput(input) : input;
  if (!d || Number.isNaN(d.getTime())) return String(input);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getUTCFullYear());
  return `${dd}_${mm}_${yyyy}`;
}

/** User-facing time: 24-hour HH:mm (UTC). */
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

export function todayDisplay(): string {
  return formatDateDisplay(new Date());
}
