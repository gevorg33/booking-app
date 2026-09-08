import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import {
  parseDateInput,
  toIsoDay,
  formatDateDisplay,
  formatTimeDisplay,
  getTodayDateKey,
  buildUtcStartTimeFromDayAndTime,
  applyRelativeDateFromPrompt,
} from '../../common/utils/date-format.util.js';
import {
  normalizeTime24,
  timeToMinutes,
} from '../../common/utils/time-format.util.js';
import {
  addDaysToDateKey,
  resolveTimezone,
} from '../../common/utils/timezone.util.js';
import dayjs from 'dayjs';
import { resolveEntity } from './ai-entity-resolution.util.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { enrichListServicesPaymentFilterParamsFromPrompt } from './ai-list-services-payment-filters.util.js';
import {
  normalizeAvailabilityWindows,
  normalizeAvailabilityServiceCategory,
  type AvailabilityWindow,
} from './ai-flexible-availability.util.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface DateRange {
  start: string;
  end: string;
}

const MONTH_NAME_MAP: Record<string, number> = {
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
  if (candidate.isBefore(today, 'day')) {
    const daysAgo = today.diff(candidate, 'day');
    if (daysAgo > 90) year += 1;
  }
  return year;
}

function buildIsoDay(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseMonthDayToken(token: string, timeZone: string): string | null {
  const trimmed = token.trim();
  const lower = trimmed.toLowerCase();

  const dayMonth = lower.match(
    /^(\d{1,2})(?:st|nd|rd|th)?(?:\s+of\s+|\s+)([a-z]+)(?:\s+(\d{4}))?$/,
  );
  if (dayMonth) {
    const month = MONTH_NAME_MAP[dayMonth[2]];
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
    const month = MONTH_NAME_MAP[monthDay[1]];
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

/** "next 5 days", "for the next 14 days" — inclusive range starting today. */
export function extractNextDaysRangeFromPrompt(
  prompt: string,
  timeZone = 'UTC',
): DateRange | null {
  const match = prompt
    .toLowerCase()
    .match(/\b(?:for\s+)?(?:the\s+)?next\s+(\d{1,3})\s+days?\b/);
  if (!match) return null;

  const count = parseInt(match[1], 10);
  if (!Number.isFinite(count) || count < 1 || count > 366) return null;

  const tz = resolveTimezone(timeZone);
  const todayKey = getTodayDateKey(tz);
  return {
    start: todayKey,
    end: addDaysToDateKey(todayKey, count - 1, tz),
  };
}

/** Parse explicit date ranges from natural language (e.g. "June 2-June 10", "from 02/06 to 10/06"). */
export function extractDateRangeFromPrompt(
  prompt: string,
  timeZone = 'UTC',
): DateRange | null {
  const lower = prompt.toLowerCase();

  const sameMonth = lower.match(
    /\b(?:from\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:-|–|to|through)\s*(?:\1\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/,
  );
  if (sameMonth) {
    const month = MONTH_NAME_MAP[sameMonth[1]];
    const startDay = parseInt(sameMonth[2], 10);
    const endDay = parseInt(sameMonth[3], 10);
    const year = inferYearForMonthDay(startDay, month, timeZone);
    return {
      start: buildIsoDay(year, month, startDay),
      end: buildIsoDay(year, month, endDay),
    };
  }

  const crossMonth = lower.match(
    /\bfrom\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:-|–|to|through)\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/,
  );
  if (crossMonth) {
    const startMonth = MONTH_NAME_MAP[crossMonth[1]];
    const endMonth = MONTH_NAME_MAP[crossMonth[3]];
    const startDay = parseInt(crossMonth[2], 10);
    const endDay = parseInt(crossMonth[4], 10);
    const startYear = inferYearForMonthDay(startDay, startMonth, timeZone);
    let endYear = startYear;
    if (
      endMonth < startMonth ||
      (endMonth === startMonth && endDay < startDay)
    ) {
      endYear += 1;
    }
    return {
      start: buildIsoDay(startYear, startMonth, startDay),
      end: buildIsoDay(endYear, endMonth, endDay),
    };
  }

  const numericRange = prompt.match(
    /\b(\d{1,2}[/_]\d{1,2}(?:[/_]\d{2,4})?)\s*(?:-|–|to|through)\s*(\d{1,2}[/_]\d{1,2}(?:[/_]\d{2,4})?)\b/i,
  );
  if (numericRange) {
    const start = parseMonthDayToken(numericRange[1], timeZone);
    const end = parseMonthDayToken(numericRange[2], timeZone);
    if (start && end) return { start, end };
  }

  // e2e-bug.67 — app-generated prompts use ISO YYYY-MM-DD (not slash dates).
  const isoRange = prompt.match(
    /\b(\d{4}-\d{2}-\d{2})\s*(?:-|–|to|through)\s*(\d{4}-\d{2}-\d{2})\b/,
  );
  if (isoRange) {
    return { start: isoRange[1], end: isoRange[2] };
  }

  return null;
}

/** Single calendar day from prompt (e.g. "on June 5th", "05/06/2026") — not ranges. */
export function extractSingleIsoDayFromPrompt(
  prompt: string,
  timeZone = 'UTC',
): string | null {
  const range = extractDateRangeFromPrompt(prompt, timeZone);
  if (range) {
    return range.start === range.end ? range.start : null;
  }

  const isoDay = prompt.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoDay) {
    return isoDay[1];
  }

  const lower = prompt.toLowerCase();
  const monthDayRe =
    /\b(?:(?:on|for)\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?\b/;
  const monthDayMatch = lower.match(monthDayRe);
  if (monthDayMatch) {
    const month = MONTH_NAME_MAP[monthDayMatch[1]];
    const day = parseInt(monthDayMatch[2], 10);
    const year = monthDayMatch[3]
      ? parseInt(monthDayMatch[3], 10)
      : inferYearForMonthDay(day, month, timeZone);
    return buildIsoDay(year, month, day);
  }

  const dayMonthRe =
    /\b(\d{1,2})(?:st|nd|rd|th)?(?:\s+of\s+|\s+)(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s+(\d{4}))?\b/;
  const dayMonthMatch = lower.match(dayMonthRe);
  if (dayMonthMatch) {
    const month = MONTH_NAME_MAP[dayMonthMatch[2]];
    const day = parseInt(dayMonthMatch[1], 10);
    const year = dayMonthMatch[3]
      ? parseInt(dayMonthMatch[3], 10)
      : inferYearForMonthDay(day, month, timeZone);
    return buildIsoDay(year, month, day);
  }

  const numeric = prompt.match(/\b(\d{1,2}[/_]\d{1,2}(?:[/_]\d{2,4})?)\b/);
  if (numeric) {
    return parseMonthDayToken(numeric[1], timeZone);
  }

  const tz = resolveTimezone(timeZone);
  const todayKey = getTodayDateKey(tz);
  const today = dayjs.tz(todayKey, tz);
  const weekdayMap: Record<string, number> = {
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
  const nextDayMatch = lower.match(
    /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/,
  );
  if (nextDayMatch) {
    const target = weekdayMap[nextDayMatch[1]];
    const cur = today.day();
    let delta = (target - cur + 7) % 7;
    if (delta === 0) delta = 7;
    return today.add(delta, 'day').format('YYYY-MM-DD');
  }

  const bareDayMatch = lower.match(
    /\b(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/,
  );
  if (bareDayMatch) {
    const target = weekdayMap[bareDayMatch[1]];
    const cur = today.day();
    const delta = (target - cur + 7) % 7;
    return today.add(delta, 'day').format('YYYY-MM-DD');
  }

  return null;
}

/**
 * When the prompt names one explicit day, override session date ranges (e.g. stale "this week").
 */
export function applyPromptDateOverride(
  params: Record<string, any>,
  prompt?: string,
  timeZone = 'UTC',
): void {
  if (!prompt?.trim()) return;

  applyRelativeDateFromPrompt(params, prompt, timeZone);

  const nextDays = extractNextDaysRangeFromPrompt(prompt, timeZone);
  if (nextDays) {
    params.dateFrom = formatDateDisplay(nextDays.start);
    params.dateTo = formatDateDisplay(nextDays.end);
    delete params.date;
    return;
  }

  const singleIso = extractSingleIsoDayFromPrompt(prompt, timeZone);
  if (singleIso) {
    const display = formatDateDisplay(singleIso);
    params.date = display;
    params.dateFrom = display;
    params.dateTo = display;
    return;
  }

  const range = extractDateRangeFromPrompt(prompt, timeZone);
  if (range) {
    params.dateFrom = formatDateDisplay(range.start);
    params.dateTo = formatDateDisplay(range.end);
    if (range.start === range.end) {
      params.date = formatDateDisplay(range.start);
    }
  }
}

/** Fill dateFrom/dateTo from prompt when the LLM only extracted the start date. */
export function enrichDateRangeFromPrompt(
  params: Record<string, any>,
  prompt: string,
  timeZone = 'UTC',
): void {
  const nextDays = extractNextDaysRangeFromPrompt(prompt, timeZone);
  if (nextDays) {
    params.dateFrom = formatDateDisplay(nextDays.start);
    params.dateTo = formatDateDisplay(nextDays.end);
    return;
  }

  if (params.dateFrom && params.dateTo) return;
  const range = extractDateRangeFromPrompt(prompt, timeZone);
  if (!range) return;
  params.dateFrom = formatDateDisplay(range.start);
  params.dateTo = formatDateDisplay(range.end);
}

export function normalizeEmployeeNameToken(name: string): string {
  return name
    .trim()
    .replace(/^both\s+/i, '')
    .replace(/^all\s+/i, '')
    .replace(/['']s$/i, '')
    .trim();
}

export function splitEmployeeNameList(input: string): string[] {
  return input
    .split(/[/,]|(?:\s+and\s+)|(?:\s+or\s+)/i)
    .map(normalizeEmployeeNameToken)
    .filter(Boolean);
}

export function getRequestedEmployeeNames(params: {
  employeeName?: string | null;
  employeeNames?: string[] | null;
  allProviders?: boolean | null;
}): string[] {
  if (params.allProviders) return [];
  if (params.employeeNames?.length) {
    return params.employeeNames.map(normalizeEmployeeNameToken).filter(Boolean);
  }
  if (params.employeeName) return splitEmployeeNameList(params.employeeName);
  return [];
}

/**
 * Does the query mention this name as a whole word?
 *
 * Word boundaries are computed on Unicode letters rather than `\b`, which is
 * ASCII-only and would break the Armenian and Russian names §48 documented
 * across this corpus.
 */
/**
 * Armenian case endings, longest first — e2e-bug.480.
 *
 * Armenian attaches case endings straight onto the name, so "Աննա" appears in a
 * sentence as "Աննայի" / "Աննային". A plain boundary test refuses those,
 * because the character after the name is a letter.
 *
 * A **closed set** rather than "allow a short suffix": measured, a blanket
 * three-letter allowance matches "Անի" inside "անիծիր" (to curse) and "Արա"
 * inside "արագ" (quick) — which is e2e-bug.362 again, in another script. Only
 * real endings are accepted, and the ending must itself end the word.
 *
 * Russian is absent, and the reason needs stating carefully — §207 first got it
 * wrong. «Мария» → «Марии» is a **stem change**, which no suffix rule reaches.
 * But «Иван» → «Ивана» / «Ивану» is a **clean suffix**, which one would. So
 * Russian is not out of reach on principle, only unfinished: the masculine
 * forms are tractable and the feminine ones need stemming. Pinned as a known
 * miss in `fuzzy-match-copies.boundary.spec.ts` and tracked in e2e-bug.481 —
 * adding it needs its own corpus score, because Russian endings are single
 * letters and far likelier to collide than the Armenian set.
 */
const ARMENIAN_CASE_SUFFIX =
  /^(?:յին|յից|յով|ներին|ների|յի|ին|ից|ով|ուն|ու|ը|ն|ի)(?![\p{L}\p{N}])/u;

const HAS_ARMENIAN = /\p{Script=Armenian}/u;

/**
 * Russian masculine case endings, longest first — e2e-bug.481 (D5-d).
 *
 * The tractable half of the Russian problem, exactly as the note above scopes
 * it: «Иван» → «Ивана» / «Ивану» / «Иваном» / «Иване» are **clean suffixes**,
 * so the name is still a prefix of the inflected word and a suffix rule reaches
 * it. «Мария» → «Марии» is a **stem change** (я → ии) — the name is no longer a
 * prefix at all — so no rule of this shape can reach it, and none is attempted.
 * Feminine forms remain a known miss.
 *
 * Two guards, because the note is right that Russian endings collide far more
 * readily than the Armenian set:
 *
 * 1. **A closed set of real endings**, and the ending must itself end the word
 *    — the same rule Armenian uses. This is what stops "Ան"-style prefix
 *    matches: «Анна» after «Ан» leaves "на", which is not an ending, so it is
 *    refused. Likewise «Иванна» after «Иван» leaves "на".
 * 2. **A minimum stem length of 3.** Armenian needs no such guard because its
 *    endings are mostly multi-character; the Russian set is dominated by single
 *    letters, where a two-letter name plus "а" would match almost anything.
 *
 * What this deliberately does **not** solve: a name that is also a common noun
 * («Роман» → «романа», a novel) still collides. That is inherent to matching a
 * name as a word and is equally true of the Armenian set; it is bounded by the
 * candidate list only containing real employees.
 */
const RUSSIAN_CASE_SUFFIX = /^(?:ом|ем|а|у|е)(?![\p{L}\p{N}])/u;

const HAS_CYRILLIC = /\p{Script=Cyrillic}/u;

/** See guard 2 above. */
const MIN_CYRILLIC_STEM = 3;

function queryMentionsName(query: string, name: string): boolean {
  if (!name) return false;
  let from = 0;
  for (;;) {
    const at = query.indexOf(name, from);
    if (at === -1) return false;
    const before = query[at - 1];
    const after = query[at + name.length];
    const isLetter = (ch: string | undefined) =>
      ch !== undefined && /[\p{L}\p{N}]/u.test(ch);
    if (!isLetter(before)) {
      if (!isLetter(after)) return true;
      // e2e-bug.480 — the name is followed by letters; accept it only when
      // those letters are an Armenian case ending on an Armenian name.
      if (
        HAS_ARMENIAN.test(name) &&
        ARMENIAN_CASE_SUFFIX.test(query.slice(at + name.length))
      ) {
        return true;
      }
      // e2e-bug.481 — the same rule for Russian masculine endings. Gated on a
      // minimum stem length; see `RUSSIAN_CASE_SUFFIX`.
      if (
        HAS_CYRILLIC.test(name) &&
        name.length >= MIN_CYRILLIC_STEM &&
        RUSSIAN_CASE_SUFFIX.test(query.slice(at + name.length))
      ) {
        return true;
      }
    }
    from = at + 1;
  }
}

export function fuzzyMatchByName<T extends { name: string }>(
  items: T[],
  name: string,
): T | undefined {
  const normalized = normalizeEmployeeNameToken(name);
  const lower = normalized.toLowerCase();
  if (!lower) return undefined;

  return (
    items.find((item) => item.name.toLowerCase() === lower) ||
    items.find((item) => item.name.toLowerCase().includes(lower)) ||
    // e2e-bug.362 — the query may contain the item's name, but only as a WORD.
    //
    // This tier was a raw `lower.includes(item.name)`, which meant any short
    // name matched almost any sentence: an employee called "Al" was returned
    // for "is the salon open" (s-**al**-on) and for "book Alice for a haircut".
    // Both were confident-looking matches for someone the user never named.
    //
    // Anchoring to word boundaries keeps the tier doing its job — "book me a
    // haircut with Al" still resolves — while requiring the name to actually
    // appear as a word rather than as letters inside one.
    items.find((item) => queryMentionsName(lower, item.name.toLowerCase())) ||
    items.find((item) =>
      item.name
        .toLowerCase()
        .split(/\s+/)
        .some(
          (part) =>
            part === lower ||
            // "Joh" → "John Baker": the item's token starts with the query.
            part.startsWith(lower) ||
            // e2e-bug.362, second instance. This was `lower.startsWith(part)`,
            // which matched any query merely BEGINNING with a shorter name —
            // an employee "Ան" resolved from "Աննա գրանցիր" (Anna). Same defect
            // as tier 3, one tier down, and the ticket only named tier 3.
            queryMentionsName(lower, part),
        ),
    )
  );
}

/** Collapse spaces/punctuation so "face massage" matches catalog "facemassage". */
export {
  expandServiceLookupQueries,
  normalizeServiceLookup,
} from './ai-service-lookup-synonyms.util.js';
import {
  expandServiceLookupQueries,
  normalizeServiceLookup,
} from './ai-service-lookup-synonyms.util.js';

/**
 * e2e-bug.199 — customers say "haircut" but many salon catalogs only list
 * "hairstyle". Synonym groups live in ai-service-lookup-synonyms.util.ts.
 */

function fuzzyMatchServiceByNameCore<T extends { name: string }>(
  items: T[],
  name: string,
): T | undefined {
  const lower = name.trim().toLowerCase();
  if (!lower) return undefined;
  const normalized = normalizeServiceLookup(lower);

  const exact = items.find((item) => item.name.toLowerCase() === lower);
  if (exact) return exact;

  const exactNorm = items.find(
    (item) => normalizeServiceLookup(item.name) === normalized,
  );
  if (exactNorm) return exactNorm;

  let best: T | undefined;
  let bestLen = 0;
  for (const item of items) {
    const normName = normalizeServiceLookup(item.name);
    if (
      normName.length >= 4 &&
      (normalized.includes(normName) || normName.includes(normalized))
    ) {
      if (normName.length > bestLen) {
        best = item;
        bestLen = normName.length;
      }
    }
  }
  if (best) return best;

  return (
    items.find((item) => item.name.toLowerCase().includes(lower)) ||
    items.find((item) => lower.includes(item.name.toLowerCase()))
  );
}

export function fuzzyMatchServiceByName<T extends { name: string }>(
  items: T[],
  name: string,
): T | undefined {
  const primary = fuzzyMatchServiceByNameCore(items, name);
  if (primary) return primary;

  for (const alias of expandServiceLookupQueries(name).slice(1)) {
    const hit = fuzzyMatchServiceByNameCore(items, alias);
    if (hit) return hit;
  }
  return undefined;
}

/** Exact catalog name match for create-service dedup — no fuzzy substring matching. */
export function findServiceByExactName<T extends { name: string }>(
  items: T[],
  name: string,
): T | undefined {
  const lower = name.trim().toLowerCase();
  if (!lower) return undefined;
  const normalized = normalizeServiceLookup(lower);

  return (
    items.find((item) => item.name.toLowerCase() === lower) ||
    items.find((item) => normalizeServiceLookup(item.name) === normalized)
  );
}

const SERVICE_ROLE_WORDS =
  /\b(?:specialists?|therapists?|providers?|stylists?|masseurs?|doctors?|professionals?)\b/gi;
const SERVICE_QUALITY_WORDS =
  /\b(?:best|top|highest(?:\s+-?\s*rated)?|highly\s+rated|recommended?)\b/gi;

/** Remove role/quality words so "massage specialist" → "massage". */
export function stripServiceRoleNoise(query: string): string {
  return query
    .replace(SERVICE_ROLE_WORDS, ' ')
    .replace(SERVICE_QUALITY_WORDS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match one or many catalog services from a customer query.
 * Broad tokens like "massage" return every service whose name contains that token.
 * e2e-bug.199 — also tries synonym aliases (haircut ↔ hairstyle) when the primary
 * query finds nothing.
 */
export function matchServicesByQuery<T extends { id: string; name: string }>(
  items: T[],
  query: string,
): T[] {
  const cleaned = stripServiceRoleNoise(query);
  if (!cleaned) return [];

  for (const candidate of expandServiceLookupQueries(cleaned)) {
    const matched = matchServicesByQueryCore(items, candidate);
    if (matched.length > 0) return matched;
  }
  return [];
}

function matchServicesByQueryCore<T extends { id: string; name: string }>(
  items: T[],
  query: string,
): T[] {
  const cleaned = stripServiceRoleNoise(query);
  if (!cleaned) return [];

  const normalizedQuery = normalizeServiceLookup(cleaned);
  if (normalizedQuery.length < 3) return [];

  const tokenMatches = items.filter((item) =>
    normalizeServiceLookup(item.name).includes(normalizedQuery),
  );

  const queryWords = cleaned
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  const isSingleBroadToken = queryWords.length === 1;

  if (tokenMatches.length > 1 && isSingleBroadToken) {
    return [...tokenMatches].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (queryWords.length > 1 && tokenMatches.length > 1) {
    const wordMatches = tokenMatches.filter((item) => {
      const norm = normalizeServiceLookup(item.name);
      return queryWords.every((word) =>
        norm.includes(normalizeServiceLookup(word)),
      );
    });
    if (wordMatches.length > 1) {
      return [...wordMatches].sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  const exact = fuzzyMatchServiceByNameCore(items, cleaned);
  if (exact) return [exact];

  if (tokenMatches.length > 0) {
    return [...tokenMatches].sort((a, b) => a.name.localeCompare(b.name));
  }

  return [];
}

/** Extract service(s) from top-rated / recommend specialist prompts. */
export function extractRecommendServicesFromPrompt<
  T extends { id: string; name: string },
>(prompt: string, services: T[]): T[] {
  const patterns = [
    /\b(?:who\s+is\s+)?(?:the\s+)?(?:best|top|highest(?:\s+-?\s*rated)?)\s+(.+?)(?:\s+specialists?|\s+therapists?|\?|$)/i,
    /\b(?:suggest|recommend)\s+(?:\w+\s+){0,4}(?:specialists?|therapists?)\s+(?:for|for\s+a)?\s+(.+?)(?:\?|$)/i,
    /\b(?:best|top|highest(?:\s+-?\s*rated)?)\s+(.+?)\s*$/i,
    /\b(?:specialists?|therapists?)\s+(?:for|for\s+a)\s+(.+?)(?:\?|$)/i,
  ];

  for (const re of patterns) {
    const match = prompt.match(re);
    if (match?.[1]) {
      const found = matchServicesByQuery(services, match[1].trim());
      if (found.length) return found;
    }
  }

  const single = fuzzyMatchServiceByName(
    services,
    stripServiceRoleNoise(prompt),
  );
  if (single) {
    const broad = matchServicesByQuery(services, single.name);
    return broad.length ? broad : [single];
  }

  return matchServicesByQuery(services, prompt);
}

export function inferServiceGroupLabel(
  services: Array<{ name: string }>,
  query?: string,
): string {
  if (services.length === 1) return services[0].name;

  const cleaned = query ? stripServiceRoleNoise(query) : '';
  const normalizedQuery = cleaned ? normalizeServiceLookup(cleaned) : '';
  if (
    normalizedQuery.length >= 4 &&
    services.every((s) =>
      normalizeServiceLookup(s.name).includes(normalizedQuery),
    )
  ) {
    return `${cleaned} services`;
  }

  return `${services.length} services`;
}

/**
 * Verdict-returning sibling of `resolveEmployees` — D5 / §231.
 *
 * `resolveEmployees` picks **one** employee per requested name via
 * `fuzzyMatchByName` and cannot say "ambiguous", so two providers sharing a
 * name resolve to whichever sorted first. Slice 8 fixed that for
 * `handleCreateBooking` by checking each requested name at the handler; the
 * audit in §231 found the same silent pick on seven further writing paths.
 *
 * `allProviders` short-circuits exactly as the original does — asking for
 * everyone is never ambiguous. `not_found` is left to the caller's existing
 * miss handling, so acceptance can only stay the same or widen.
 */
export function resolveEmployeesVerdict(
  employees: Employee[],
  params: {
    employeeName?: string | null;
    employeeNames?: string[] | null;
    allProviders?: boolean | null;
  },
): {
  targets: Employee[];
  ambiguous?: {
    requestedName: string;
    clarification: string;
    candidates: { id: string; name: string }[];
  };
} {
  if (params.allProviders) return { targets: employees };

  for (const name of getRequestedEmployeeNames(params)) {
    const verdict = resolveEntity(employees, name, { entityLabel: 'provider' });
    if (verdict.status === 'ambiguous') {
      return {
        targets: [],
        ambiguous: {
          requestedName: name,
          clarification:
            verdict.clarification ?? `More than one provider matches "${name}".`,
          candidates: verdict.candidates.map((c) => ({
            id: String(c.id ?? ''),
            name: c.name,
          })),
        },
      };
    }
  }
  return { targets: resolveEmployees(employees, params) };
}

export function resolveEmployees(
  employees: Employee[],
  params: {
    employeeName?: string | null;
    employeeNames?: string[] | null;
    allProviders?: boolean | null;
  },
): Employee[] {
  if (params.allProviders) return employees;

  const names = getRequestedEmployeeNames(params);

  const resolved: Employee[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const emp = fuzzyMatchByName(employees, name);
    if (emp && !seen.has(emp.id)) {
      seen.add(emp.id);
      resolved.push(emp);
    }
  }
  return resolved;
}

/**
 * Verdict-returning sibling of `resolveTemplate` — D5 / §227.
 *
 * `resolveTemplate` returns `T | undefined` and so cannot say "ambiguous". Its
 * fallback, `fuzzyMatchByName`, matches on **substring**, so "Summer" hits both
 * "Summer 2025" and "Summer 2026" and the caller silently gets whichever sorted
 * first — on paths that apply, update, duplicate or delete a schedule.
 *
 * This does not replace `resolveTemplate`: the nine call sites differ in what
 * they can return on a refusal, so they migrate individually. `not_found` still
 * falls back to the legacy matcher, so acceptance can only stay the same or
 * widen — the rule every D5 migration has used.
 */
export function resolveTemplateVerdict(
  templates: ScheduleTemplate[],
  name?: string | null,
): {
  template?: ScheduleTemplate;
  ambiguous?: { clarification: string; candidates: { id: string; name: string }[] };
} {
  if (!name?.trim()) return { template: resolveTemplate(templates, name) };

  const verdict = resolveEntity(templates, name, { entityLabel: 'template' });
  if (verdict.status === 'ambiguous') {
    return {
      ambiguous: {
        clarification:
          verdict.clarification ?? `More than one template matches "${name}".`,
        candidates: verdict.candidates.map((c) => ({
          id: String(c.id ?? ''),
          name: c.name,
        })),
      },
    };
  }
  return { template: verdict.match ?? resolveTemplate(templates, name) };
}

export function resolveTemplate(
  templates: ScheduleTemplate[],
  name?: string | null,
): ScheduleTemplate | undefined {
  if (!name?.trim()) {
    return templates.find((t) => !t.isDeleted && t.isActive) ?? templates[0];
  }
  return fuzzyMatchByName(templates, name);
}

type CatalogServiceRow = {
  id: string;
  name: string;
  category?: { name: string } | null;
};

function matchServicesByCatalogCategoryName<T extends CatalogServiceRow>(
  catalog: T[],
  query: string,
): T[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];
  return catalog.filter((item) => item.category?.name?.toLowerCase() === lower);
}

/**
 * Match catalog service types from list/check/recommend params.
 * `serviceCategory` is a keyword on service TYPE NAMES (e.g. "massage" → Swedish massage),
 * not a requirement for a ServiceCategory entity named "Massage".
 * Falls back to exact catalog category name only when no service name matches exist.
 */
export function resolveServicesFromCatalogParams<T extends CatalogServiceRow>(
  catalog: T[],
  params: {
    serviceCategory?: string | null;
    serviceName?: string | null;
    serviceNames?: string[] | null;
    serviceId?: string | null;
  },
): T[] {
  if (Array.isArray(params.serviceNames) && params.serviceNames.length) {
    const matched: T[] = [];
    const seen = new Set<string>();
    for (const name of params.serviceNames) {
      if (typeof name !== 'string') continue;
      const svc = fuzzyMatchServiceByName(catalog, name);
      if (svc && !seen.has(svc.id)) {
        seen.add(svc.id);
        matched.push(svc);
      }
    }
    if (matched.length) return matched;
  }

  // e2e-bug.321 — an already-resolved exact serviceId pin (a single-service
  // match, not a category browse) must not be re-expanded via fuzzy name
  // matching below, which can spuriously pull in an unrelated catalog row
  // whose normalized name happens to contain the pinned name as a substring
  // (e.g. "Women's cut" contains "Men's cut" — wo|men's cut).
  if (
    !params.serviceCategory &&
    typeof params.serviceId === 'string' &&
    params.serviceId.trim()
  ) {
    const exact = catalog.find((item) => item.id === params.serviceId);
    if (exact) return [exact];
  }

  const keyword = params.serviceCategory ?? params.serviceName;
  if (keyword) {
    const byServiceTypeName = matchServicesByQuery(catalog, String(keyword));
    if (byServiceTypeName.length > 0) return byServiceTypeName;
    return matchServicesByCatalogCategoryName(catalog, String(keyword));
  }

  return [];
}

/**
 * e2e-bug.143 — LLM sometimes stuffs pronouns into serviceCategory
 * ("What services do I offer?" → serviceCategory="i"). Reject those before
 * filtering the catalog.
 * e2e-bug.226 — also reject multi-word filler copied from list phrasing
 * ("what services do you offer?" → serviceName="you offer").
 */
const LIST_SERVICES_FILTER_STOPWORDS = new Set([
  'i',
  'me',
  'my',
  'we',
  'us',
  'our',
  'you',
  'your',
  'they',
  'them',
  'their',
  'a',
  'an',
  'the',
  'do',
  'does',
  'did',
  'have',
  'has',
  'offer',
  'offers',
  'offering',
  'offerings',
  'provide',
  'provides',
  'providing',
  'all',
  'any',
  'some',
  'what',
  'which',
  'service',
  'services',
  'option',
  'options',
  'menu',
  'catalog',
  'available',
]);

/** Trailing clause the classifier often copies from "what … do you offer?" */
const LIST_SERVICES_TRAILING_FILLER =
  /\s+(?:(?:do\s+)?you\s+(?:offer|have|provide)|we\s+offer|i\s+offer|are\s+available)\s*$/i;

export function sanitizeListServicesFilterValue(
  value: string | null | undefined,
): string | null {
  if (typeof value !== 'string') return null;
  let trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length < 2) return null;

  // e2e-bug.193 / e2e-bug.226 — bare or trailing list-phrasing fillers
  if (
    /^(?:(?:do\s+)?you\s+(?:offer|have|provide)|we\s+offer|i\s+offer|are\s+available)$/i.test(
      trimmed,
    )
  ) {
    return null;
  }
  // e2e-bug.226 — "massage you offer" → "massage"; bare "you offer" → empty
  trimmed = trimmed.replace(LIST_SERVICES_TRAILING_FILLER, '').trim();
  if (!trimmed || trimmed.length < 2) return null;

  // e2e-bug.238 — book-half cues ("soonest"/"nearest"/"next available") are not catalog filters.
  // Inline (do not import ai-payments.util — circular via intent-heuristics).
  if (
    /^(?:the|a|an|slot|time|appointment|appointments|opening|openings|available|free|open|next|first|soonest|nearest|upcoming|earliest|next\s+available|first\s+available|soonest\s+available|nearest\s+available|earliest\s+available)$/i.test(
      trimmed,
    )
  ) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  if (LIST_SERVICES_FILTER_STOPWORDS.has(lower)) return null;

  const tokens = lower.split(/\s+/).filter(Boolean);
  if (
    tokens.length > 1 &&
    tokens.every((token) => LIST_SERVICES_FILTER_STOPWORDS.has(token))
  ) {
    return null;
  }

  return trimmed;
}

/** Extract a service-type keyword from "what kinds of massage do you have?" prompts. */
export function extractServiceTypeKeywordFromListPrompt(
  prompt: string,
): string | null {
  const patterns = [
    /\b(?:what|which)\s+(?:kind|type|sort)s?\s+of\s+([a-z][\w\s-]{1,30}?)(?:\s+do\s+you|\s+you\s+(?:have|offer)|\?|$)/i,
    /\b(?:what|which)\s+([a-z][\w\s-]{1,30}?)\s+(?:service\s+)?types?\s+(?:do\s+you\s+)?(?:have|offer)/i,
    /\b(?:what|which)\s+([a-z][\w\s-]{1,30}?)\s+(?:services?|options?)\s+(?:do\s+you\s+)?(?:have|offer)/i,
    // e2e-bug.53 — "Do you offer facemassage services?"
    /\bdo\s+you\s+offer\s+([a-z][\w\s-]{1,40}?)\s+services?\b/i,
    /\bdo\s+you\s+offer\s+([a-z][\w\s-]{1,40}?)(?:\s*\?|$)/i,
    /\blist\s+(?:all\s+)?([a-z][\w\s-]{1,30}?)\s+(?:service\s+)?types?\b/i,
    // e2e-bug.238 — "Show me evening massage options under $100 then book…"
    /\b(?:show|list)\s+(?:me\s+)?(?:(?:morning|afternoon|evening)\s+)?([a-z][\w-]{2,30})\s+options?\b/i,
    // e2e-bug.297 / e2e-bug.298 — short show/list category nouns
    /\b(?:show|list)\s+(?:me\s+)?(facials?|haircuts?|hairstyles?|massages?|trims?|cuts?)\b/i,
    /\blist\s+([a-z][\w-]{2,30})\s+under\b/i,
    /\b(?:recommend|suggest)\s+(?:me\s+)?(?:some\s+)?([a-z][\w\s-]{1,40}?)\s+services?\b/i,
    /\bi\s+want\s+(?:a|an|the)\s+([a-z][\w\s-]{1,30}?)(?=\s*(?:tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun|,|$))/i,
  ];

  for (const re of patterns) {
    const match = prompt.match(re);
    const raw = match?.[1]?.trim();
    if (!raw) continue;
    const cleaned = stripServiceRoleNoise(
      raw.replace(/\s+(services?|types?)$/i, '').trim(),
    );
    if (cleaned.length >= 3) return cleaned;
  }

  return null;
}

export function enrichListServicesParamsFromPrompt(
  prompt: string,
  params: {
    serviceCategory?: string | null;
    serviceName?: string | null;
    serviceNames?: string[] | null;
    prepaymentMode?: string | null;
    onlinePaymentEnabled?: boolean;
    maxPrice?: number;
  },
): {
  serviceCategory?: string | null;
  serviceName?: string | null;
  serviceNames?: string[] | null;
  prepaymentMode?: string | null;
  onlinePaymentEnabled?: boolean;
  maxPrice?: number;
} {
  const withPayment = enrichListServicesPaymentFilterParamsFromPrompt(
    params,
    prompt,
  );
  const cleaned = { ...withPayment };

  if (
    typeof cleaned.serviceCategory === 'string' ||
    cleaned.serviceCategory === null
  ) {
    cleaned.serviceCategory = sanitizeListServicesFilterValue(
      cleaned.serviceCategory,
    );
  }
  if (typeof cleaned.serviceName === 'string' || cleaned.serviceName === null) {
    cleaned.serviceName = sanitizeListServicesFilterValue(cleaned.serviceName);
  }
  if (Array.isArray(cleaned.serviceNames)) {
    const names = cleaned.serviceNames
      .map((name) => sanitizeListServicesFilterValue(name))
      .filter((name): name is string => !!name);
    cleaned.serviceNames = names.length ? names : null;
  }

  const hasFilter = !!(
    cleaned.serviceCategory ||
    cleaned.serviceName ||
    (Array.isArray(cleaned.serviceNames) && cleaned.serviceNames.length)
  );
  if (hasFilter) return cleaned;

  const keyword = extractServiceTypeKeywordFromListPrompt(prompt);
  if (!keyword) return cleaned;
  const sanitizedKeyword = sanitizeListServicesFilterValue(keyword);
  if (!sanitizedKeyword) return cleaned;
  // e2e-bug.517 — the capture above keeps the raw token, so 'Show haircuts under
  // $50' produced the plural 'haircuts' while every other path folds it to
  // 'haircut'. Fold through the declared vocabulary rather than a second copy of
  // it: normalizeAvailabilityServiceCategory already states how these collapse
  // (facials/haircuts/hairstyles/trims), and it deliberately leaves bare
  // 'cut'/'cuts' alone for e2e-bug.323, so routing through it respects that
  // carve-out by construction instead of restating it here.
  return {
    ...cleaned,
    serviceCategory: normalizeAvailabilityServiceCategory(sanitizedKeyword),
  };
}

/** Only persist service filters that resolve against the live catalog (public assistant session). */
export function resolvePublicAssistantSessionServiceFields(
  params: {
    serviceName?: string | null;
    serviceCategory?: string | null;
  },
  catalog: Array<{ id: string; name: string }>,
): { serviceName: string | null; serviceCategory: string | null } {
  const serviceName = params.serviceName?.trim() || null;
  const serviceCategory = params.serviceCategory?.trim() || null;

  if (serviceName) {
    const match = fuzzyMatchServiceByName(catalog, serviceName);
    if (match) {
      return { serviceName: match.name, serviceCategory: null };
    }
    if (
      serviceCategory &&
      resolveServicesFromCatalogParams(catalog, { serviceCategory }).length > 0
    ) {
      return { serviceName: null, serviceCategory };
    }
    return { serviceName: null, serviceCategory: null };
  }

  if (
    serviceCategory &&
    resolveServicesFromCatalogParams(catalog, { serviceCategory }).length > 0
  ) {
    return { serviceName: null, serviceCategory };
  }

  return { serviceName: null, serviceCategory: null };
}

/**
 * Verdict-returning sibling of `resolveServices` — D5 / §236.
 *
 * `fuzzyMatchServiceByName`'s fourth tier is a **substring** match, so
 * `"massage"` matches both `"Swedish massage"` and `"Deep tissue massage"` and
 * `.find()` silently returns one. On a bulk cancel that means cancelling one
 * service's bookings and reporting success, having ignored the other.
 *
 * **Refuses rather than widening.** Matching *both* would be a defensible
 * reading of "cancel all massage bookings" on a read-only path, but on a
 * destructive one it silently enlarges the blast radius, which is the worse of
 * the two failure modes. Read-only callers keep `resolveServices`.
 */
export function resolveServicesVerdict(
  catalog: Service[],
  params: { serviceName?: string | null; serviceNames?: string[] | null },
): {
  services: Service[];
  ambiguous?: {
    requestedName: string;
    clarification: string;
    candidates: { id: string; name: string }[];
  };
} {
  const names: string[] = params.serviceNames?.length
    ? [...params.serviceNames]
    : params.serviceName
      ? params.serviceName
          .split(/[/,]|(?:\s+and\s+)|(?:\s+or\s+)/i)
          .map((n) => n.trim())
          .filter(Boolean)
      : [];

  for (const name of names) {
    const verdict = resolveEntity(catalog, name, { entityLabel: 'service' });
    if (verdict.status === 'ambiguous') {
      return {
        services: [],
        ambiguous: {
          requestedName: name,
          clarification:
            verdict.clarification ?? `More than one service matches "${name}".`,
          candidates: verdict.candidates.map((c) => ({
            id: String(c.id ?? ''),
            name: c.name,
          })),
        },
      };
    }
  }
  return { services: resolveServices(catalog, params) };
}

export function resolveServices(
  catalog: Service[],
  params: { serviceName?: string | null; serviceNames?: string[] | null },
): Service[] {
  const rawNames: string[] = [];
  if (params.serviceNames?.length) rawNames.push(...params.serviceNames);
  else if (params.serviceName) {
    rawNames.push(
      ...params.serviceName
        .split(/[/,]|(?:\s+and\s+)|(?:\s+or\s+)/i)
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }

  const resolved: Service[] = [];
  const seen = new Set<string>();
  for (const name of rawNames) {
    const svc = fuzzyMatchServiceByName(catalog, name);
    if (svc && !seen.has(svc.id)) {
      seen.add(svc.id);
      resolved.push(svc);
    }
  }
  return resolved;
}

export function getEmployeeServices(
  employee: Employee,
  catalog: Service[],
): Service[] {
  if (employee.serviceIds?.length) {
    const allowed = new Set(employee.serviceIds);
    return catalog.filter((s) => allowed.has(s.id));
  }
  return catalog;
}

/** Services explicitly assigned on the employee profile (empty when none assigned). */
export function getEmployeeAssignedServices(
  employee: Employee,
  catalog: Service[],
): Service[] {
  if (!employee.serviceIds?.length) {
    return [];
  }
  const allowed = new Set(employee.serviceIds);
  return catalog.filter((s) => allowed.has(s.id));
}

/** Attach only services assigned to the provider on service_block periods. */
export function resolveDirectSchedulePeriodServiceIds(
  period: { type?: string; serviceIds?: string[] | null },
  employeeServiceIds: string[] | null | undefined,
): string[] {
  if (period.type === 'unavailable_block') return [];

  const periodIds = [...new Set((period.serviceIds ?? []).filter(Boolean))];
  const assigned = [...new Set((employeeServiceIds ?? []).filter(Boolean))];

  if (assigned.length === 0) return periodIds;
  if (periodIds.length === 0) return assigned;

  const allowed = new Set(assigned);
  const filtered = periodIds.filter((id) => allowed.has(id));
  return filtered.length > 0 ? filtered : assigned;
}

export function isProviderOwnServicesPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(his|her|their)\s+services?\b/i.test(lower) ||
    /\b(?:with|for)\s+(?:his|her|their)\s+services\b/i.test(lower) ||
    /\bprovider'?s?\s+services\b/i.test(lower) ||
    /\bassigned\s+services\b/i.test(lower)
  );
}

/** Services to attach to schedule periods — never the full catalog when the employee has assignments. */
export function resolveScheduleServicesForEmployee(
  employee: Employee,
  catalog: Service[],
  params: { serviceName?: string | null; serviceNames?: string[] | null },
  prompt?: string,
): Service[] {
  const assigned = getEmployeeAssignedServices(employee, catalog);
  const ownServicesPrompt = prompt
    ? isProviderOwnServicesPrompt(prompt)
    : false;
  const fromParams = resolveServices(catalog, params);

  if (ownServicesPrompt || fromParams.length === 0) {
    return assigned;
  }

  if (assigned.length === 0) {
    return fromParams;
  }

  return fromParams.filter((s) => assigned.some((a) => a.id === s.id));
}

/** Parse relative dates and ranges from prompt + params into ISO day range. */
export function resolveDateRange(
  params: {
    date?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    _timeZone?: string | null;
  },
  prompt?: string,
  timeZone?: string,
): DateRange | null {
  const tz = resolveTimezone(timeZone ?? params._timeZone ?? 'UTC');
  const promptSingle = extractSingleIsoDayFromPrompt(prompt ?? '', tz);
  if (promptSingle) {
    return { start: promptSingle, end: promptSingle };
  }

  const nextDaysRange = extractNextDaysRangeFromPrompt(prompt ?? '', tz);
  if (nextDaysRange) return nextDaysRange;

  if (params.dateFrom && params.dateTo) {
    return {
      start: toIsoDay(params.dateFrom, tz),
      end: toIsoDay(params.dateTo, tz),
    };
  }

  const promptRange = extractDateRangeFromPrompt(prompt ?? '', tz);
  if (promptRange) return promptRange;

  const lower = (prompt ?? '').toLowerCase();
  const todayKey = getTodayDateKey(tz);
  const today = dayjs.tz(todayKey, tz);

  const weekRange = (offsetWeeks = 0) => {
    const day = today.day();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = today.add(mondayOffset + offsetWeeks * 7, 'day');
    const end = start.add(6, 'day');
    return {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
    };
  };

  // AI-ROADMAP Phase 4 — multi-unit relative ranges. Added to this resolver
  // rather than a new one: `resolveDateRange` is already timezone-correct
  // (unlike the `resolveTomorrowDateKey` family, e2e-bug.363), and a second
  // range parser would be the fifth re-parser Phase 4 exists to remove.
  const numberWords: Record<string, number> = {
    a: 1,
    an: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
  };
  const countFrom = (raw: string): number | null => {
    const digits = Number(raw);
    if (Number.isInteger(digits) && digits > 0) return digits;
    return numberWords[raw] ?? null;
  };

  // "the next fortnight" is exactly two weeks; spelling it out avoids a
  // separate branch.
  const fortnight = /\bnext\s+fortnight\b|\bfortnight\b/i.test(lower);
  const nextUnits = lower.match(
    /\bnext\s+(\d{1,2}|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(day|week|month)s?\b/,
  );
  if (fortnight || nextUnits) {
    const count = fortnight ? 2 : countFrom(nextUnits![1]);
    const unit = fortnight ? 'week' : nextUnits![2];
    if (count !== null) {
      // Inclusive of today, so "the next 3 weeks" is 21 days starting now —
      // the reading a user checking their diary expects.
      const end =
        unit === 'month'
          ? today.add(count, 'month').subtract(1, 'day')
          : today
              .add(count * (unit === 'week' ? 7 : 1), 'day')
              .subtract(1, 'day');
      return {
        start: today.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD'),
      };
    }
  }

  // "the rest of the month" starts today, not on the 1st.
  if (
    /\b(?:rest|remainder|balance)\s+of\s+(?:the\s+|this\s+)?month\b/i.test(
      lower,
    )
  ) {
    return {
      start: today.format('YYYY-MM-DD'),
      end: today.endOf('month').format('YYYY-MM-DD'),
    };
  }
  if (/\b(?:rest|remainder)\s+of\s+(?:the\s+|this\s+)?week\b/i.test(lower)) {
    return {
      start: today.format('YYYY-MM-DD'),
      end: weekRange(0).end,
    };
  }

  if (/\blast week\b/i.test(lower)) return weekRange(-1);
  if (/\bthis week\b/i.test(lower)) return weekRange(0);
  if (/\bnext week\b/i.test(lower)) return weekRange(1);

  if (/\bthis month\b/i.test(lower) || /\bcurrent month\b/i.test(lower)) {
    return {
      start: today.startOf('month').format('YYYY-MM-DD'),
      end: today.endOf('month').format('YYYY-MM-DD'),
    };
  }

  if (/\blast month\b/i.test(lower)) {
    const prev = today.subtract(1, 'month');
    return {
      start: prev.startOf('month').format('YYYY-MM-DD'),
      end: prev.endOf('month').format('YYYY-MM-DD'),
    };
  }

  // e2e-bug.467 / §217 — quarter and year had no branch here at all, so
  // "summarize P&L this quarter" resolved to null and the caller silently fell
  // back to its default window. Three parsers already emit `dateRange:
  // 'this_quarter' | 'this_year'`, and nothing could turn either into a range:
  // the phrase map had no key and this resolver had no test. Computed from the
  // month because dayjs' `quarterOfYear` plugin is not loaded in this file, and
  // loading one for three lines of arithmetic is the larger change.
  const quarterRange = (offsetQuarters: number) => {
    const start = today
      .startOf('month')
      .subtract(today.month() % 3, 'month')
      .add(offsetQuarters * 3, 'month');
    return {
      start: start.format('YYYY-MM-DD'),
      end: start.add(2, 'month').endOf('month').format('YYYY-MM-DD'),
    };
  };

  if (/\b(?:this|current)\s+quarter\b/i.test(lower)) return quarterRange(0);
  if (/\b(?:last|previous)\s+quarter\b/i.test(lower)) return quarterRange(-1);
  if (/\bnext\s+quarter\b/i.test(lower)) return quarterRange(1);

  if (/\b(?:this|current)\s+year\b/i.test(lower)) {
    return {
      start: today.startOf('year').format('YYYY-MM-DD'),
      end: today.endOf('year').format('YYYY-MM-DD'),
    };
  }

  if (/\b(?:last|previous)\s+year\b/i.test(lower)) {
    const prev = today.subtract(1, 'year');
    return {
      start: prev.startOf('year').format('YYYY-MM-DD'),
      end: prev.endOf('year').format('YYYY-MM-DD'),
    };
  }

  const namedMonth = lower.match(
    /\b(?:on|in|for|during)\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/,
  );
  if (namedMonth) {
    const month = MONTH_NAME_MAP[namedMonth[1]];
    const year = inferYearForMonthDay(1, month, tz);
    const monthStart = dayjs.tz(
      `${year}-${String(month).padStart(2, '0')}-01`,
      tz,
    );
    return {
      start: monthStart.startOf('month').format('YYYY-MM-DD'),
      end: monthStart.endOf('month').format('YYYY-MM-DD'),
    };
  }

  const weekdayMap: Record<string, number> = {
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
  const nextDayMatch = lower.match(
    /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/,
  );
  if (nextDayMatch) {
    const target = weekdayMap[nextDayMatch[1]];
    const cur = today.day();
    let delta = (target - cur + 7) % 7;
    if (delta === 0) delta = 7;
    const iso = today.add(delta, 'day').format('YYYY-MM-DD');
    return { start: iso, end: iso };
  }

  const bareDayMatch = lower.match(
    /\b(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/,
  );
  if (bareDayMatch) {
    const target = weekdayMap[bareDayMatch[1]];
    const cur = today.day();
    const delta = (target - cur + 7) % 7;
    const iso = today.add(delta, 'day').format('YYYY-MM-DD');
    return { start: iso, end: iso };
  }

  if (/\btoday\b/i.test(lower) || /\btonight\b/i.test(lower)) {
    return { start: todayKey, end: todayKey };
  }
  if (/\btomorrow\b/i.test(lower)) {
    const iso = addDaysToDateKey(todayKey, 1, tz);
    return { start: iso, end: iso };
  }
  if (/\byesterday\b/i.test(lower)) {
    const iso = addDaysToDateKey(todayKey, -1, tz);
    return { start: iso, end: iso };
  }

  if (/\ball[\s-]?(?:time|times)\b/i.test(lower)) {
    return {
      start: today.subtract(10, 'year').format('YYYY-MM-DD'),
      end: todayKey,
    };
  }

  // e2e-bug.154 — "in total" / "altogether" without a named period → all-time
  // window (same span as "all time"), never a silent single empty day.
  if (
    /\b(bookings?|appointments?)\b/i.test(lower) &&
    /\b(in\s+total|altogether|overall|ever)\b/i.test(lower) &&
    !/\b(today|tomorrow|yesterday|this week|last week|this month|last month)\b/i.test(
      lower,
    )
  ) {
    return {
      start: today.subtract(10, 'year').format('YYYY-MM-DD'),
      end: todayKey,
    };
  }

  if (params.date) {
    const iso = toIsoDay(params.date, tz);
    return { start: iso, end: iso };
  }

  return null;
}

/** Extract single date hint from prompt for params.date (display format). */
export function extractSingleDateFromPrompt(
  prompt: string,
  timeZone = 'UTC',
): string | null {
  const iso = extractSingleIsoDayFromPrompt(prompt, timeZone);
  return iso ? formatDateDisplay(iso) : null;
}

export function enumerateDaysInRange(range: DateRange): Date[] {
  const start = parseDateInput(range.start);
  const end = parseDateInput(range.end);
  if (!start || !end) return [];

  const days: Date[] = [];
  const cur = new Date(start);
  cur.setUTCHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setUTCHours(0, 0, 0, 0);

  while (cur <= endDay) {
    days.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

/** Expand params + prompt into ISO day keys; prompt ranges beat a lone params.date from the LLM. */
export function resolveScheduleDates(
  params: Record<string, any>,
  prompt?: string,
): string[] {
  const timeZone = params._timeZone ?? 'UTC';
  const promptSingle = extractSingleIsoDayFromPrompt(prompt ?? '', timeZone);
  if (promptSingle) {
    return [promptSingle];
  }

  const promptRange = extractDateRangeFromPrompt(prompt ?? '', timeZone);
  if (promptRange) {
    return enumerateDaysInRange(promptRange).map(
      (d) => d.toISOString().split('T')[0],
    );
  }
  if (params.dateFrom && params.dateTo) {
    const range = resolveDateRange(params, prompt, timeZone);
    if (range) {
      return enumerateDaysInRange(range).map(
        (d) => d.toISOString().split('T')[0],
      );
    }
  }
  const range = resolveDateRange(params, prompt, timeZone);
  if (range) {
    return enumerateDaysInRange(range).map(
      (d) => d.toISOString().split('T')[0],
    );
  }
  if (params.date) {
    return [toIsoDay(params.date, timeZone)];
  }
  return [];
}

/** ISO day keys for direct schedule workflow steps (single day, list, or range). */
export function resolveDirectScheduleDateKeys(
  params: Record<string, unknown>,
): string[] {
  const listed = params.dates;
  if (Array.isArray(listed) && listed.length > 0) {
    return listed.map((d) => String(d).trim()).filter(Boolean);
  }

  const range = params.dateRange as DateRange | undefined;
  if (range?.start && range?.end) {
    return enumerateDaysInRange(range).map(
      (d) => d.toISOString().split('T')[0],
    );
  }

  if (params.dateFrom && params.dateTo) {
    return enumerateDaysInRange({
      start: String(params.dateFrom),
      end: String(params.dateTo),
    }).map((d) => d.toISOString().split('T')[0]);
  }

  if (params.date) {
    const iso = toIsoDay(String(params.date));
    return iso ? [iso] : [];
  }

  return [];
}

export function parseWeekdaysFromParams(
  params: { applyDays?: number[] | null; weekdays?: string[] | null },
  prompt?: string,
): number[] {
  if (params.applyDays?.length) return params.applyDays;

  const text = [...(params.weekdays ?? []), prompt ?? '']
    .join(' ')
    .toLowerCase();

  const map: Record<string, number> = {
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
    thur: 4,
    thurs: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };

  const found = new Set<number>();
  for (const [key, val] of Object.entries(map)) {
    if (text.includes(key)) found.add(val);
  }

  if (found.size > 0) return [...found].sort();

  if (text.includes('weekday') || text.includes('weekdays')) {
    return [1, 2, 3, 4, 5];
  }
  if (text.includes('weekend')) return [0, 6];

  return [0, 1, 2, 3, 4, 5, 6];
}

const TIME_RANGE_IN_PROMPT =
  /(?:between\s+)?\d{1,2}(?::\d{2})?\s*[-–]\s*\d{1,2}(?::\d{2})?/i;

export function hasExplicitTimeWindow(
  params: { timeFrom?: string | null; timeTo?: string | null },
  prompt?: string,
): boolean {
  if (params.timeFrom && params.timeTo) return true;
  return TIME_RANGE_IN_PROMPT.test(prompt ?? '');
}

export function parseTimeWindow(
  params: { timeFrom?: string | null; timeTo?: string | null },
  prompt?: string,
  defaults = { timeFrom: '09:00', timeTo: '19:00' },
): { timeFrom: string; timeTo: string } {
  if (params.timeFrom && params.timeTo) {
    return {
      timeFrom: normalizeTime24(params.timeFrom),
      timeTo: normalizeTime24(params.timeTo),
    };
  }

  const match = (prompt ?? '').match(
    /(?:between\s+|from\s+)?(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?/i,
  );
  if (match) {
    const timeFrom = normalizeTime24(`${match[1]}:${match[2] ?? '00'}`);
    const timeTo = normalizeTime24(`${match[3]}:${match[4] ?? '00'}`);
    if (timeToMinutes(timeTo) > timeToMinutes(timeFrom)) {
      return { timeFrom, timeTo };
    }
  }

  return defaults;
}

/** Earliest bookable time from phrasing like "after 16:00" or "from 16:00 onwards". */
export function parseEarliestBookingTimeFromPrompt(
  prompt: string,
): string | null {
  const after = prompt.match(/\bafter\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (after) return normalizeTime24(`${after[1]}:${after[2] ?? '00'}`);

  const fromOnwards = prompt.match(
    /\bfrom\s+(\d{1,2})(?::(\d{2}))?\s+onwards\b/i,
  );
  if (fromOnwards)
    return normalizeTime24(`${fromOnwards[1]}:${fromOnwards[2] ?? '00'}`);

  return null;
}

export function bookingOverlapsTimeWindow(
  booking: { startTime: Date; endTime: Date },
  isoDay: string,
  timeFrom: string,
  timeTo: string,
): boolean {
  const windowStart = new Date(
    buildUtcStartTimeFromDayAndTime(isoDay, timeFrom),
  );
  const windowEnd = new Date(buildUtcStartTimeFromDayAndTime(isoDay, timeTo));
  const start =
    booking.startTime instanceof Date
      ? booking.startTime
      : new Date(booking.startTime);
  const end =
    booking.endTime instanceof Date
      ? booking.endTime
      : new Date(booking.endTime);
  return start < windowEnd && end > windowStart;
}

/** True when an open slot range overlaps a daily HH:MM window (e.g. 17:00–19:00). */
export function openSlotOverlapsTimeRange(
  slot: { start: string; end?: string },
  timeFrom: string,
  timeTo: string,
): boolean {
  const slotStart = timeToMinutes(slot.start);
  const slotEnd = slot.end ? timeToMinutes(slot.end) : slotStart + 30;
  const from = timeToMinutes(timeFrom);
  const to = timeToMinutes(timeTo);
  return slotStart < to && slotEnd > from;
}

export function filterOpenSlotsByTimeRange<
  T extends { start: string; end?: string },
>(slots: T[], timeFrom: string, timeTo: string): T[] {
  return slots.filter((slot) =>
    openSlotOverlapsTimeRange(slot, timeFrom, timeTo),
  );
}

/** Narrow bookings to an explicit timeSlot or timeFrom–timeTo window (overlap, not start-only). */
export function filterBookingsByTimeConstraints<
  T extends { startTime: Date; endTime: Date },
>(
  bookings: T[],
  params: {
    timeSlot?: string | null;
    timeFrom?: string | null;
    timeTo?: string | null;
    date?: string | null;
    _timeZone?: string;
  },
  prompt?: string,
): T[] {
  if (hasExplicitTimeWindow(params, prompt)) {
    const window = parseTimeWindow(params, prompt);
    return bookings.filter((b) => {
      const start =
        b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
      const isoDay = start.toISOString().split('T')[0];
      return bookingOverlapsTimeWindow(
        b,
        isoDay,
        window.timeFrom,
        window.timeTo,
      );
    });
  }

  if (params.timeSlot) {
    const slot = normalizeTime24(params.timeSlot);
    // Bookings store wall-clock HH:mm as UTC components (see dashboard toISO).
    return bookings.filter((b) => {
      const start =
        b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
      const hh = String(start.getUTCHours()).padStart(2, '0');
      const min = String(start.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${min}` === slot;
    });
  }

  return bookings;
}

export function isScheduleTemplateCreationPrompt(prompt?: string): boolean {
  return /\bcreate\b[\s\S]{0,80}\b(?:schedule\s+)?template\b/i.test(
    prompt ?? '',
  );
}

/**
 * e2e-bug.136 — remove/unblock a schedule *block* (block_schedules row), not
 * applied periods/slots. Must win over clear_schedule.
 */
export function isDeleteScheduleBlockPrompt(prompt?: string): boolean {
  const lower = (prompt ?? '').toLowerCase();
  if (!lower.trim()) return false;
  if (/\bunblock\b/.test(lower)) return true;
  if (
    /\b(?:full[-\s]?day\s+)?(?:schedule\s+)?block\b/.test(lower) &&
    /\b(?:remove|delete|clear|lift|cancel)\b/.test(lower)
  ) {
    return true;
  }
  return (
    /\b(?:remove|delete|clear)\b/.test(lower) &&
    /\b(?:the\s+)?(?:full[-\s]?day\s+)?block\b/.test(lower)
  );
}

/** cleanup / clear / wipe / reset provider schedule (not appointments). */
export function isClearSchedulePrompt(prompt?: string): boolean {
  const lower = (prompt ?? '').toLowerCase();
  if (!/\bschedule\b/.test(lower)) return false;
  // e2e-bug.136 — "unblock / remove the block" is delete_schedule_block.
  if (isDeleteScheduleBlockPrompt(prompt)) return false;
  if (
    /\b(from calendar|appointment|booking)s?\b/.test(lower) &&
    !/\bschedule\b/.test(lower)
  ) {
    return false;
  }
  return (
    /\b(clean\s*up|clear|reset|wipe)\b/.test(lower) ||
    (/\bremove\b/.test(lower) &&
      !/\b(from calendar|appointment|booking)/.test(lower))
  );
}

export function isFullDayBlock(
  params: { blockFullDay?: boolean | null },
  prompt?: string,
): boolean {
  if (params.blockFullDay) return true;
  const lower = (prompt ?? '').toLowerCase();
  return (
    lower.includes('full day') ||
    lower.includes('entire day') ||
    lower.includes('whole day') ||
    lower.includes('block the day') ||
    !!lower.match(
      /block\s+\d{1,2}[/_]\d{1,2}[/_]\d{4}\s*(entirely|completely)?/,
    )
  );
}

export type EmployeeNameRef = Pick<Employee, 'id' | 'name'>;

function employeeMentionedInPrompt(
  prompt: string,
  employee: EmployeeNameRef,
): boolean {
  const lower = prompt.toLowerCase();
  if (lower.includes(employee.name.toLowerCase())) return true;

  const parts = employee.name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0].toLowerCase();
    const last = parts[parts.length - 1].toLowerCase();
    if (
      first.length >= 3 &&
      last.length >= 4 &&
      new RegExp(`\\b${first}\\b`).test(lower) &&
      new RegExp(`\\b${last}\\b`).test(lower)
    ) {
      return true;
    }
  }

  const first = parts[0]?.toLowerCase();
  return !!(
    first &&
    first.length >= 3 &&
    new RegExp(`\\b${first}\\b`).test(lower)
  );
}

/** All providers named in the prompt (e.g. "Mary and Jujo"). Longest names matched first. */
export function matchEmployeesInPrompt<T extends EmployeeNameRef>(
  prompt: string,
  employees: T[],
): T[] {
  const sorted = [...employees].sort((a, b) => b.name.length - a.name.length);
  const matched: T[] = [];
  const seen = new Set<string>();

  for (const employee of sorted) {
    if (!employeeMentionedInPrompt(prompt, employee)) continue;
    if (seen.has(employee.id)) continue;
    seen.add(employee.id);
    matched.push(employee);
  }

  return matched;
}

/** Longest-name-first match so "Karo Mazmanyan" wins over partial overlaps. */
export function promptMentionsSpecificEmployee<T extends EmployeeNameRef>(
  prompt: string,
  employees: T[],
): T | undefined {
  return matchEmployeesInPrompt(prompt, employees)[0];
}

/** True only when the user explicitly targets the whole team — not "clear all schedules for Karo". */
export function isTeamWideProviderScopePrompt(prompt: string): boolean {
  return (
    /\b(?:all|every)\s+(?:the\s+)?(?:employees?|providers?|staff|team|specialists?)\b/i.test(
      prompt,
    ) || /\ball providers\b|\beveryone\b|\bwhole team\b/i.test(prompt)
  );
}

export function resolveAllProvidersScope(
  prompt: string,
  params: {
    allProviders?: boolean | null;
    employeeName?: string | null;
    employeeNames?: string[] | null;
  },
  employees: Employee[] = [],
): boolean {
  if (isTeamWideProviderScopePrompt(prompt)) return true;

  const mentioned = promptMentionsSpecificEmployee(prompt, employees);
  if (mentioned) return false;

  if (params.employeeName || params.employeeNames?.length) return false;

  return params.allProviders === true;
}

/** Pin scope to named provider(s); clears stale session allProviders. */
export function sanitizeProviderScopeFromPrompt(
  prompt: string,
  params: Record<string, any>,
  employees: Employee[],
): void {
  const mentioned = matchEmployeesInPrompt(prompt, employees);
  if (mentioned.length > 1) {
    params.employeeNames = mentioned.map((e) => e.name);
    params.employeeName = null;
    params.allProviders = false;
    delete params.employeeIds;
    return;
  }
  if (mentioned.length === 1) {
    params.employeeName = mentioned[0].name;
    params.allProviders = false;
    delete params.employeeNames;
    delete params.employeeIds;
    return;
  }

  params.allProviders = resolveAllProvidersScope(prompt, params, employees);
  if (params.allProviders) {
    params.employeeName = null;
    delete params.employeeIds;
  }
}

function resolveUnavailableLabel(
  text: string,
  from: string,
  to: string,
  matchText: string,
): string {
  if (/lunch/i.test(matchText)) return 'Lunch';
  const lower = text.toLowerCase();
  if (
    /\blunch\b/.test(lower) &&
    lower.includes(`${from.split(':')[0]}-${to.split(':')[0]}`)
  ) {
    return 'Lunch';
  }
  return 'Unavailable';
}

/** Parse lunch/break/unavailable windows from natural language (e.g. "12-13 unavailable"). */
export function extractUnavailableBlocksFromPrompt(
  text: string,
): Array<{ from: string; to: string; label: string }> {
  const unavailableBlocks: Array<{ from: string; to: string; label: string }> =
    [];

  const patterns = [
    /\b(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(?:unavailable|off|blocked|break)\b/gi,
    /\b(?:unavailable|off|blocked|lunch|break)\s+(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\b/gi,
    /\b(?:make|mark)\s+(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s+(?:unavailable|off|blocked|break)\b/gi,
  ];

  for (const re of patterns) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const from = normalizeTime24(`${match[1]}:${match[2] ?? '00'}`);
      const to = normalizeTime24(`${match[3]}:${match[4] ?? '00'}`);
      if (timeToMinutes(to) > timeToMinutes(from)) {
        const label = resolveUnavailableLabel(text, from, to, match[0]);
        const duplicate = unavailableBlocks.some(
          (b) => b.from === from && b.to === to,
        );
        if (!duplicate) unavailableBlocks.push({ from, to, label });
      }
    }
  }

  if (
    unavailableBlocks.length === 0 &&
    /\b12\s*[-–]\s*13\b/.test(text) &&
    /unavailable|lunch|break/i.test(text)
  ) {
    unavailableBlocks.push({ from: '12:00', to: '13:00', label: 'Lunch' });
  }

  return unavailableBlocks.sort(
    (a, b) => timeToMinutes(a.from) - timeToMinutes(b.from),
  );
}

function normalizeSchedulePeriod(
  period: Record<string, any>,
): Record<string, any> {
  return {
    ...period,
    startTime: normalizeTime24(String(period.startTime)),
    endTime: normalizeTime24(String(period.endTime)),
    type: period.type ?? 'service_block',
    placeholderLabel: period.placeholderLabel ?? period.label,
  };
}

function hasUnavailableCoverage(
  periods: Array<Record<string, any>>,
  block: { from: string; to: string },
): boolean {
  const bStart = timeToMinutes(block.from);
  const bEnd = timeToMinutes(block.to);
  return periods.some((p) => {
    if (p.type !== 'unavailable_block') return false;
    const pStart = timeToMinutes(String(p.startTime));
    const pEnd = timeToMinutes(String(p.endTime));
    return pStart <= bStart && pEnd >= bEnd;
  });
}

/** Split overlapping service blocks and insert explicit unavailable periods. */
export function applyUnavailableBlocksToPeriods(
  periods: Array<Record<string, any>>,
  unavailableBlocks: Array<{ from: string; to: string; label: string }>,
): Array<Record<string, any>> {
  if (!unavailableBlocks.length) {
    return periods.map(normalizeSchedulePeriod);
  }

  let result = periods.map(normalizeSchedulePeriod);

  for (const block of unavailableBlocks) {
    const bStart = timeToMinutes(block.from);
    const bEnd = timeToMinutes(block.to);
    const next: Array<Record<string, any>> = [];

    for (const period of result) {
      if (period.type === 'unavailable_block') {
        next.push(period);
        continue;
      }

      const pStart = timeToMinutes(String(period.startTime));
      const pEnd = timeToMinutes(String(period.endTime));

      if (pEnd <= bStart || pStart >= bEnd) {
        next.push(period);
        continue;
      }

      if (pStart < bStart) {
        next.push({ ...period, endTime: block.from });
      }
      next.push({
        startTime: block.from,
        endTime: block.to,
        type: 'unavailable_block',
        placeholderLabel: block.label,
      });
      if (pEnd > bEnd) {
        next.push({ ...period, startTime: block.to });
      }
    }

    result = next.filter(
      (p) =>
        timeToMinutes(String(p.endTime)) > timeToMinutes(String(p.startTime)),
    );
  }

  for (const block of unavailableBlocks) {
    if (hasUnavailableCoverage(result, block)) continue;

    const bStart = timeToMinutes(block.from);
    const bEnd = timeToMinutes(block.to);
    const endsAtGapStart = result.some(
      (p) => timeToMinutes(String(p.endTime)) === bStart,
    );
    const startsAtGapEnd = result.some(
      (p) => timeToMinutes(String(p.startTime)) === bEnd,
    );

    if (endsAtGapStart && startsAtGapEnd) {
      result.push({
        startTime: block.from,
        endTime: block.to,
        type: 'unavailable_block',
        placeholderLabel: block.label,
      });
    }
  }

  return result.sort(
    (a, b) =>
      timeToMinutes(String(a.startTime)) - timeToMinutes(String(b.startTime)),
  );
}

/** Build service/unavailable periods from phrases like "9-19, 12-13 unavailable". */
export function inferDirectSchedulePeriods(
  params: Record<string, any>,
  prompt?: string,
): Array<Record<string, any>> {
  const text = prompt ?? '';
  const unavailableBlocks = extractUnavailableBlocksFromPrompt(text);

  if (Array.isArray(params.periods) && params.periods.length > 0) {
    return applyUnavailableBlocksToPeriods(params.periods, unavailableBlocks);
  }

  const window = parseTimeWindow(params, text, {
    timeFrom: '09:00',
    timeTo: '19:00',
  });

  if (unavailableBlocks.length === 0) {
    return [
      {
        startTime: window.timeFrom,
        endTime: window.timeTo,
        type: 'service_block',
      },
    ];
  }

  const periods: Array<Record<string, any>> = [];
  let cursor = window.timeFrom;

  for (const block of unavailableBlocks) {
    if (timeToMinutes(block.from) > timeToMinutes(cursor)) {
      periods.push({
        startTime: cursor,
        endTime: block.from,
        type: 'service_block',
      });
    }
    periods.push({
      startTime: block.from,
      endTime: block.to,
      type: 'unavailable_block',
      placeholderLabel: block.label,
    });
    cursor = block.to;
  }

  if (timeToMinutes(window.timeTo) > timeToMinutes(cursor)) {
    periods.push({
      startTime: cursor,
      endTime: window.timeTo,
      type: 'service_block',
    });
  }

  return periods;
}

export const PUBLIC_AVAILABILITY_SCAN_DAYS = 14;

export function hasExplicitWeekdayInAvailabilityPrompt(
  params: { weekdays?: string[] | null; applyDays?: number[] | null },
  prompt?: string,
): boolean {
  if (params.weekdays?.length || params.applyDays?.length) return true;
  return /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|weekdays?|weekend)\b/i.test(
    prompt ?? '',
  );
}

export type ResolvedPublicAvailabilityWindow = {
  dateKeys: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  timeSlot?: string | null;
};

function resolveRelativeAvailabilityDateKey(
  date: string,
  timeZone: string,
): string | null {
  const tz = resolveTimezone(timeZone);
  const lower = date.trim().toLowerCase();
  if (lower === 'tomorrow') {
    return addDaysToDateKey(getTodayDateKey(tz), 1, tz);
  }
  if (lower === 'today' || lower === 'tonight') {
    return getTodayDateKey(tz);
  }
  return null;
}

/** Resolve ISO day keys for one availability window without merging OR alternatives (avail-1.4). */
export function resolveDateKeysForAvailabilityWindow(
  window: AvailabilityWindow,
  timeZone: string,
  scanDays: number = PUBLIC_AVAILABILITY_SCAN_DAYS,
  referenceTodayDateKey?: string,
): string[] {
  const tz = resolveTimezone(timeZone);
  const todayKey = referenceTodayDateKey ?? getTodayDateKey(tz);
  const dropPast = (keys: string[]) => keys.filter((d) => d >= todayKey);

  if (window.weekdays?.length) {
    const weekdays = parseWeekdaysFromParams(
      { weekdays: window.weekdays },
      undefined,
    );
    const result: string[] = [];
    for (let offset = 0; offset < scanDays; offset++) {
      const dateKey = addDaysToDateKey(todayKey, offset, tz);
      if (weekdays.includes(dayjs.tz(dateKey, tz).day())) {
        result.push(dateKey);
      }
    }
    return dropPast(result);
  }

  if (window.date) {
    const relative = resolveRelativeAvailabilityDateKey(window.date, tz);
    if (relative) return dropPast([relative]);
    return dropPast([toIsoDay(window.date, tz)]);
  }

  if (window.timeOfDay || window.timeFrom || window.timeTo || window.timeSlot) {
    const result: string[] = [];
    for (let offset = 0; offset < scanDays; offset++) {
      result.push(addDaysToDateKey(todayKey, offset, tz));
    }
    return dropPast(result);
  }

  return [];
}

function resolveLegacyPublicAvailabilityDateKeys(
  params: Record<string, any>,
  prompt: string | undefined,
  timeZone: string,
  options: { defaultScanDays?: number; referenceTodayDateKey?: string } = {},
): string[] {
  const tz = resolveTimezone(timeZone);
  const scanDays = options.defaultScanDays ?? PUBLIC_AVAILABILITY_SCAN_DAYS;
  const enriched: Record<string, any> = { ...params, _timeZone: tz };
  enrichDateRangeFromPrompt(enriched, prompt ?? '', tz);
  applyRelativeDateFromPrompt(enriched, prompt ?? '', tz);

  const weekdays = parseWeekdaysFromParams(enriched, prompt);
  const hasWeekdayFilter = hasExplicitWeekdayInAvailabilityPrompt(
    enriched,
    prompt,
  );
  const todayKey = options.referenceTodayDateKey ?? getTodayDateKey(tz);

  const dropPast = (keys: string[]) => keys.filter((d) => d >= todayKey);

  if (hasWeekdayFilter) {
    const result: string[] = [];
    for (let offset = 0; offset < scanDays; offset++) {
      const dateKey = addDaysToDateKey(todayKey, offset, tz);
      if (weekdays.includes(dayjs.tz(dateKey, tz).day())) {
        result.push(dateKey);
      }
    }
    if (result.length > 0) return result;
  }

  const promptOnlyDates = resolveScheduleDates({ _timeZone: tz }, prompt);
  if (promptOnlyDates.length > 0) {
    return dropPast(promptOnlyDates).slice(0, scanDays);
  }

  if (enriched.dateFrom && enriched.dateTo) {
    const range = resolveDateRange(
      { dateFrom: enriched.dateFrom, dateTo: enriched.dateTo, _timeZone: tz },
      prompt,
      tz,
    );
    if (range) {
      return dropPast(
        enumerateDaysInRange(range).map((d) => d.toISOString().split('T')[0]),
      ).slice(0, scanDays);
    }
  }

  if (enriched.date) {
    return dropPast([toIsoDay(enriched.date, tz)]);
  }

  return [];
}

function toResolvedPublicAvailabilityWindow(
  window: AvailabilityWindow,
  dateKeys: string[],
): ResolvedPublicAvailabilityWindow {
  return {
    dateKeys,
    timeOfDay: window.timeOfDay ?? null,
    timeFrom: window.timeFrom ?? null,
    timeTo: window.timeTo ?? null,
    timeSlot: window.timeSlot ?? null,
  };
}

/** Resolve availability windows with per-window date keys + timeOfDay pairing (avail-1.4). */
export function resolvePublicAvailabilityWindows(
  params: Record<string, any>,
  prompt: string | undefined,
  timeZone: string,
  options: { defaultScanDays?: number; referenceTodayDateKey?: string } = {},
): ResolvedPublicAvailabilityWindow[] {
  const scanDays = options.defaultScanDays ?? PUBLIC_AVAILABILITY_SCAN_DAYS;
  const referenceTodayDateKey = options.referenceTodayDateKey;
  const hasExplicitWindows =
    Array.isArray(params.availabilityWindows) &&
    params.availabilityWindows.length > 0;
  const normalizedWindows = normalizeAvailabilityWindows(params);
  // e2e-bug.296 — inherit top-level date onto dateless windows so a classifier
  // availabilityWindows:[{timeOfDay}] does not expand to a 14-day scan when
  // enrichment already stamped date=today/tonight on params.
  const windowsWithInheritedDate =
    typeof params.date === 'string' && params.date.trim()
      ? normalizedWindows.map((window) =>
          window.date || window.weekdays?.length
            ? window
            : { ...window, date: params.date as string },
        )
      : normalizedWindows;

  if (hasExplicitWindows && windowsWithInheritedDate.length > 0) {
    return windowsWithInheritedDate
      .map((window) =>
        toResolvedPublicAvailabilityWindow(
          window,
          resolveDateKeysForAvailabilityWindow(
            window,
            timeZone,
            scanDays,
            referenceTodayDateKey,
          ),
        ),
      )
      .filter((window) => window.dateKeys.length > 0);
  }

  if (
    windowsWithInheritedDate.length === 1 &&
    (windowsWithInheritedDate[0]?.weekdays?.length ||
      windowsWithInheritedDate[0]?.date ||
      windowsWithInheritedDate[0]?.timeOfDay)
  ) {
    const window = windowsWithInheritedDate[0];
    const dateKeys = resolveDateKeysForAvailabilityWindow(
      window,
      timeZone,
      scanDays,
      referenceTodayDateKey,
    );
    if (dateKeys.length > 0) {
      return [toResolvedPublicAvailabilityWindow(window, dateKeys)];
    }
  }

  const legacyDateKeys = resolveLegacyPublicAvailabilityDateKeys(
    params,
    prompt,
    timeZone,
    options,
  );
  if (legacyDateKeys.length === 0) return [];

  return [
    {
      dateKeys: legacyDateKeys,
      timeOfDay: params.timeOfDay ?? null,
      timeFrom: params.timeFrom ?? null,
      timeTo: params.timeTo ?? null,
      timeSlot: params.timeSlot ?? null,
    },
  ];
}

/** Resolve ISO day keys for public customer availability (weekday names, ranges, single dates). */
/**
 * e2e-bug.365 — `referenceTodayDateKey` is forwarded, not dropped.
 *
 * `resolvePublicAvailabilityWindows` has always accepted an injectable "today";
 * this wrapper simply did not pass it on, so every caller and every test was
 * pinned to the real clock. A test asserting an explicit future date therefore
 * became a time bomb: `2026-06-15` passed until that date arrived, then failed
 * against the sibling test asserting past dates are dropped. Both are correct;
 * they just cannot both hold on a calendar that moves.
 */
export function resolvePublicAvailabilityDateKeys(
  params: Record<string, any>,
  prompt: string | undefined,
  timeZone: string,
  options: { defaultScanDays?: number; referenceTodayDateKey?: string } = {},
): string[] {
  return [
    ...new Set(
      resolvePublicAvailabilityWindows(
        params,
        prompt,
        timeZone,
        options,
      ).flatMap((window) => window.dateKeys),
    ),
  ];
}

/** Drop session date when the user names weekdays or relative days in an availability question. */
export function applyAvailabilityDateFromPrompt(
  params: Record<string, any>,
  prompt?: string,
  timeZone = 'UTC',
): void {
  if (!prompt?.trim()) return;

  const clearedStaleSessionDate = hasExplicitWeekdayInAvailabilityPrompt(
    params,
    prompt,
  );
  if (clearedStaleSessionDate) {
    delete params.date;
    delete params.dateFrom;
    delete params.dateTo;
  }

  if (!clearedStaleSessionDate) {
    applyPromptDateOverride(params, prompt, timeZone);
  }
}

export function shouldAutoExecute(
  action: string,
  stepCount: number,
  providerCount: number,
): boolean {
  const readOnly = [
    'list_bookings',
    'show_appointments',
    'check_availability',
    'summarize_day',
    'summarize_bookings',
    'list_services',
    'analyze_services',
    'summarize_staff',
    'lookup_customer',
    'list_customers',
    'summarize_waitlist',
    'lookup_service_assignment',
    'list_employees',
    'list_templates',
    'optimize_schedule',
    'summarize_utilization',
    'list_schedule_gaps',
    'summarize_customers',
    'analyze_appointments',
    'resolve_conflicts',
    'reassign_cancelled',
  ];
  if (readOnly.includes(action)) return false;

  if (providerCount > 1 || stepCount > 3) return false;
  return true;
}

/** ai-i4: combine heuristic auto-execute with LLM confidence thresholds */
export function resolveAutoExecute(params: {
  action: string;
  stepCount: number;
  providerCount: number;
  confidence?: number;
  thresholds?: { low: number; high: number };
}): boolean {
  if (params.confidence != null && params.thresholds) {
    if (params.confidence < params.thresholds.low) return false;
    if (params.confidence < params.thresholds.high) return false;
  }
  return shouldAutoExecute(
    params.action,
    params.stepCount,
    params.providerCount,
  );
}
