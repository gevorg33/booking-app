const TIME_24_RE = /^(\d{1,2}):(\d{2})$/;
const TIME_12_RE = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

/** Normalize any time string to 24-hour HH:mm. */
export function normalizeTime24(value: string): string {
  if (!value) return '00:00';

  const trimmed = value.trim();

  const match12 = trimmed.match(TIME_12_RE);
  // e2e-bug.469 / §219 — only a genuine 12-hour clock reading gets the +12.
  // Without the `hour <= 12` guard this branch *fabricated* impossible times
  // rather than passing input through: "13:30 PM" came back as "25:30", which
  // is not the documented fallback (return the input unchanged) but an invented
  // value that no validator upstream had reason to expect. A meridiem on an
  // already-24h time is noise, so decline here and let the 24-hour branch below
  // read it — the same rule `extractTimeSlotFromPrompt` already applies when it
  // reads "at 14:00 pm" as 14:00.
  if (match12 && parseInt(match12[1], 10) <= 12) {
    let hour = parseInt(match12[1], 10);
    const minute = parseInt(match12[2], 10);
    const isPm = match12[3].toUpperCase() === 'PM';
    if (hour === 12) hour = isPm ? 12 : 0;
    else if (isPm) hour += 12;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  // A meridiem that survived the guard above is stripped so the 24-hour branch
  // can read the clock part; anything still malformed falls through unchanged.
  const meridiemStripped = trimmed.replace(/\s*(AM|PM)$/i, '');

  const match24 = meridiemStripped.match(TIME_24_RE);
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
