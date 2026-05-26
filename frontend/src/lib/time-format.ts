const TIME_24_RE = /^(\d{1,2}):(\d{2})$/;
const TIME_12_RE = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

/** Normalize any time string to 24-hour HH:mm. */
export function normalizeTime24(value: string): string {
  if (!value) return '00:00';

  const trimmed = value.trim();

  const match12 = trimmed.match(TIME_12_RE);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = parseInt(match12[2], 10);
    const isPm = match12[3].toUpperCase() === 'PM';
    if (hour === 12) hour = isPm ? 12 : 0;
    else if (isPm) hour += 12;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  const match24 = trimmed.match(TIME_24_RE);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const minute = parseInt(match24[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }

  return trimmed;
}

export function isValidTime24(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(normalizeTime24(value));
}

export function timeToMinutes(value: string): number {
  const normalized = normalizeTime24(value);
  const [h, m] = normalized.split(':').map(Number);
  return h * 60 + m;
}

export function isTimeInRange(value: string, min?: string, max?: string): boolean {
  if (!isValidTime24(value)) return false;
  const t = timeToMinutes(value);
  if (min && isValidTime24(min) && t < timeToMinutes(min)) return false;
  if (max && isValidTime24(max) && t > timeToMinutes(max)) return false;
  return true;
}
