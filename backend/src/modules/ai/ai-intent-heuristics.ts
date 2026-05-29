/**
 * Post-LLM entity extraction and metric resolvers.
 * Intent classification is LLM-only (see AiCommandService.classifyIntent).
 */
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
  normalizeServiceLookup,
} from './ai-orchestration.helpers.js';
import type { CustomerInsightMetric } from '../customer/customer.service.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export type ServiceInsightMetric = 'most_booked' | 'top_revenue' | 'least_booked' | 'overview';
export type StaffInsightMetric = 'busiest' | 'most_revenue' | 'most_bookings' | 'overview';
export type ServiceAssignmentLookup = 'providers_for_service' | 'services_for_provider';

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

export function extractLimitFromPrompt(prompt: string, defaultLimit = 5): number {
  const topMatch = prompt.match(/\btop\s+(\d{1,2})\b/i);
  if (topMatch) return Math.min(parseInt(topMatch[1], 10), 20);
  const firstMatch = prompt.match(/\b(\d{1,2})\s+(top|best|highest)\b/i);
  if (firstMatch) return Math.min(parseInt(firstMatch[1], 10), 20);
  return defaultLimit;
}

export function extractStatusFilterFromPrompt(prompt: string): string | null {
  const filters = extractStatusFiltersFromPrompt(prompt);
  return filters.length === 1 ? filters[0] : filters[0] ?? null;
}

export function extractStatusFiltersFromPrompt(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const found = new Set<string>();
  for (const [alias, status] of Object.entries(BOOKING_STATUS_ALIASES)) {
    if (new RegExp(`\\b${alias.replace(/[-_]/g, '[\\s-_]?')}\\b`, 'i').test(lower)) {
      found.add(status);
    }
  }
  return [...found];
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

  const pm = prompt.match(/\b(?:at\s+)?(\d{1,2})\s*(?:pm|p\.m\.)\b/i);
  if (pm) {
    const h = parseInt(pm[1], 10);
    return normalizeTime24(`${h === 12 ? 12 : h + 12}:00`);
  }
  const am = prompt.match(/\b(?:at\s+)?(\d{1,2})\s*(?:am|a\.m\.)\b/i);
  if (am) {
    const h = parseInt(am[1], 10);
    return normalizeTime24(`${h === 12 ? 0 : h}:00`);
  }

  const atHourOnly = prompt.match(/\b(?:at|@)\s*(\d{1,2})\b(?!\s*:\d)/i);
  if (atHourOnly) {
    const h = parseInt(atHourOnly[1], 10);
    if (h >= 0 && h <= 23) return normalizeTime24(`${h}:00`);
  }

  return null;
}

export function extractRescheduleTimeSlotFromPrompt(prompt: string): string | null {
  const toAt = prompt.match(/\bto\s+(?:at\s+)?(\d{1,2}):(\d{2})\b/i);
  if (toAt) return normalizeTime24(`${toAt[1]}:${toAt[2]}`);

  const toAtHour = prompt.match(/\bto\s+(?:at\s+)?(\d{1,2})\b(?!\s*:\d)/i);
  if (toAtHour) {
    const h = parseInt(toAtHour[1], 10);
    if (h >= 0 && h <= 23) return normalizeTime24(`${h}:00`);
  }

  return null;
}

export function extractFromTimeSlotFromReschedulePrompt(prompt: string): string | null {
  const possessive = prompt.match(/(?:'s|s)\s+(\d{1,2}):(\d{2})\s+(?:appointment|booking)/i);
  if (possessive) return normalizeTime24(`${possessive[1]}:${possessive[2]}`);

  const beforeAppt = prompt.match(/\b(\d{1,2}):(\d{2})\s+(?:appointment|booking)\s+to\b/i);
  if (beforeAppt) return normalizeTime24(`${beforeAppt[1]}:${beforeAppt[2]}`);

  const rescheduleFrom = prompt.match(/\breschedule\s+(?:to\s+)?from\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (rescheduleFrom && !/\bto\s+(?:tomorrow|today|\w+\s+\d|\d)/i.test(prompt)) {
    return normalizeTime24(`${rescheduleFrom[1]}:${rescheduleFrom[2] ?? '00'}`);
  }

  return null;
}

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3, thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5, saturday: 6, sat: 6,
};

const MONTH_MAP: Record<string, number> = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8,
  september: 9, sep: 9, sept: 9, october: 10, oct: 10, november: 11, nov: 11,
  december: 12, dec: 12,
};

function resolveWeekdayIso(weekdayName: string, timeZone: string): string | null {
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

function parseOrdinalMonthFragment(fragment: string, timeZone: string): string | null {
  const trimmed = fragment.trim();
  const lower = trimmed.toLowerCase();

  const dayMonth = lower.match(/^(\d{1,2})(?:st|nd|rd|th)?(?:\s+of\s+|\s+)([a-z]+)(?:\s+(\d{4}))?$/);
  if (dayMonth) {
    const month = MONTH_MAP[dayMonth[2]];
    if (!month) return null;
    const day = parseInt(dayMonth[1], 10);
    const year = dayMonth[3] ? parseInt(dayMonth[3], 10) : inferYearForMonthDay(day, month, timeZone);
    return buildIsoDay(year, month, day);
  }

  const monthDay = lower.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?$/);
  if (monthDay) {
    const month = MONTH_MAP[monthDay[1]];
    if (!month) return null;
    const day = parseInt(monthDay[2], 10);
    const year = monthDay[3] ? parseInt(monthDay[3], 10) : inferYearForMonthDay(day, month, timeZone);
    return buildIsoDay(year, month, day);
  }

  const slash = trimmed.match(/^(\d{1,2})[/_](\d{1,2})(?:[/_](\d{2,4}))?$/);
  if (slash) {
    const day = parseInt(slash[1], 10);
    const month = parseInt(slash[2], 10);
    let year = slash[3] ? parseInt(slash[3], 10) : inferYearForMonthDay(day, month, timeZone);
    if (year < 100) year += 2000;
    return buildIsoDay(year, month, day);
  }

  return null;
}

function inferYearForMonthDay(day: number, month: number, timeZone: string): number {
  const tz = resolveTimezone(timeZone);
  const todayKey = getTodayDateKey(tz);
  const today = dayjs.tz(todayKey, tz);
  let year = today.year();
  const candidate = dayjs.tz(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, tz);
  if (candidate.isBefore(today, 'day')) year += 1;
  return year;
}

function buildIsoDay(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Parse the destination day from "move/reschedule … to …" phrasing. */
export function extractRescheduleTargetDate(prompt: string, timeZone = 'UTC'): string | null {
  const lower = prompt.toLowerCase();
  if (!/\b(reschedule|move|shift)\b/.test(lower)) return null;

  const toRel = lower.match(/\bto\s+(?:on\s+)?(tomorrow|today|yesterday|tonight)\b/);
  if (toRel) {
    const keyword = toRel[1] === 'tonight' ? 'today' : toRel[1];
    const iso = resolveRelativeDateKeyword(keyword, timeZone);
    return iso ? formatDateDisplay(iso) : null;
  }

  const toNextDay = lower.match(
    /\bto\s+(?:on\s+)?next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/,
  );
  if (toNextDay) {
    const iso = resolveWeekdayIso(toNextDay[1], timeZone);
    return iso ? formatDateDisplay(iso) : null;
  }

  const toWeekday = lower.match(
    /\bto\s+(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/,
  );
  if (toWeekday) {
    const iso = resolveWeekdayIso(toWeekday[1], timeZone);
    return iso ? formatDateDisplay(iso) : null;
  }

  const toOrdinal = prompt.match(
    /\bto\s+(?:on\s+)?(\d{1,2}(?:st|nd|rd|th)?(?:\s+of\s+|\s+)[a-z]+|[a-z]+\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}[/_]\d{1,2}(?:[/_]\d{2,4})?)\b/i,
  );
  if (toOrdinal) {
    const iso = parseOrdinalMonthFragment(toOrdinal[1], timeZone);
    if (iso) return formatDateDisplay(iso);
  }

  const toSegment = prompt.match(/\bto\s+(?:on\s+)?(.+?)(?:\s+(?:from|at)\s+\d|\s*$)/i);
  if (toSegment?.[1]) {
    const fromExtract = extractSingleDateFromPrompt(toSegment[1].trim(), timeZone);
    if (fromExtract) return fromExtract;
  }

  return null;
}

/** Parse the new appointment time from reschedule phrasing. */
export function extractRescheduleTargetTime(prompt: string): string | null {
  const toDayTime = prompt.match(
    /\bto\s+(?:tomorrow|today|(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun))\s+(\d{1,2})(?::(\d{2}))?\b/i,
  );
  if (toDayTime) return normalizeTime24(`${toDayTime[1]}:${toDayTime[2] ?? '00'}`);

  const toDayFrom = prompt.match(
    /\bto\s+(?:tomorrow|today|(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)|\d{1,2}(?:st|nd|rd|th)?(?:\s+of\s+|\s+)[a-z]+|\d{1,2}[/_]\d{1,2}(?:[/_]\d{2,4})?|[a-z]+\s+\d{1,2}(?:st|nd|rd|th)?)\s+(?:from|at)\s+(\d{1,2})(?::(\d{2}))?\b/i,
  );
  if (toDayFrom) return normalizeTime24(`${toDayFrom[1]}:${toDayFrom[2] ?? '00'}`);

  const toAt = extractRescheduleTimeSlotFromPrompt(prompt);
  if (toAt) return toAt;

  if (/\breschedule\s+(?:to\s+)?from\s+(\d{1,2})(?::(\d{2}))?\b/i.test(prompt)) {
    const m = prompt.match(/\breschedule\s+(?:to\s+)?from\s+(\d{1,2})(?::(\d{2}))?\b/i);
    if (m) return normalizeTime24(`${m[1]}:${m[2] ?? '00'}`);
  }

  return null;
}

function extractAtTimeBeforeTo(prompt: string): string | null {
  const beforeTo = prompt.match(/^([\s\S]+?)\bto\s+(?:tomorrow|today|(?:next\s+)?(?:mon|tues|wed|thu|fri|sat|sun)[a-z]*(?:day)?|\d)/i);
  if (!beforeTo?.[1]) return null;
  const atTime = beforeTo[1].match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (atTime) return normalizeTime24(`${atTime[1]}:${atTime[2] ?? '00'}`);
  return null;
}

/** Parse which existing appointment time to move (not the destination "from 13:30"). */
export function extractRescheduleSourceTime(prompt: string): string | null {
  if (/\bto\s+(?:tomorrow|today|(?:next\s+)?(?:mon|tues|wed|thu|fri|sat|sun)[a-z]*(?:day)?|\S+(?:\s+\S+)?)\s+from\s+\d/i.test(prompt)) {
    return null;
  }
  const beforeTo = extractAtTimeBeforeTo(prompt);
  if (beforeTo) return beforeTo;
  return extractFromTimeSlotFromReschedulePrompt(prompt);
}

/** Optional source day when the user names the current appointment date. */
export function extractRescheduleSourceDate(prompt: string, timeZone = 'UTC'): string | null {
  const lower = prompt.toLowerCase();
  if (
    /\btoday(?:'s|'s)?\s+(?:\w+\s+){0,4}(?:appointment|booking)\b/.test(lower) ||
    /\b(?:on|for)\s+today\b/.test(lower)
  ) {
    return todayDisplay(timeZone);
  }
  if (
    /\btomorrow(?:'s|'s)?\s+(?:\w+\s+){0,4}(?:appointment|booking)\b/.test(lower) ||
    /\b(?:on|for)\s+tomorrow\b/.test(lower)
  ) {
    const iso = resolveRelativeDateKeyword('tomorrow', timeZone);
    return iso ? formatDateDisplay(iso) : null;
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
  const lower = prompt.toLowerCase();
  if (!/\b(reschedule|move|shift)\b/.test(lower)) return;

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
}

function matchServiceInPrompt(
  prompt: string,
  services: Array<{ id: string; name: string }>,
): { id: string; name: string } | undefined {
  const lower = prompt.toLowerCase();
  const normalizedPrompt = normalizeServiceLookup(lower);

  let best: { id: string; name: string } | undefined;
  let bestLen = 0;
  for (const service of services) {
    if (lower.includes(service.name.toLowerCase()) && service.name.length > bestLen) {
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
    if (!/^(?:first|next)\s+available$/i.test(candidate)) {
      return fuzzyMatchServiceByName(services, candidate);
    }
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

/** Book on any provider — do not pin to a single employeeName. */
export function isAnyProviderBookingPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\bany\s+(?:provider|staff|employee|therapist|stylist|specialist|specialists)\b/i.test(lower) ||
    /\bwhichever\s+(?:provider|specialist)\b/i.test(lower) ||
    /\bwhoever\s+(?:is\s+)?(?:available|free)\b/i.test(lower)
  );
}

/** Book the earliest open slot (provider chosen separately or via allProviders). */
export function isFirstAvailableBookingPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\bfirst\s+available\b/i.test(lower) ||
    /\bearliest\s+(?:available\s+)?(?:slot|time|appointment)\b/i.test(lower) ||
    /\bnext\s+available\s+(?:slot|time|appointment)\b/i.test(lower) ||
    /\bnearest\s+(?:available\s+)?(?:slot|time|appointment)\b/i.test(lower) ||
    /\bnearest\s+time\s+slot\b/i.test(lower) ||
    /\bas soon as possible\b/i.test(lower) ||
    /\basap\b/i.test(lower)
  );
}

/** Team-wide provider availability — do not inherit a single provider from session. */
export function isTeamWideProviderAvailabilityQuery(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    (/\bwho\s+(is|has|are)\s+(?:a\s+)?(?:free|available|open)\b/i.test(lower) ||
      /\bwho\s+has\s+(?:a\s+)?(?:free|open|available)\s+(?:slot|time)/i.test(lower) ||
      /\b(free|available|open)\s+(?:slot|time)s?\s+for\b/i.test(lower)) ||
    /\bwho(?:'s|\s+is|\s+are)\s+(?:doing|performing|giving|offering|providing)\b/i.test(lower) ||
    /\bwho\s+can\s+(?:do|give|perform|provide|offer)\b/i.test(lower) ||
    /\bwho\s+(?:is|are)\s+(?:available|free|open)\b/i.test(lower)
  );
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
    if (first.length >= 3 && new RegExp(`\\b${first.toLowerCase()}\\b`).test(lower)) {
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
    if (svc && (!providerName || !namesLikelySamePerson(svc.name, providerName))) {
      return svc;
    }
  }

  const bookForMatch = prompt.match(
    /\b(?:book|schedule|reserve|set up)\b[^?.]{0,120}?\bfor\s+(?:customer\s+)?([a-z][\w\s.'-]+?)(?:\s+at\b|\s+on\b|\s+today|\s+tomorrow|$|\?)/i,
  );
  if (bookForMatch?.[1]) {
    const raw = bookForMatch[1].trim();
    if (!/^(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(raw)) {
      const svc = fuzzyMatchServiceByName(customers, raw);
      if (svc && (!providerName || !namesLikelySamePerson(svc.name, providerName))) {
        return svc;
      }
    }
  }

  return undefined;
}

export function resolveServiceMetric(
  params: Record<string, any>,
  prompt: string,
): ServiceInsightMetric {
  const lower = prompt.toLowerCase();
  if (/least popular|least booked|worst performing/i.test(lower)) return 'least_booked';
  if (/revenue|earned|sales|money/i.test(lower) && /\bservice/i.test(lower)) return 'top_revenue';
  if (/most popular|most booked|top service|best service|busiest service/i.test(lower)) {
    return 'most_booked';
  }
  if (/\bservice/i.test(lower) && /\b(popular|booked|performing)\b/i.test(lower)) return 'most_booked';

  const raw = params.serviceMetric as string | undefined;
  const allowed: ServiceInsightMetric[] = ['most_booked', 'top_revenue', 'least_booked', 'overview'];
  if (raw && allowed.includes(raw as ServiceInsightMetric)) return raw as ServiceInsightMetric;
  return 'overview';
}

export function resolveStaffMetric(params: Record<string, any>, prompt: string): StaffInsightMetric {
  const lower = prompt.toLowerCase();
  if (/revenue|earned|sales/i.test(lower) && /\b(staff|provider|employee|team)\b/i.test(lower)) {
    return 'most_revenue';
  }
  if (/busiest|most packed|most appointments/i.test(lower)) return 'busiest';
  if (/most bookings/i.test(lower)) return 'most_bookings';

  const raw = params.staffMetric as string | undefined;
  const allowed: StaffInsightMetric[] = ['busiest', 'most_revenue', 'most_bookings', 'overview'];
  if (raw && allowed.includes(raw as StaffInsightMetric)) return raw as StaffInsightMetric;
  return 'overview';
}

export function resolveAppointmentMetric(
  params: Record<string, any>,
  prompt: string,
): 'most_expensive' | 'longest' | 'shortest' | 'earliest' | 'latest' | null {
  type AppointmentMetric = 'most_expensive' | 'longest' | 'shortest' | 'earliest' | 'latest';
  const lower = prompt.toLowerCase();
  if (/most expensive|highest price|priciest|costs the most|expensive appointment/i.test(lower)) {
    return 'most_expensive';
  }
  if (/longest|most time|takes the longest|longest appointment/i.test(lower)) return 'longest';
  if (/shortest|least time|quickest|shortest appointment/i.test(lower)) return 'shortest';
  if (/earliest|first appointment/i.test(lower)) return 'earliest';
  if (/latest|last appointment|final appointment/i.test(lower)) return 'latest';

  const allowed: AppointmentMetric[] = [
    'most_expensive',
    'longest',
    'shortest',
    'earliest',
    'latest',
  ];
  const raw = params.appointmentMetric as string | undefined;
  if (raw && allowed.includes(raw as AppointmentMetric)) {
    return raw as AppointmentMetric;
  }
  return null;
}

export function resolveBookingMetric(
  params: Record<string, any>,
  prompt: string,
):
  | 'count'
  | 'revenue'
  | 'busiest_provider'
  | 'cancelled'
  | 'no_shows'
  | 'unpaid'
  | 'upcoming'
  | 'confirmed'
  | 'pending'
  | 'completed'
  | 'overview'
  | null {
  type BookingMetric =
    | 'count'
    | 'revenue'
    | 'busiest_provider'
    | 'cancelled'
    | 'no_shows'
    | 'unpaid'
    | 'upcoming'
    | 'confirmed'
    | 'pending'
    | 'completed'
    | 'overview';

  const lower = prompt.toLowerCase();
  if (/upcoming|coming up|later today|rest of (the )?day/i.test(lower)) return 'upcoming';
  if (/busiest|most appointments|most bookings|fully booked|most packed/i.test(lower)) {
    return 'busiest_provider';
  }
  if (/revenue|how much.*(made|earned)|total.*(\$|usd|money)|sales/i.test(lower)) {
    return 'revenue';
  }
  if (/no[\s-]?show/i.test(lower)) return 'no_shows';
  if (/cancel/i.test(lower) && !/reassign|recover/i.test(lower)) return 'cancelled';
  if (/unpaid|not paid|pending payment/i.test(lower)) return 'unpaid';
  if (/confirmed/i.test(lower)) return 'confirmed';
  if (/pending/i.test(lower) && /\bappointments?\b|\bbookings?\b/i.test(lower)) return 'pending';
  if (/completed|finished|done appointments/i.test(lower)) return 'completed';
  if (
    /how many|count|number of|total appointments|total bookings|summarize today|summarize.*for all providers|any appointments/i.test(
      lower,
    )
  ) {
    return 'count';
  }
  if (/empty|quiet|slow day|no bookings/i.test(lower)) return 'count';
  if (/overview|summary|breakdown|stats/i.test(lower) && /\bappointments?\b|\bbookings?\b/i.test(lower)) {
    return 'overview';
  }

  const allowed: BookingMetric[] = [
    'count',
    'revenue',
    'busiest_provider',
    'cancelled',
    'no_shows',
    'unpaid',
    'upcoming',
    'confirmed',
    'pending',
    'completed',
    'overview',
  ];
  const raw = params.bookingMetric as string | undefined;
  if (raw && allowed.includes(raw as BookingMetric)) {
    return raw as BookingMetric;
  }
  return null;
}

export function resolveCustomerMetric(
  params: Record<string, any>,
  prompt: string,
): CustomerInsightMetric {
  const allowed: CustomerInsightMetric[] = [
    'most_no_shows',
    'most_bookings',
    'most_cancellations',
    'at_risk',
    'high_no_show',
    'vip',
    'top_spenders',
    'new_customers',
    'overview',
  ];

  const lower = prompt.toLowerCase();
  if (
    /pay(?:s|ing)?\s+(?:the\s+)?most|paid the most|spent the most|top spenders?|highest spend|most paid|who paid|best payers?|customers? who paid|biggest spender|most revenue from customers?/i.test(
      lower,
    )
  ) {
    return 'top_spenders';
  }
  if (/new customers?|recent customers?|first.?time|never booked/i.test(lower)) return 'new_customers';
  if (/high no[\s-]?show|no[\s-]?show rate/i.test(lower)) return 'high_no_show';
  if (/no[\s-]?show|no show/i.test(lower)) return 'most_no_shows';
  if (/at[\s-]?risk|churn|inactive|not been back|haven't been|lapsed/i.test(lower)) return 'at_risk';
  if (/cancel/i.test(lower)) return 'most_cancellations';
  if (/vip|loyal/i.test(lower)) return 'vip';
  if (/best customer|top customer/i.test(lower) && !/paid|spend|spent|\$|revenue|pay/i.test(lower)) {
    return 'vip';
  }
  if (/most booking|most appointment|books the most|frequent|top booker/i.test(lower)) {
    return 'most_bookings';
  }

  const raw = params.customerMetric as string | undefined;
  if (raw && allowed.includes(raw as CustomerInsightMetric)) {
    return raw as CustomerInsightMetric;
  }

  return 'overview';
}
