/**
 * Post-LLM structural extraction only (dates, times, entities, status).
 * pipe-1.13.3 / acc-3.14 — paraphrase intent meaning lives in semantic utils.
 */
import { STRUCTURAL_EXTRACTORS_PIPE_MARKER } from './ai-structural-extractors.boundary.js';

export { STRUCTURAL_EXTRACTORS_PIPE_MARKER };
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import {
  formatDateDisplay,
  getTodayDateKey,
  resolveRelativeDateKeyword,
  todayDisplay,
} from '../../common/utils/date-format.util.js';
import { resolveTimezone } from '../../common/utils/timezone.util.js';
import {
  extractSingleDateFromPrompt,
  fuzzyMatchServiceByName,
  hasExplicitTimeWindow,
  normalizeServiceLookup,
  parseEarliestBookingTimeFromPrompt,
  parseTimeWindow,
} from './ai-orchestration.helpers.js';
import { parseTimeOfDayWindow } from './ai-operations.util.js';
import { isFirstAvailableBookingPrompt } from './booking-first-available.semantic.util.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
dayjs.extend(utc);
dayjs.extend(timezone);

const BOOKING_STATUS_ALIASES: Record<string, string> = {
  cancelled: 'cancelled',
  canceled: 'cancelled',
  'no-show': 'no_show',
  no_show: 'no_show',
  noshow: 'no_show',
  done: 'completed',
  finished: 'completed',
  confirmed: 'confirmed',
  pending: 'pending',
  completed: 'completed',
  'in-progress': 'in_progress',
  in_progress: 'in_progress',
};

export function extractLimitFromPrompt(
  prompt: string,
  defaultLimit = 5,
): number {
  const topMatch = prompt.match(/\btop\s+(\d{1,2})\b/i);
  if (topMatch) return Math.min(parseInt(topMatch[1], 10), 20);
  const firstMatch = prompt.match(/\b(\d{1,2})\s+(top|best|highest)\b/i);
  if (firstMatch) return Math.min(parseInt(firstMatch[1], 10), 20);
  return defaultLimit;
}

export function extractStatusFilterFromPrompt(prompt: string): string | null {
  const filters = extractStatusFiltersFromPrompt(prompt);
  return filters.length === 1 ? filters[0] : (filters[0] ?? null);
}

export function extractStatusFiltersFromPrompt(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const found = new Set<string>();
  for (const [alias, status] of Object.entries(BOOKING_STATUS_ALIASES)) {
    if (
      new RegExp(`\\b${alias.replace(/[-_]/g, '[\\s-_]?')}\\b`, 'i').test(lower)
    ) {
      found.add(status);
    }
  }
  return [...found];
}

/** Parse hour + optional minutes with am/pm into 24h HH:mm. */
export function parseAmPmClockTime(
  hour: number,
  minute: number | undefined,
  ampm: string,
): string {
  const isPm = /^p/i.test(ampm.trim());
  let h = hour;
  if (isPm && h !== 12) h += 12;
  if (!isPm && h === 12) h = 0;
  const m = minute ?? 0;
  return normalizeTime24(`${h}:${String(m).padStart(2, '0')}`);
}

export function extractHideLimitFromPrompt(prompt: string): number | null {
  const lower = prompt.toLowerCase();
  if (/\b(one|single|a)\s+(appointment|booking)\b/i.test(lower)) return 1;
  const countMatch = lower.match(
    /\b(?:hide|remove|clear|delete)\s+(\d{1,2})\s+(?:appointment|booking)/i,
  );
  if (countMatch) return Math.min(parseInt(countMatch[1], 10), 50);
  return null;
}

export function extractTimeSlotFromPrompt(prompt: string): string | null {
  const at24 = prompt.match(/\b(?:at|@)\s*(\d{1,2}):(\d{2})\b/i);
  if (at24) return normalizeTime24(`${at24[1]}:${at24[2]}`);

  const bare24 = prompt.match(/\b(\d{1,2}):(\d{2})\b/);
  if (bare24) return normalizeTime24(`${bare24[1]}:${bare24[2]}`);

  const amPm = prompt.match(
    /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/i,
  );
  if (amPm) {
    return parseAmPmClockTime(
      parseInt(amPm[1], 10),
      amPm[2] != null ? parseInt(amPm[2], 10) : undefined,
      amPm[3],
    );
  }

  const atHourOnly = prompt.match(/\b(?:at|@)\s*(\d{1,2})\b(?!\s*:\d)/i);
  if (atHourOnly) {
    const h = parseInt(atHourOnly[1], 10);
    if (h >= 0 && h <= 23) return normalizeTime24(`${h}:00`);
  }

  return null;
}

export function extractRescheduleTimeSlotFromPrompt(
  prompt: string,
): string | null {
  const toAmPm = prompt.match(
    /\bto\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/i,
  );
  if (toAmPm) {
    return parseAmPmClockTime(
      parseInt(toAmPm[1], 10),
      toAmPm[2] != null ? parseInt(toAmPm[2], 10) : undefined,
      toAmPm[3],
    );
  }

  const toAt = prompt.match(/\bto\s+(?:at\s+)?(\d{1,2}):(\d{2})\b/i);
  if (toAt) return normalizeTime24(`${toAt[1]}:${toAt[2]}`);

  const toAtHour = prompt.match(/\bto\s+(?:at\s+)?(\d{1,2})\b(?!\s*:\d)/i);
  if (toAtHour) {
    const h = parseInt(toAtHour[1], 10);
    if (h >= 0 && h <= 23) return normalizeTime24(`${h}:00`);
  }

  return null;
}

export function extractFromTimeSlotFromReschedulePrompt(
  prompt: string,
): string | null {
  const fromRange = prompt.match(
    /\bfrom\s+(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\b/i,
  );
  if (fromRange) {
    return normalizeTime24(`${fromRange[1]}:${fromRange[2] ?? '00'}`);
  }

  const beforeToRange = prompt.split(/\bto\b/i)[0] ?? '';
  const hourRange = beforeToRange.match(/\b(\d{1,2})\s*[-–]\s*(\d{1,2})\b/);
  if (hourRange) {
    return normalizeTime24(`${hourRange[1]}:00`);
  }

  const possessive = prompt.match(
    /(?:'s|s)\s+(\d{1,2}):(\d{2})\s+(?:appointment|booking)/i,
  );
  if (possessive) return normalizeTime24(`${possessive[1]}:${possessive[2]}`);

  const beforeAppt = prompt.match(
    /\b(\d{1,2}):(\d{2})\s+(?:appointment|booking)\s+to\b/i,
  );
  if (beforeAppt) return normalizeTime24(`${beforeAppt[1]}:${beforeAppt[2]}`);

  const rescheduleFrom = prompt.match(
    /\breschedule\s+(?:to\s+)?from\s+(\d{1,2})(?::(\d{2}))?\b/i,
  );
  if (
    rescheduleFrom &&
    !/\bto\s+(?:tomorrow|today|\w+\s+\d|\d)/i.test(prompt)
  ) {
    return normalizeTime24(`${rescheduleFrom[1]}:${rescheduleFrom[2] ?? '00'}`);
  }

  return null;
}

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const MONTH_MAP: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

function resolveWeekdayIso(
  weekdayName: string,
  timeZone: string,
): string | null {
  const target = WEEKDAY_MAP[weekdayName.toLowerCase().replace(/\s/g, '')];
  if (target === undefined) return null;
  const tz = resolveTimezone(timeZone);
  const todayKey = getTodayDateKey(tz);
  const today = dayjs.tz(todayKey, tz);
  const cur = today.day();
  let delta = (target - cur + 7) % 7;
  if (delta === 0) delta = 7;
  return today.add(delta, 'day').format('YYYY-MM-DD');
}

/** Month/day phrases with optional explicit year for reschedule parsing. */
const RESCHEDULE_NAMED_DATE = String.raw`(?:[a-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?|\d{1,2}(?:st|nd|rd|th)?(?:\s+of\s+|\s+)[a-z]+(?:\s+\d{4})?)`;

function parseOrdinalMonthFragment(
  fragment: string,
  timeZone: string,
): string | null {
  const trimmed = fragment.trim();
  const lower = trimmed.toLowerCase();

  const dayMonth = lower.match(
    /^(\d{1,2})(?:st|nd|rd|th)?(?:\s+of\s+|\s+)([a-z]+)(?:\s+(\d{4}))?$/,
  );
  if (dayMonth) {
    const month = MONTH_MAP[dayMonth[2]];
    if (!month) return null;
    const day = parseInt(dayMonth[1], 10);
    const year = dayMonth[3]
      ? parseInt(dayMonth[3], 10)
      : inferYearForMonthDay(day, month, timeZone);
    return buildIsoDay(year, month, day);
  }

  const monthDay = lower.match(
    /^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?$/,
  );
  if (monthDay) {
    const month = MONTH_MAP[monthDay[1]];
    if (!month) return null;
    const day = parseInt(monthDay[2], 10);
    const year = monthDay[3]
      ? parseInt(monthDay[3], 10)
      : inferYearForMonthDay(day, month, timeZone);
    return buildIsoDay(year, month, day);
  }

  const slash = trimmed.match(/^(\d{1,2})[/_](\d{1,2})(?:[/_](\d{2,4}))?$/);
  if (slash) {
    const day = parseInt(slash[1], 10);
    const month = parseInt(slash[2], 10);
    let year = slash[3]
      ? parseInt(slash[3], 10)
      : inferYearForMonthDay(day, month, timeZone);
    if (year < 100) year += 2000;
    return buildIsoDay(year, month, day);
  }

  return null;
}

function inferYearForMonthDay(
  day: number,
  month: number,
  timeZone: string,
): number {
  const tz = resolveTimezone(timeZone);
  const todayKey = getTodayDateKey(tz);
  const today = dayjs.tz(todayKey, tz);
  let year = today.year();
  const candidate = dayjs.tz(
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    tz,
  );
  if (candidate.isBefore(today, 'day')) year += 1;
  return year;
}

function buildIsoDay(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Parse the destination day from "move/reschedule … to …" phrasing. */
function isRescheduleOrDatedRebookPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(reschedule|move|shift)\b/.test(lower)) return true;
  // e2e-bug.237 — "cancel … and rebook … for next Friday"
  return /\bcancel\b/.test(lower) && /\brebook\b/.test(lower);
}

export function extractRescheduleTargetDate(
  prompt: string,
  timeZone = 'UTC',
): string | null {
  const lower = prompt.toLowerCase();
  if (!isRescheduleOrDatedRebookPrompt(prompt)) return null;

  const toRel = lower.match(
    /\b(?:to|for|on)\s+(?:on\s+)?(tomorrow|today|yesterday|tonight)\b/,
  );
  if (toRel) {
    const keyword = toRel[1] === 'tonight' ? 'today' : toRel[1];
    const iso = resolveRelativeDateKeyword(keyword, timeZone);
    return iso ? formatDateDisplay(iso) : null;
  }

  const toNextDay = lower.match(
    /\b(?:to|for|on)\s+(?:on\s+)?next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/,
  );
  if (toNextDay) {
    const iso = resolveWeekdayIso(toNextDay[1], timeZone);
    return iso ? formatDateDisplay(iso) : null;
  }

  // e2e-bug.237 — voice-short "rebook next Friday" (no for/on/to).
  const rebookNextDay = lower.match(
    /\brebook(?:\s+it)?\s+next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/,
  );
  if (rebookNextDay) {
    const iso = resolveWeekdayIso(rebookNextDay[1], timeZone);
    return iso ? formatDateDisplay(iso) : null;
  }

  const toWeekday = lower.match(
    /\b(?:to|for|on)\s+(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/,
  );
  if (toWeekday) {
    const iso = resolveWeekdayIso(toWeekday[1], timeZone);
    return iso ? formatDateDisplay(iso) : null;
  }

  const rebookWeekday = lower.match(
    /\brebook(?:\s+it)?\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/,
  );
  if (rebookWeekday) {
    const iso = resolveWeekdayIso(rebookWeekday[1], timeZone);
    return iso ? formatDateDisplay(iso) : null;
  }

  const toOrdinal = prompt.match(
    new RegExp(
      String.raw`\bto\s+(?:on\s+)?(${RESCHEDULE_NAMED_DATE}|\d{1,2}[/_]\d{1,2}(?:[/_]\d{2,4})?)\b`,
      'i',
    ),
  );
  if (toOrdinal) {
    const iso = parseOrdinalMonthFragment(toOrdinal[1], timeZone);
    if (iso) return formatDateDisplay(iso);
  }

  const toSegment = prompt.match(
    /\bto\s+(?:on\s+)?(.+?)(?:\s+(?:from|at)\s+\d|\s+(?:nearest|first|next|earliest)\b|\s*$)/i,
  );
  if (toSegment?.[1]) {
    const cleaned = toSegment[1]
      .trim()
      .replace(
        /\s+(?:nearest|first|next|earliest)\s+(?:free\s+)?(?:time|slot|appointment)s?\b.*$/i,
        '',
      )
      .trim();
    const fromExtract = extractSingleDateFromPrompt(cleaned, timeZone);
    if (fromExtract) return fromExtract;
  }

  return null;
}

/** Parse the new appointment time from reschedule phrasing. */
export function extractRescheduleTargetTime(prompt: string): string | null {
  const toDayTime = prompt.match(
    /\bto\s+(?:tomorrow|today|(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun))\s+(\d{1,2})(?::(\d{2}))?\b/i,
  );
  if (toDayTime)
    return normalizeTime24(`${toDayTime[1]}:${toDayTime[2] ?? '00'}`);

  const toDayFrom = prompt.match(
    /\bto\s+(?:tomorrow|today|(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)|\d{1,2}(?:st|nd|rd|th)?(?:\s+of\s+|\s+)[a-z]+|\d{1,2}[/_]\d{1,2}(?:[/_]\d{2,4})?|[a-z]+\s+\d{1,2}(?:st|nd|rd|th)?)\s+(?:from|at)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b/i,
  );
  if (toDayFrom) {
    if (toDayFrom[3]) {
      return parseAmPmClockTime(
        parseInt(toDayFrom[1], 10),
        toDayFrom[2] != null ? parseInt(toDayFrom[2], 10) : undefined,
        toDayFrom[3],
      );
    }
    return normalizeTime24(`${toDayFrom[1]}:${toDayFrom[2] ?? '00'}`);
  }

  const toAt = extractRescheduleTimeSlotFromPrompt(prompt);
  if (toAt) return toAt;

  const moveToAmPm = prompt.match(
    /\b(?:move|reschedule|shift)\b[^.]{0,120}?\bto\b[^.]{0,80}?\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/i,
  );
  if (moveToAmPm) {
    return parseAmPmClockTime(
      parseInt(moveToAmPm[1], 10),
      moveToAmPm[2] != null ? parseInt(moveToAmPm[2], 10) : undefined,
      moveToAmPm[3],
    );
  }

  if (
    /\breschedule\s+(?:to\s+)?from\s+(\d{1,2})(?::(\d{2}))?\b/i.test(prompt)
  ) {
    const m = prompt.match(
      /\breschedule\s+(?:to\s+)?from\s+(\d{1,2})(?::(\d{2}))?\b/i,
    );
    if (m) return normalizeTime24(`${m[1]}:${m[2] ?? '00'}`);
  }

  return null;
}

function extractAtTimeBeforeTo(prompt: string): string | null {
  const beforeTo = prompt.match(
    /^([\s\S]+?)\bto\s+(?:tomorrow|today|(?:next\s+)?(?:mon|tues|wed|thu|fri|sat|sun)[a-z]*(?:day)?|\d)/i,
  );
  if (!beforeTo?.[1]) return null;
  const atTime = beforeTo[1].match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (atTime) return normalizeTime24(`${atTime[1]}:${atTime[2] ?? '00'}`);
  return null;
}

/** Parse which existing appointment time to move (not the destination "from 13:30"). */
export function extractRescheduleSourceTime(prompt: string): string | null {
  if (
    /\bto\s+(?:tomorrow|today|(?:next\s+)?(?:mon|tues|wed|thu|fri|sat|sun)[a-z]*(?:day)?|\S+(?:\s+\S+)?)\s+from\s+\d/i.test(
      prompt,
    )
  ) {
    return null;
  }
  const beforeTo = extractAtTimeBeforeTo(prompt);
  if (beforeTo) return beforeTo;
  return extractFromTimeSlotFromReschedulePrompt(prompt);
}

/** Optional source day when the user names the current appointment date. */
export function extractRescheduleSourceDate(
  prompt: string,
  timeZone = 'UTC',
): string | null {
  const lower = prompt.toLowerCase();
  // e2e-bug.237 — "cancel … and rebook … for tomorrow/Friday" destinations are
  // not the visit-to-move day; skip bare "for today/tomorrow" source cues.
  const datedCancelRebook =
    /\bcancel\b/.test(lower) && /\brebook\b/.test(lower);
  if (
    /\btoday(?:'s|'s)?\s+(?:\w+\s+){0,4}(?:appointment|booking)\b/.test(
      lower,
    ) ||
    (!datedCancelRebook && /\b(?:on|for)\s+today\b/.test(lower))
  ) {
    return todayDisplay(timeZone);
  }
  if (
    /\btomorrow(?:'s|'s)?\s+(?:\w+\s+){0,4}(?:appointment|booking)\b/.test(
      lower,
    ) ||
    (!datedCancelRebook && /\b(?:on|for)\s+tomorrow\b/.test(lower))
  ) {
    const iso = resolveRelativeDateKeyword('tomorrow', timeZone);
    return iso ? formatDateDisplay(iso) : null;
  }

  const onAppt = prompt.match(
    new RegExp(
      String.raw`\b(?:appointment|booking)\s+on\s+(${RESCHEDULE_NAMED_DATE}|\d{1,2}[/_]\d{1,2}(?:[/_]\d{2,4})?)`,
      'i',
    ),
  );
  if (onAppt?.[1]) {
    const iso = parseOrdinalMonthFragment(onAppt[1].trim(), timeZone);
    if (iso) return formatDateDisplay(iso);
  }

  // Only the left of "… to <destination>" is a source-day cue. Without `\bto\b`,
  // split()[0] is the whole prompt — and "rebook for next Friday" would wrongly
  // become fromDate (e2e-bug.237 empty upcoming lookup).
  if (/\bto\b/i.test(prompt)) {
    const beforeTo = prompt.split(/\bto\b/i)[0];
    if (beforeTo) {
      const extracted = extractSingleDateFromPrompt(beforeTo, timeZone);
      if (extracted) return extracted;
    }
  }

  return null;
}

/**
 * Split reschedule params: date/timeSlot = destination, fromDate/fromTimeSlot = source filters.
 */
export function resolveRescheduleParams(
  params: Record<string, any>,
  prompt: string,
  timeZone = 'UTC',
): void {
  if (!isRescheduleOrDatedRebookPrompt(prompt)) return;

  const targetDate = extractRescheduleTargetDate(prompt, timeZone);
  const targetTime = extractRescheduleTargetTime(prompt);
  const sourceTime = extractRescheduleSourceTime(prompt);
  const sourceDate = extractRescheduleSourceDate(prompt, timeZone);

  if (targetDate) params.date = targetDate;
  if (targetTime) params.timeSlot = targetTime;
  if (sourceTime) params.fromTimeSlot = sourceTime;
  if (sourceDate) params.fromDate = sourceDate;

  if (targetTime && params.fromTimeSlot === targetTime && !sourceTime) {
    delete params.fromTimeSlot;
  }

  if (isFirstAvailableBookingPrompt(prompt)) {
    params.bookingFirstAvailable = true;
    delete params.timeSlot;
  }
}

function matchServiceInPrompt(
  prompt: string,
  services: Array<{ id: string; name: string }>,
): { id: string; name: string } | undefined {
  const lower = prompt.toLowerCase();
  const normalizedPrompt = normalizeServiceLookup(lower);

  const bookingNoise = new Set([
    'appointment',
    'appintment',
    'appt',
    'booking',
    'schedule',
    'the',
    'a',
    'an',
    'new',
  ]);

  let best: { id: string; name: string } | undefined;
  let bestLen = 0;
  for (const service of services) {
    if (
      lower.includes(service.name.toLowerCase()) &&
      service.name.length > bestLen
    ) {
      best = service;
      bestLen = service.name.length;
      continue;
    }
    const normalizedName = normalizeServiceLookup(service.name);
    if (
      normalizedName.length >= 4 &&
      normalizedPrompt.includes(normalizedName) &&
      normalizedName.length > bestLen
    ) {
      best = service;
      bestLen = normalizedName.length;
    }
  }
  if (best) return best;

  // Partial tail match: "body massage" in prompt → catalog "full body massage"
  for (const service of services) {
    const normalizedName = normalizeServiceLookup(service.name);
    if (normalizedName.length < 8) continue;
    for (let tailLen = 8; tailLen <= normalizedName.length; tailLen++) {
      const suffix = normalizedName.slice(-tailLen);
      if (normalizedPrompt.endsWith(suffix) && tailLen > bestLen) {
        best = service;
        bestLen = tailLen;
      }
    }
  }
  if (best) return best;

  const afterTimePatterns = [
    /\b(?:from|at)\s+\d{1,2}[:.]\d{2}\s+(.+?)$/i,
    /\b\d{1,2}[:.]\d{2}\s+(.+?)$/i,
  ];
  for (const re of afterTimePatterns) {
    const match = lower.match(re);
    if (match?.[1]) {
      const phrase = match[1].trim().replace(/[?.!]+$/, '');
      if (phrase.length >= 3 && !bookingNoise.has(phrase)) {
        const svc = fuzzyMatchServiceByName(services, phrase);
        if (svc) return svc;
      }
    }
  }

  const whoCanPatterns = [
    /\bwho\s+can\s+(?:do|give|perform|provide|offer)?\s*(?:a\s+|an\s+)?([a-z][a-z\s-]+?)(?:\s+today|\s+tomorrow|\s+this|\s+on\b|\s+at\b|\?|$)/i,
    /\bwho(?:'s|\s+is|\s+are)\s+(?:doing|performing|giving|offering|providing)\s+(?:a\s+|an\s+)?([a-z][a-z\s-]+?)(?:\s+today|\s+tomorrow|\s+this|\s+on\b|\s+at\b|\?|$)/i,
    /\b(?:free|available|open)\s+(?:slot|time)s?\s+for\s+(?:a\s+|an\s+)?([a-z][a-z\s-]+?)(?:\s+today|\s+tomorrow|\s+this|\s+on\b|\?|$)/i,
  ];
  for (const re of whoCanPatterns) {
    const match = lower.match(re);
    if (match?.[1]) {
      const svc = fuzzyMatchServiceByName(services, match[1].trim());
      if (svc) return svc;
    }
  }

  const phraseMatch = lower.match(
    /\b(?:give|do|perform|provide|offer|for)\s+(?:a\s+|an\s+)?([a-z][a-z\s-]+?)(?:\s+today|\s+tomorrow|\s+at\b|\s+on\b|\?|$)/i,
  );
  if (phraseMatch?.[1]) {
    return fuzzyMatchServiceByName(services, phraseMatch[1].trim());
  }

  const bookMatch = lower.match(
    /\bbook\s+(?:the\s+)?(?:first\s+available\s+|next\s+available\s+)?([a-z][a-z\s-]+?)(?:\s+on\b|\s+for\b|\s+with\b|\s+today|\s+tomorrow|\?|$)/i,
  );
  if (bookMatch?.[1]) {
    const candidate = bookMatch[1].trim();
    const candidateNorm = candidate.replace(/\s+/g, ' ');
    if (
      !/^(?:first|next)\s+available$/i.test(candidateNorm) &&
      !bookingNoise.has(candidateNorm) &&
      !bookingNoise.has(candidateNorm.split(/\s+/)[0])
    ) {
      const svc = fuzzyMatchServiceByName(services, candidate);
      if (svc) return svc;
    }
  }

  // Trailing words: "... june 8th facemassage" or "... 14:00 body massage"
  const words = lower
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  for (let len = Math.min(4, words.length); len >= 1; len--) {
    const tail = words.slice(-len).join(' ');
    if (tail.length < 4 || bookingNoise.has(tail)) continue;
    const svc = fuzzyMatchServiceByName(services, tail);
    if (svc) return svc;
  }

  // Clarify follow-up: "basic cut" → catalog "Haircut basic" (discover-journey-clarify-en).
  const clarifyTokens = lower
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !bookingNoise.has(word));
  if (clarifyTokens.length >= 2 && clarifyTokens.length <= 4) {
    let clarifyBest: { id: string; name: string } | undefined;
    let clarifyBestScore = 0;
    for (const service of services) {
      const nameTokens = service.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        // e2e-bug.340 — an apostrophe-possessive name like "Men's cut" splits
        // into a lone single-character "s" token, which spuriously matches
        // almost any prompt word via `token.includes(nt)`.
        .filter((word) => word.length >= 2);
      const score = clarifyTokens.filter((token) =>
        nameTokens.some((nt) => nt.includes(token) || token.includes(nt)),
      ).length;
      if (score === clarifyTokens.length && score > clarifyBestScore) {
        clarifyBest = service;
        clarifyBestScore = score;
      }
    }
    if (clarifyBest) return clarifyBest;
  }

  return undefined;
}

/** Prompt-mentioned service — used after LLM classification to override stale session values. */
export function extractServiceFromPrompt(
  prompt: string,
  services: Array<{ id: string; name: string }>,
): { id: string; name: string } | undefined {
  return matchServiceInPrompt(prompt, services);
}

export function extractProviderPossessiveFromReschedulePrompt(
  prompt: string,
  employees: Array<{ id: string; name: string }>,
): { id: string; name: string } | undefined {
  if (!/\b(reschedule|move|shift)\b/i.test(prompt)) return undefined;

  const possessive = prompt.match(
    /\b([a-z][\w.'-]+?)'?s?\s+(?:appointment|booking)\b/i,
  );
  if (!possessive?.[1]) return undefined;

  const raw = possessive[1].trim();
  if (/^(move|shift|reschedule|the|his|her|their)$/i.test(raw))
    return undefined;

  const byName = fuzzyMatchServiceByName(employees, raw);
  if (byName) return { id: byName.id, name: byName.name };

  const matched = matchEntityInPrompt(prompt, employees);
  return matched ? { id: matched.id, name: matched.name } : undefined;
}

export function extractCustomerFromReschedulePrompt(
  prompt: string,
  customers: Array<{ id: string; name: string }>,
  employees: Array<{ id: string; name: string }> = [],
): { id: string; name: string } | undefined {
  if (extractProviderPossessiveFromReschedulePrompt(prompt, employees)) {
    return undefined;
  }

  const possessive = prompt.match(
    /\b([a-z][\w.'-]+?)'?s?\s+(?:appointment|booking)\b/i,
  );
  if (possessive?.[1]) {
    const raw = possessive[1].trim();
    if (!/^(move|shift|reschedule|the|his|her|their)$/i.test(raw)) {
      const customer = fuzzyMatchServiceByName(customers, raw);
      if (customer && !fuzzyMatchServiceByName(employees, raw)) {
        return customer;
      }
    }
  }
  return matchEntityInPrompt(prompt, customers);
}

const AVAILABILITY_FOLLOW_UP_ACTIONS = new Set([
  'check_providers_for_service',
  'check_availability',
]);

/** Short time-of-day refinement after a provider availability result ("evening?", "what about morning"). */
export function isAvailabilityTimeOfDayFollowUp(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (!trimmed || trimmed.length > 48) return false;
  if (!parseTimeOfDayWindow(trimmed, {})) return false;
  return (
    /^(?:what\s+about\s+)?(?:morning|afternoon|evening|tonight)\??$/i.test(
      trimmed,
    ) ||
    /^(?:any\s+)?(?:morning|afternoon|evening|tonight)(?:\s+slots?)?\??$/i.test(
      trimmed,
    )
  );
}

/**
 * After check_providers / check_availability, bind follow-up time-of-day prompts to
 * the provider(s) just shown — not a stale employeeName from an earlier turn.
 */
export function applyAvailabilityFollowUpFromSession(
  prompt: string,
  params: Record<string, any>,
  session?: Record<string, any>,
  employees?: Array<{ name: string }>,
): void {
  if (!session || !isAvailabilityTimeOfDayFollowUp(prompt)) return;

  const lastAction = session.lastAction as string | undefined;
  if (!lastAction || !AVAILABILITY_FOLLOW_UP_ACTIONS.has(lastAction)) return;

  if (employees?.length && matchEntityInPrompt(prompt, employees)) return;

  const available = session.availableProviders as string[] | undefined;
  if (!available?.length) return;

  const timeOfDay = parseTimeOfDayWindow(prompt, params);
  if (timeOfDay) params.timeOfDay = timeOfDay;

  if (available.length === 1) {
    params.employeeName = available[0];
    params.allProviders = false;
    delete params.employeeNames;
    return;
  }

  params.employeeName = null;
  params.allProviders = true;
  delete params.employeeNames;
}

export function extractNewServiceNameFromChangePrompt(
  prompt: string,
  services?: Array<{ id: string; name: string }>,
): string | null {
  const patterns = [
    /\b(?:change|switch|update|replace|convert)\s+(?:the\s+)?(?:service(?:\s+type)?|appointment(?:\s+service)?)\s+(?:to|into)\s+(.+?)(?:\s+and\b|\s+on\b|\s+at\b|\s+for\b|\s+tomorrow\b|\s+today\b|$)/i,
    /\b(?:change|switch|update)\s+.+'s\s+(?:appointment|booking)\s+(?:to|into)\s+(.+?)(?:\s+and\b|\s+at\b|\s+on\b|$)/i,
    /\bswitch\s+to\s+(.+?)(?:\s+and\b|\s+move\b|\s+at\b|\s+on\b|\s+tomorrow\b|\s+today\b|$)/i,
  ];

  for (const re of patterns) {
    const match = prompt.match(re);
    if (!match?.[1]) continue;
    const raw = match[1].trim().replace(/\s+(only|instead)$/i, '');
    if (!raw || extractTimeSlotFromPrompt(raw)) continue;
    if (services?.length) {
      const svc = fuzzyMatchServiceByName(services, raw);
      if (svc) return svc.name;
    }
    return raw;
  }

  return null;
}

export function matchEntityInPrompt<T extends { name: string }>(
  prompt: string,
  items: T[],
): T | undefined {
  const lower = prompt.toLowerCase();
  for (const item of items) {
    if (lower.includes(item.name.toLowerCase())) return item;
    const first = item.name.split(/\s+/)[0];
    if (
      first.length >= 3 &&
      new RegExp(`\\b${first.toLowerCase()}\\b`).test(lower)
    ) {
      return item;
    }
  }
  return undefined;
}

function namesLikelySamePerson(a: string, b: string): boolean {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (!na || !nb) return false;
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const fa = na.split(/\s+/)[0];
  const fb = nb.split(/\s+/)[0];
  return fa.length >= 3 && fa === fb;
}

/**
 * Customer for create_booking only when the prompt explicitly names a client — not the provider
 * and not a fuzzy match to the logged-in user / employee first name.
 */
export function extractCustomerFromBookingPrompt(
  prompt: string,
  customers: Array<{ id: string; name: string }>,
  employees: Array<{ id: string; name: string }>,
  providerName?: string | null,
): { id: string; name: string } | undefined {
  const lower = prompt.toLowerCase();

  if (/\b(?:walk[\s-]?in|no customer|without customer)\b/i.test(lower)) {
    return undefined;
  }

  const explicitPatterns = [
    /\bcustomer\s+(?:named?\s+)?([a-z][\w\s.'-]+?)(?:\s+at\b|\s+on\b|\s+today|\s+tomorrow|$|\?)/i,
    /\bfor\s+customer\s+([a-z][\w\s.'-]+?)(?:\s+at\b|\s+on\b|\s+today|\s+tomorrow|$|\?)/i,
    /\bwith\s+customer\s+([a-z][\w\s.'-]+?)(?:\s+at\b|\s+on\b|\s+today|\s+tomorrow|$|\?)/i,
  ];
  for (const re of explicitPatterns) {
    const match = prompt.match(re);
    if (!match?.[1]) continue;
    const svc = fuzzyMatchServiceByName(customers, match[1].trim());
    if (
      svc &&
      (!providerName || !namesLikelySamePerson(svc.name, providerName))
    ) {
      return svc;
    }
  }

  const bookForMatch = prompt.match(
    /\b(?:book|schedule|reserve|set up)\b[^?.]{0,120}?\bfor\s+(?:customer\s+)?([a-z][\w\s.'-]+?)(?:\s+at\b|\s+on\b|\s+today|\s+tomorrow|$|\?)/i,
  );
  if (bookForMatch?.[1]) {
    const raw = bookForMatch[1].trim();
    if (
      !/^(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(
        raw,
      )
    ) {
      const svc = fuzzyMatchServiceByName(customers, raw);
      if (
        svc &&
        (!providerName || !namesLikelySamePerson(svc.name, providerName))
      ) {
        return svc;
      }
    }
  }

  return undefined;
}

/** Ordered provider names when the user gives a conditional fallback booking chain. */
export function extractProviderFallbackFromPrompt(
  prompt: string,
  employees: Array<{ id: string; name: string }>,
): { providerFallbackNames: string[]; fallbackAnyProvider: boolean } {
  const lower = prompt.toLowerCase();
  const fallbackAnyProvider =
    /\b(who(?:ever)? is free|whoever(?:'s| is) available|any provider|any specialist|whoever can|first available provider)\b/i.test(
      prompt,
    );

  const isFallbackPrompt =
    /\b(if .+ (not available|unavailable|busy|can'?t)|otherwise|else (book|try)|then (try|book)|if not)\b/i.test(
      prompt,
    );

  if (!isFallbackPrompt && !fallbackAnyProvider) {
    return { providerFallbackNames: [], fallbackAnyProvider: false };
  }

  const ordered = employees
    .map((e) => {
      const fullIdx = lower.indexOf(e.name.toLowerCase());
      const first = e.name.split(/\s+/)[0] ?? e.name;
      const firstIdx =
        fullIdx >= 0 ? fullIdx : lower.indexOf(first.toLowerCase());
      return { name: e.name, idx: firstIdx };
    })
    .filter((x) => x.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  return {
    providerFallbackNames: ordered.map((x) => x.name),
    fallbackAnyProvider,
  };
}

export function normalizeBookingStatusValue(
  value: unknown,
): BookingStatus | undefined {
  if (!value) return undefined;
  const map: Record<string, BookingStatus> = {
    done: BookingStatus.COMPLETED,
    completed: BookingStatus.COMPLETED,
    complete: BookingStatus.COMPLETED,
    in_progress: BookingStatus.IN_PROGRESS,
    'in progress': BookingStatus.IN_PROGRESS,
    no_show: BookingStatus.NO_SHOW,
    'no show': BookingStatus.NO_SHOW,
    confirmed: BookingStatus.CONFIRMED,
    pending: BookingStatus.PENDING,
    booked: BookingStatus.PENDING,
    cancelled: BookingStatus.CANCELLED,
    canceled: BookingStatus.CANCELLED,
    cancel: BookingStatus.CANCELLED,
  };
  const key = String(value).toLowerCase();
  return (
    map[key] ??
    (Object.values(BookingStatus).includes(value as BookingStatus)
      ? (value as BookingStatus)
      : undefined)
  );
}

export function normalizePaymentStatusValue(
  value: unknown,
): PaymentStatus | undefined {
  if (!value) return undefined;
  const map: Record<string, PaymentStatus> = {
    done: PaymentStatus.PAID,
    paid: PaymentStatus.PAID,
    pending: PaymentStatus.PENDING,
    partially_paid: PaymentStatus.PARTIALLY_PAID,
    partial: PaymentStatus.PARTIALLY_PAID,
    'partially paid': PaymentStatus.PARTIALLY_PAID,
    refunded: PaymentStatus.REFUNDED,
    not_applicable: PaymentStatus.NOT_APPLICABLE,
    na: PaymentStatus.NOT_APPLICABLE,
    n_a: PaymentStatus.NOT_APPLICABLE,
    'n/a': PaymentStatus.NOT_APPLICABLE,
  };
  const key = String(value).toLowerCase();
  return (
    map[key] ??
    (Object.values(PaymentStatus).includes(value as PaymentStatus)
      ? (value as PaymentStatus)
      : undefined)
  );
}

export function extractBookingStatusFromPrompt(
  prompt: string,
): BookingStatus | undefined {
  const lower = prompt.toLowerCase();
  if (/\bno[\s-]?show(s)?\b/i.test(lower)) return BookingStatus.NO_SHOW;
  if (
    /\b(mark(ed)?\s+as\s+)?done\b|\bcompleted?\b/i.test(lower) &&
    !/\bcancel/i.test(lower)
  ) {
    return BookingStatus.COMPLETED;
  }
  if (
    /\b(in[\s-]?progress|start(ed)?\s+(?:the\s+)?(?:service|appointment|visit)|begin\s+(?:the\s+)?(?:service|appointment|visit))\b/i.test(
      lower,
    )
  ) {
    return BookingStatus.IN_PROGRESS;
  }
  if (/\bcancel(l)?ed\b/i.test(lower)) return BookingStatus.CANCELLED;
  if (/\bconfirmed\b/i.test(lower) && !/\bpush\b/i.test(lower)) {
    return BookingStatus.CONFIRMED;
  }
  if (/\bpending\b/i.test(lower)) return BookingStatus.PENDING;
  return undefined;
}

export function extractPaymentStatusFromPrompt(
  prompt: string,
): PaymentStatus | undefined {
  const lower = prompt.toLowerCase();
  if (/\b(n\/a|not applicable)\b/i.test(lower))
    return PaymentStatus.NOT_APPLICABLE;
  if (/\b(paid|payment done|mark.*paid)\b/i.test(lower))
    return PaymentStatus.PAID;
  if (/\brefunded\b/i.test(lower)) return PaymentStatus.REFUNDED;
  return undefined;
}
