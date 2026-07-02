/** Shared OR availability window parse/normalize/scan helpers (avail-1.1 / discover-1.2). */
import {
  parseMultilingualTimeOfDayWindow,
  promptMentionsMultilingualTomorrow,
} from './ai-check-and-book-multilingual.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import { extractTimeSlotFromPrompt } from './ai-structural-extractors.js';
import { enrichListServicesParamsFromPrompt } from './ai-orchestration.helpers.js';
import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import {
  parseTimeOfDayWindow,
  type TimeOfDayWindow,
} from './ai-operations.util.js';

const AVAILABILITY_LUNCH_TIME_FROM = '12:00';
const AVAILABILITY_LUNCH_TIME_TO = '14:00';

export type AvailabilityTimeOfDay = TimeOfDayWindow;

export type AvailabilityWindow = {
  date?: string | null;
  weekdays?: string[] | null;
  timeOfDay?: AvailabilityTimeOfDay | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  timeSlot?: string | null;
  employeeName?: string | null;
};

const WEEKDAY_TOKEN_TO_NAME: Record<string, string> = {
  sunday: 'sunday',
  sun: 'sunday',
  monday: 'monday',
  mon: 'monday',
  tuesday: 'tuesday',
  tue: 'tuesday',
  tues: 'tuesday',
  wednesday: 'wednesday',
  wed: 'wednesday',
  thursday: 'thursday',
  thu: 'thursday',
  thur: 'thursday',
  thurs: 'thursday',
  friday: 'friday',
  fri: 'friday',
  saturday: 'saturday',
  sat: 'saturday',
};

const WEEKDAY_PATTERN =
  /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/i;

const TIME_OF_DAY_PATTERN =
  /\b(morning|afternoon|evening|tonight|eve|am|pm|lunch)\b/i;

const RELATIVE_DATE_PATTERN = /\b(tomorrow|today|tonight)\b/i;

const AVAILABILITY_OR_SPLIT_PATTERN =
  /\s*,\s*|\s+or\s+|\s+կամ\s+|\s+или\s+|\s+kam\s+/iu;

const AVAILABILITY_CLAUSE_CUE =
  /(?:\b(tomorrow|today|tonight)\b|(?:վաղը|վաղա|завтра|\bvagh(?:a|@|va)?\b|\bzavtra\b)|(?:առավոտ|утр[оа]?м|утром|ցերեկ|կեսօր|дн[её]м|երեկոյան|երեկո|вечером|вечер|\byereko\b|\bvecherom\b|\berek\b|\bkesor(?:in)?\b)|\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b|(?:ուրբաթ|շաբաթ|երկուշաբթի|երեքշաբթի|չորեքշաբթի|հինգշաբթի|կիրակի|urbat|pyatnic|subbot|понедельник|вторник|среду|среда|четверг|пятниц|суббот|воскресен)|\b(?:morning|afternoon|evening|tonight|eve|am|pm|lunch|weekend|asap)\b|\bas\s+soon\s+as\s+possible\b|\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)\b|\bafter\s+(?:work|\d{1,2}(?::\d{2})?)\b)/iu;

const AVAILABILITY_SERVICE_CATEGORY_LEAD_TOKENS = new Set([
  'haircut',
  'haircuts',
  'massage',
  'facial',
  'facials',
  'color',
  'colors',
  'lash',
  'lashes',
  'manicure',
  'pedicure',
  'wax',
  'waxing',
  'brows',
  'nails',
  'facemassage',
  'book',
  'show',
  'list',
]);

const CLAUSE_TEMPORAL_LEAD_PATTERN =
  /^(?:tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/i;

const MULTILINGUAL_WEEKDAY_CLAUSE_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  weekday: string;
}> = [
  { pattern: /\b(?:monday|mon)\b/i, weekday: 'monday' },
  { pattern: /\b(?:tuesday|tue|tues)\b/i, weekday: 'tuesday' },
  { pattern: /\b(?:wednesday|wed)\b/i, weekday: 'wednesday' },
  { pattern: /\b(?:thursday|thu|thur|thurs)\b/i, weekday: 'thursday' },
  { pattern: /\b(?:friday|fri)\b/i, weekday: 'friday' },
  { pattern: /\b(?:saturday|sat)\b/i, weekday: 'saturday' },
  { pattern: /\b(?:sunday|sun)\b/i, weekday: 'sunday' },
  { pattern: /երկուշաբթի|erkushabt/i, weekday: 'monday' },
  { pattern: /երեքշաբթի|erekshabt/i, weekday: 'tuesday' },
  { pattern: /չորեքշաբթի|chorekshabt/i, weekday: 'wednesday' },
  { pattern: /հինգշաբթի|hingshabt/i, weekday: 'thursday' },
  { pattern: /ուրբաթ|\burbat\b/i, weekday: 'friday' },
  { pattern: /շաբաթ|\bshabat\b/i, weekday: 'saturday' },
  { pattern: /կիրակի|kiraki/i, weekday: 'sunday' },
  { pattern: /понедельник|\bponedelnik\b/i, weekday: 'monday' },
  { pattern: /вторник|\bvtornik\b/i, weekday: 'tuesday' },
  { pattern: /(?:среду|среда)|\bsreda\b/i, weekday: 'wednesday' },
  { pattern: /четверг|\bchetverg\b/i, weekday: 'thursday' },
  { pattern: /пятниц\w*|\bpyatnic\w*\b/i, weekday: 'friday' },
  { pattern: /суббот\w*|\bsubbot\w*\b/i, weekday: 'saturday' },
  { pattern: /воскресен\w*|\bvoskresen\w*\b/i, weekday: 'sunday' },
];

const MULTILINGUAL_SERVICE_CATEGORY_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  category: string;
}> = [
  { pattern: /մազակրտում/i, category: 'haircut' },
  { pattern: /стрижк/iu, category: 'haircut' },
  { pattern: /մասաժ/i, category: 'massage' },
  { pattern: /массаж/iu, category: 'massage' },
  { pattern: /մանիկյուր/i, category: 'manicure' },
  { pattern: /маникюр/iu, category: 'manicure' },
  { pattern: /դեմքի/i, category: 'facial' },
  { pattern: /facial/i, category: 'facial' },
];

function normalizeWeekdayToken(token: string): string | null {
  const key = token.toLowerCase().replace(/\s/g, '');
  return WEEKDAY_TOKEN_TO_NAME[key] ?? null;
}

export function normalizeAvailabilityTimeOfDay(
  value: unknown,
): AvailabilityTimeOfDay | null {
  if (typeof value !== 'string') return null;
  const lower = value.toLowerCase();
  if (lower === 'morning' || lower === 'afternoon' || lower === 'evening') {
    return lower;
  }
  return null;
}

export function normalizeAvailabilityWindowEntry(
  value: unknown,
): AvailabilityWindow | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const window: AvailabilityWindow = {};

  if (raw.date != null && String(raw.date).trim()) {
    window.date = String(raw.date).trim();
  }

  if (Array.isArray(raw.weekdays)) {
    const weekdays = raw.weekdays
      .map((entry) =>
        typeof entry === 'string' ? normalizeWeekdayToken(entry) : null,
      )
      .filter((entry): entry is string => !!entry);
    if (weekdays.length > 0) {
      window.weekdays = [...new Set(weekdays)];
    }
  }

  const timeOfDay = normalizeAvailabilityTimeOfDay(raw.timeOfDay);
  if (timeOfDay) window.timeOfDay = timeOfDay;

  if (raw.timeFrom != null && String(raw.timeFrom).trim()) {
    window.timeFrom = String(raw.timeFrom).trim();
  }
  if (raw.timeTo != null && String(raw.timeTo).trim()) {
    window.timeTo = String(raw.timeTo).trim();
  }
  if (raw.timeSlot != null && String(raw.timeSlot).trim()) {
    window.timeSlot = String(raw.timeSlot).trim();
  }
  if (raw.employeeName != null && String(raw.employeeName).trim()) {
    window.employeeName = String(raw.employeeName).trim();
  }

  if (
    !window.date &&
    !window.weekdays?.length &&
    !window.timeOfDay &&
    !window.timeFrom &&
    !window.timeTo &&
    !window.timeSlot &&
    !window.employeeName
  ) {
    return null;
  }

  return window;
}

/** Shared weekday+timeOfDay AND pattern — not OR (avail-no-or-and-en). */
export function isAvailabilityAndWeekdaysPattern(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  if (/\s+or\s+/i.test(prompt)) return false;
  if (
    !/\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\s+and\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  return TIME_OF_DAY_PATTERN.test(prompt);
}

export function clauseHasAvailabilityCue(clause: string): boolean {
  return AVAILABILITY_CLAUSE_CUE.test(clause);
}

function stripLeadingAvailabilityIntentPrefix(clause: string): string {
  return clause
    .replace(
      /^(?:i\s+)?(?:want|need|would like|looking for)\s+(?:a|an|the|your)?\s+[\w\s-]{0,40}?\s+/i,
      '',
    )
    .replace(/^ցանկանում\s+եմ\s+[\p{L}\s-]{0,40}?\s+/iu, '')
    .replace(/^хочу\s+[\p{L}\s-]{0,40}?\s+/iu, '')
    .replace(/^book(?:\s+(?:a|an|the|your))?\s+[\w\s-]{0,40}?\s+/i, '')
    .replace(
      /^(?:who'?s?|who is)\s+free\s+(?:for\s+[\w\s-]{0,40}?\s+)?(?:on\s+)?/i,
      '',
    )
    .replace(
      /^(?:any|some)\s+slots?\s+(?:for\s+[\w\s-]{0,40}?\s+)?(?:on\s+)?/i,
      '',
    )
    .replace(
      /^[a-z][\w\s-]{0,40}?\s+(?=tomorrow|today|tonight|mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday|vagh|zavtra|վաղ|завтра|ուրբ|urbat|pyatnic|пятниц)/i,
      '',
    )
    .replace(/^в\s+/iu, '')
    .trim();
}

const FLEXIBLE_AVAILABILITY_BOOK_SERVICE_PATTERN =
  /\bbook(?:\s+(?:a|an|the|your))?\s+([a-z][\w\s-]{2,30}?)(?=\s*(?:under|below|for|with|tomorrow|today|nearest|soonest|whichever|,|$))/i;

const FLEXIBLE_AVAILABILITY_WANT_SERVICE_PATTERN =
  /\bI want(?:\s+(?:a|an|the))?\s+([a-z][\w\s-]{2,30}?)(?=\s*(?:tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|,|$))/i;

const FLEXIBLE_AVAILABILITY_LEADING_SERVICE_PATTERN =
  /^([a-z][\w\s-]{2,30}?)\s+(?:(?:under|below|at most|up to)\s+[\$€£]?\s*[\d,]+(?:\.\d{1,2})?\s+)?(?:tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/i;

export function normalizeAvailabilityServiceCategory(keyword: string): string {
  const first = keyword.trim().replace(/[,.]$/, '').split(/\s+/)[0] ?? keyword;
  const lower = first.toLowerCase();
  if (lower === 'lashes') return 'lash';
  if (lower === 'haircuts') return 'haircut';
  return lower;
}

/** Leading service + optional inline budget before OR window parse (avail-budget-under-or-en). */
export function enrichFlexibleAvailabilityServiceCategoryFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  if (params.serviceCategory) return params;
  if (typeof params.serviceName === 'string' && params.serviceName.trim()) {
    return params;
  }

  const fromList = enrichListServicesParamsFromPrompt(prompt, params);
  if (fromList.serviceCategory) {
    return {
      ...params,
      serviceCategory: fromList.serviceCategory,
      serviceName: null,
    };
  }

  for (const entry of MULTILINGUAL_SERVICE_CATEGORY_PATTERNS) {
    if (entry.pattern.test(prompt)) {
      return { ...params, serviceCategory: entry.category, serviceName: null };
    }
  }

  const rawName = extractServiceNameFromPrompt(prompt);
  if (rawName) {
    return {
      ...params,
      serviceCategory: normalizeAvailabilityServiceCategory(rawName),
      serviceName: null,
    };
  }

  const showListMatch = prompt.match(
    /\b(?:show|list)\s+([a-z][\w\s-]{2,30}?)\s+(?:under|below|at most|up to)\b/i,
  );
  const translitLeadMatch = prompt.match(
    /^([A-Za-z][\w]+)\s+(?:vagh\w*|zavtra|tomorrow)\b/i,
  );
  const bookMatch = prompt.match(FLEXIBLE_AVAILABILITY_BOOK_SERVICE_PATTERN);
  const wantMatch = prompt.match(FLEXIBLE_AVAILABILITY_WANT_SERVICE_PATTERN);
  const needMatch = prompt.match(
    /\bneed\s+(?:a\s+)?([a-z][\w\s-]{2,30}?)(?=\s*(?:tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b)/i,
  );
  const leadingMatch = prompt.match(
    FLEXIBLE_AVAILABILITY_LEADING_SERVICE_PATTERN,
  );
  const keyword = (
    showListMatch?.[1] ??
    translitLeadMatch?.[1] ??
    bookMatch?.[1] ??
    wantMatch?.[1] ??
    needMatch?.[1] ??
    leadingMatch?.[1]
  )
    ?.trim()
    .replace(/[,.]$/, '');
  if (keyword && keyword.length >= 3) {
    return {
      ...params,
      serviceCategory: normalizeAvailabilityServiceCategory(keyword),
      serviceName: null,
    };
  }

  return params;
}

/** Same specialist across OR windows — top-level employeeName or session carry (avail-or-same-provider-en). */
export function isSameProviderAcrossWindowsPrompt(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  return /\bsame\s+(?:person|provider|stylist|specialist|therapist)\b/i.test(
    prompt,
  );
}

export function enrichFlexibleAvailabilitySameProviderFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  if (!isSameProviderAcrossWindowsPrompt(prompt)) return params;

  const next: Record<string, unknown> = {
    ...enrichFlexibleAvailabilityServiceCategoryFromPrompt(prompt, params),
    sameProviderAcrossWindows: true,
  };
  delete next.allProviders;
  return next;
}

/** Team-wide OR availability — any stylist/provider across windows (avail-or-any-provider-en). */
export function isFlexibleAvailabilityAnyProviderPrompt(
  prompt: string,
): boolean {
  if (!prompt?.trim()) return false;
  const lower = prompt.toLowerCase();
  return (
    /\bany\s+(?:provider|staff|employee|therapist|stylist|specialist|specialists)\b/i.test(
      lower,
    ) ||
    /\bwhichever\s+(?:provider|specialist)\b/i.test(lower) ||
    /\bwhoever\s+(?:is\s+)?(?:available|free)\b/i.test(lower) ||
    /\b(?:any|anyone|anybody)\s+(?:provider|stylist|specialist|staff|therapist)s?\b/i.test(
      prompt,
    )
  );
}

/** Team-wide availability phrasing — who's free / any slots (avail-single-*-en). */
export function isFlexibleAvailabilityTeamWidePrompt(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  const { isTeamWideProviderAvailabilityQuery } =
    require('./team-wide-availability.semantic.util.js') as typeof import('./team-wide-availability.semantic.util.js');
  return (
    /\bany\s+slots?\b/i.test(prompt) ||
    isTeamWideProviderAvailabilityQuery(prompt)
  );
}

/** Single-window date/weekday/timeOfDay rescue when classifier omits fields (avail-single-*-en). */
export function enrichFlexibleAvailabilitySingleWindowFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  if (!prompt?.trim()) return params;
  if (/\bgift\s+card\b/i.test(prompt)) return params;
  if (hasAvailabilityOrPattern(prompt)) return params;
  if (isAvailabilityAndWeekdaysPattern(prompt)) return params;

  let next = enrichFlexibleAvailabilityServiceCategoryFromPrompt(
    prompt,
    params,
  );

  const timeOfDay =
    parseTimeOfDayWindow(prompt, next) ??
    parseMultilingualTimeOfDayWindow(prompt, next);
  if (timeOfDay && !next.timeOfDay) {
    next = { ...next, timeOfDay };
  }

  if (!next.weekdays) {
    const weekday = extractWeekdayNameFromClause(prompt);
    if (weekday) {
      next = { ...next, weekdays: [weekday] };
    }
  }

  if (!next.date) {
    const relativeDate = extractRelativeDateFromClause(prompt);
    if (relativeDate) {
      next = { ...next, date: relativeDate };
    }
  }

  if (
    next.allProviders !== true &&
    isFlexibleAvailabilityTeamWidePrompt(prompt)
  ) {
    next = { ...next, allProviders: true };
  }

  return next;
}

function stripLeadingProviderOrAnyoneBudgetLead(prompt: string): string {
  const match = prompt.match(
    /^([A-Z][a-z]+)\s+or\s+any(?:one|body)\s*[—–-]\s*(?:[a-z][\w\s-]*?\s+)?(?:(?:under|below)\s+[\$€£]?\s*[\d,]+(?:\.\d{1,2})?\s+)?/i,
  );
  if (!match?.[1]) return prompt;
  const remainder = prompt.slice(match[0].length).trim();
  return `${match[1]} ${remainder}`;
}

export function isProviderOrAnyoneBudgetLeadPrompt(prompt: string): boolean {
  return /^[A-Z][a-z]+\s+or\s+any(?:one|body)\s*[—–-]/i.test(prompt.trim());
}

function availabilityOrSourcePrompt(prompt: string): string {
  let normalized = stripLeadingProviderOrAnyoneBudgetLead(
    stripTrailingBudgetPhrase(prompt),
  );
  normalized = normalized
    .replace(/^check\s+(?:availability\s+)?/i, '')
    .replace(/,?\s+for\s+(?:those|these|them)\s*$/i, '')
    .replace(/\s*[—-]\s*nothing\s+open\b.*$/i, '')
    .trim();
  const thenAvailability = normalized.match(
    /\bthen\s+(?:(?:check|who(?:'s| is)?)\s+(?:free\s+)?)(.+)$/i,
  );
  if (thenAvailability?.[1]) {
    return thenAvailability[1].trim();
  }
  return normalized;
}

function stripTrailingBudgetPhrase(prompt: string): string {
  return prompt
    .replace(
      /,?\s*(?:у\s+меня|u\s+menya)\s+[\d,]+(?:\.\d{1,2})?\s*(?:долларов|dollarov|rub(?:ley|lya|les)?).*$/iu,
      '',
    )
    .replace(/,?\s*[\d,]+(?:\.\d{1,2})?\s*դրամ\s+ունեմ.*$/iu, '')
    .replace(/,?\s*ունեմ\s+[\d,]+(?:\.\d{1,2})?\s*դրամ.*$/iu, '')
    .replace(
      /,?\s*(?:i\s+)?(?:only\s+)?have\s+[\$€£]?\s*[\d,]+(?:\.\d{1,2})?.*$/i,
      '',
    )
    .replace(
      /,?\s*book\s+(?:the\s+)?(?:soonest|nearest|earliest|first\s+available)\b.*$/i,
      '',
    )
    .replace(
      /\b(?:under|below|at most|up to)\s+[\$€£]?\s*[\d,]+(?:\.\d{1,2})?\s+(?=(?:tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b)/i,
      '',
    )
    .replace(
      /,?\s*(?:under|below|at most|up to)\s+[\$€£]?\s*[\d,]+(?:\.\d{1,2})?(?=\s*(?:,\s*|\s+or\s+|$))/gi,
      '',
    )
    .replace(/,?\s*(?:under|below)\s+[\$€£]?\s*[\d,]+(?:\.\d{1,2})?\s*$/i, '')
    .trim();
}

function extractLeadingEmployeeNameFromClause(clause: string): {
  employeeName: string | null;
  clauseWithoutName: string;
} {
  const match = clause.match(/^([A-Z][a-z]{2,20})\s+(.+)$/);
  if (!match?.[1] || !match[2]) {
    return { employeeName: null, clauseWithoutName: clause };
  }

  const candidate = match[1];
  const remainder = match[2].trim();
  if (
    AVAILABILITY_SERVICE_CATEGORY_LEAD_TOKENS.has(candidate.toLowerCase()) ||
    !CLAUSE_TEMPORAL_LEAD_PATTERN.test(remainder)
  ) {
    return { employeeName: null, clauseWithoutName: clause };
  }

  return { employeeName: candidate, clauseWithoutName: remainder };
}

function preserveLeadingEmployeeNameThroughStrip(clause: string): string {
  const trimmed = clause.trim();
  const { employeeName, clauseWithoutName } =
    extractLeadingEmployeeNameFromClause(trimmed);
  const stripped = stripLeadingAvailabilityIntentPrefix(
    employeeName ? clauseWithoutName : trimmed,
  );
  return employeeName ? `${employeeName} ${stripped}`.trim() : stripped;
}

function normalizeAvailabilityOrClause(clause: string): string {
  return preserveLeadingEmployeeNameThroughStrip(clause)
    .replace(/^same\s+(?:person|provider|stylist|specialist|therapist)\s+/i, '')
    .replace(
      /^(?:any|anyone|anybody)\s+(?:provider|stylist|specialist|staff|therapist)s?\s+/i,
      '',
    )
    .replace(/\s+for\s+(?:a|an|the)\s+[\w\s-]{2,30}\s*$/i, '')
    .replace(/,?\s*(?:whichever|which ever)\s+is\s+sooner.*$/i, '')
    .replace(/\s+if\s+not\b.*$/i, '')
    .trim();
}

export function splitAvailabilityOrClauses(prompt: string): string[] {
  const normalizedPrompt = stripTrailingBudgetPhrase(prompt);
  const withoutEither = normalizedPrompt.replace(/^\s*either\s+/i, '');
  return withoutEither
    .split(AVAILABILITY_OR_SPLIT_PATTERN)
    .map((clause) => normalizeAvailabilityOrClause(clause))
    .filter(Boolean);
}

function promptHasAvailabilityOrSeparator(prompt: string): boolean {
  return (
    /\s+or\s+/i.test(prompt) ||
    /\s+կամ\s+/iu.test(prompt) ||
    /\s+или\s+/iu.test(prompt) ||
    /\s+kam\s+/i.test(prompt) ||
    (/,/.test(prompt) && /\s+or\s+/i.test(prompt))
  );
}

export function hasAvailabilityOrPattern(prompt: string): boolean {
  if (!prompt?.trim() || isAvailabilityAndWeekdaysPattern(prompt)) {
    return false;
  }
  if (/\bgift\s+card\b/i.test(prompt)) return false;

  const normalizedPrompt = availabilityOrSourcePrompt(prompt);
  const hasOrToken = promptHasAvailabilityOrSeparator(normalizedPrompt);
  const hasEitherOr =
    /\beither\b/i.test(normalizedPrompt) && /\bor\b/i.test(normalizedPrompt);

  if (!hasOrToken && !hasEitherOr) return false;

  const clauses = splitAvailabilityOrClauses(normalizedPrompt);
  return (
    clauses.length >= 2 &&
    clauses.every((clause) => clauseHasAvailabilityCue(clause))
  );
}

function extractWeekdayNameFromClause(clause: string): string | null {
  const match = clause.match(WEEKDAY_PATTERN);
  if (match?.[1]) {
    return normalizeWeekdayToken(match[1]);
  }

  for (const entry of MULTILINGUAL_WEEKDAY_CLAUSE_PATTERNS) {
    if (entry.pattern.test(clause)) {
      return entry.weekday;
    }
  }

  return null;
}

function extractRelativeDateFromClause(clause: string): string | null {
  if (
    /\basap\b/i.test(clause) ||
    /\bas\s+soon\s+as\s+possible\b/i.test(clause)
  ) {
    return 'tomorrow';
  }
  if (
    /\btomorrow\b/i.test(clause) ||
    promptMentionsMultilingualTomorrow(clause)
  ) {
    return 'tomorrow';
  }
  if (/\btoday\b/i.test(clause) || /\btonight\b/i.test(clause)) {
    return 'today';
  }
  return null;
}

function extractWeekendWeekdaysFromClause(clause: string): string[] | null {
  if (!/\bweekend\b/i.test(clause)) return null;
  return ['saturday', 'sunday'];
}

function extractTimeOfDayFromClause(
  clause: string,
): AvailabilityTimeOfDay | null {
  const parsed = parseTimeOfDayWindow(clause, {});
  if (parsed) return parsed;

  const multilingual = parseMultilingualTimeOfDayWindow(clause, {});
  if (multilingual) return multilingual;

  if (/\b(?:eve)\b/i.test(clause)) return 'evening';
  if (/(?<!\d)\bpm\b/i.test(clause)) return 'afternoon';
  if (/(?<!\d)\bam\b/i.test(clause)) return 'morning';
  return null;
}

/** Colloquial earliest time — "after 5" → 17:00, "after 16:00" → 16:00 (avail-after-work-en). */
export function parseAvailabilityEarliestTimeFromText(
  text: string,
): string | null {
  if (/\bafter\s+work\b/i.test(text)) return '17:00';

  const after = text.match(
    /\bafter\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b/i,
  );
  if (!after) return null;

  const hour = parseInt(after[1], 10);
  const minute = after[2] != null ? parseInt(after[2], 10) : 0;
  const meridiem = after[3]?.toLowerCase().replace(/\./g, '');
  if (meridiem === 'pm') {
    const h = hour === 12 ? 12 : hour + 12;
    return normalizeTime24(`${h}:${String(minute).padStart(2, '0')}`);
  }
  if (meridiem === 'am') {
    const h = hour === 12 ? 0 : hour;
    return normalizeTime24(`${h}:${String(minute).padStart(2, '0')}`);
  }
  if (after[2] != null || hour >= 10) {
    return normalizeTime24(`${hour}:${String(minute).padStart(2, '0')}`);
  }
  if (hour >= 1 && hour <= 9) {
    return normalizeTime24(`${hour + 12}:${String(minute).padStart(2, '0')}`);
  }
  return normalizeTime24(`${hour}:${String(minute).padStart(2, '0')}`);
}

function extractLunchWindowBounds(clause: string): {
  timeOfDay: AvailabilityTimeOfDay;
  timeFrom: string;
  timeTo: string;
} | null {
  if (!/\blunch\b/i.test(clause)) return null;
  return {
    timeOfDay: 'afternoon',
    timeFrom: AVAILABILITY_LUNCH_TIME_FROM,
    timeTo: AVAILABILITY_LUNCH_TIME_TO,
  };
}

function applySharedAvailabilityTimeFrom(
  prompt: string,
  windows: AvailabilityWindow[],
): AvailabilityWindow[] {
  const sharedTimeFrom = parseAvailabilityEarliestTimeFromText(prompt);
  if (!sharedTimeFrom) return windows;
  return windows.map((window) =>
    window.timeFrom ? window : { ...window, timeFrom: sharedTimeFrom },
  );
}

/** Voice ASAP + "Saturday if not" — fallback weekday defaults to afternoon scan (avail-voice-asap-or-en). */
function applyAsapFallbackWindowDefaults(
  prompt: string,
  windows: AvailabilityWindow[],
): AvailabilityWindow[] {
  if (!/\basap\b/i.test(prompt) || !/\bif\s+not\b/i.test(prompt)) {
    return windows;
  }
  return windows.map((window) => {
    if (
      window.weekdays?.length === 1 &&
      window.weekdays[0] === 'saturday' &&
      !window.timeOfDay &&
      !window.timeFrom &&
      !window.timeSlot
    ) {
      return { ...window, timeOfDay: 'afternoon' };
    }
    return window;
  });
}

export function parseAvailabilityWindowClause(
  clause: string,
): AvailabilityWindow | null {
  const trimmed = clause.trim();
  if (!trimmed) return null;

  const { employeeName, clauseWithoutName } =
    extractLeadingEmployeeNameFromClause(trimmed);
  const workingClause = clauseWithoutName;

  const window: AvailabilityWindow = {};
  if (employeeName) window.employeeName = employeeName;

  const relativeDate = extractRelativeDateFromClause(workingClause);
  const weekendWeekdays = extractWeekendWeekdaysFromClause(workingClause);
  const weekday = weekendWeekdays
    ? null
    : extractWeekdayNameFromClause(workingClause);

  if (relativeDate) window.date = relativeDate;
  if (weekendWeekdays) window.weekdays = weekendWeekdays;
  else if (weekday) window.weekdays = [weekday];

  const timeSlot = extractTimeSlotFromPrompt(workingClause);
  if (timeSlot) {
    window.timeSlot = timeSlot;
  } else {
    const lunch = extractLunchWindowBounds(workingClause);
    if (lunch) {
      window.timeOfDay = lunch.timeOfDay;
      window.timeFrom = lunch.timeFrom;
      window.timeTo = lunch.timeTo;
    } else {
      const timeFrom = parseAvailabilityEarliestTimeFromText(workingClause);
      if (timeFrom) window.timeFrom = timeFrom;

      const timeOfDay = extractTimeOfDayFromClause(workingClause);
      if (timeOfDay) window.timeOfDay = timeOfDay;
    }
  }

  if (
    !window.date &&
    !window.weekdays?.length &&
    !window.timeOfDay &&
    !window.timeSlot &&
    !window.timeFrom &&
    !window.timeTo &&
    !window.employeeName
  ) {
    return null;
  }

  return window;
}

/** Parse OR availability windows from natural language (avail-1.1). */
export function parseAvailabilityWindowsFromPrompt(
  prompt: string,
): AvailabilityWindow[] | null {
  if (!hasAvailabilityOrPattern(prompt)) return null;

  const sourcePrompt = availabilityOrSourcePrompt(prompt);
  const windows = applyAsapFallbackWindowDefaults(
    sourcePrompt,
    applySharedAvailabilityTimeFrom(
      sourcePrompt,
      splitAvailabilityOrClauses(sourcePrompt)
        .map((clause) => parseAvailabilityWindowClause(clause))
        .filter((window): window is AvailabilityWindow => window != null),
    ),
  );

  return windows.length >= 2 ? windows : null;
}

function buildLegacyAvailabilityWindow(
  params: Record<string, unknown>,
): AvailabilityWindow | null {
  const window: AvailabilityWindow = {};

  if (params.date != null && String(params.date).trim()) {
    window.date = String(params.date).trim();
  }

  if (Array.isArray(params.weekdays)) {
    const weekdays = params.weekdays
      .map((entry) =>
        typeof entry === 'string' ? normalizeWeekdayToken(entry) : null,
      )
      .filter((entry): entry is string => !!entry);
    if (weekdays.length > 0) {
      window.weekdays = [...new Set(weekdays)];
    }
  } else if (typeof params.weekdays === 'string') {
    const weekday = normalizeWeekdayToken(params.weekdays);
    if (weekday) window.weekdays = [weekday];
  }

  const timeOfDay = normalizeAvailabilityTimeOfDay(params.timeOfDay);
  if (timeOfDay) window.timeOfDay = timeOfDay;

  if (params.timeFrom != null && String(params.timeFrom).trim()) {
    window.timeFrom = String(params.timeFrom).trim();
  }
  if (params.timeTo != null && String(params.timeTo).trim()) {
    window.timeTo = String(params.timeTo).trim();
  }
  if (params.timeSlot != null && String(params.timeSlot).trim()) {
    window.timeSlot = String(params.timeSlot).trim();
  }

  if (
    !window.date &&
    !window.weekdays?.length &&
    !window.timeOfDay &&
    !window.timeFrom &&
    !window.timeTo &&
    !window.timeSlot
  ) {
    return null;
  }

  return window;
}

/** Normalize classifier params to availabilityWindows[] (avail-1.1). */
export function normalizeAvailabilityWindows(
  params: Record<string, unknown>,
): AvailabilityWindow[] {
  const rawWindows = params.availabilityWindows;
  if (Array.isArray(rawWindows) && rawWindows.length > 0) {
    return rawWindows
      .map((entry) => normalizeAvailabilityWindowEntry(entry))
      .filter((window): window is AvailabilityWindow => window != null);
  }

  const legacy = buildLegacyAvailabilityWindow(params);
  return legacy ? [legacy] : [];
}

const AVAILABILITY_SESSION_APPEND_LEAD_PATTERN = /^\s*(?:,\s*)?or\b/i;
const AVAILABILITY_SESSION_APPEND_TAIL_PATTERN =
  /\b(?:works\s+too|that\s+works|also\s+works|as\s+well)\s*[.!?]?\s*$/i;

function normalizeAvailabilitySessionAppendClause(prompt: string): string {
  return prompt
    .replace(AVAILABILITY_SESSION_APPEND_LEAD_PATTERN, '')
    .replace(AVAILABILITY_SESSION_APPEND_TAIL_PATTERN, '')
    .replace(/\btoo\s*[.!?]?\s*$/i, '')
    .trim();
}

function availabilityWindowMatches(
  left: AvailabilityWindow,
  right: AvailabilityWindow,
): boolean {
  return (
    left.date === right.date &&
    JSON.stringify(left.weekdays ?? []) ===
      JSON.stringify(right.weekdays ?? []) &&
    left.timeOfDay === right.timeOfDay &&
    left.timeFrom === right.timeFrom &&
    left.timeTo === right.timeTo &&
    left.timeSlot === right.timeSlot &&
    left.employeeName === right.employeeName
  );
}

/** Multi-turn follow-up — "or Friday afternoon works too" appends a window (avail-session-add-window-en). */
export function isAvailabilitySessionAppendPrompt(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  if (!AVAILABILITY_SESSION_APPEND_LEAD_PATTERN.test(prompt)) return false;
  if (hasAvailabilityOrPattern(prompt)) return false;
  const clause = normalizeAvailabilitySessionAppendClause(prompt);
  return (
    clauseHasAvailabilityCue(clause) &&
    parseAvailabilityWindowClause(clause) != null
  );
}

const AVAILABILITY_SESSION_DROP_ONLY_PATTERN = /\b(?:only|just)\b/i;

function normalizeAvailabilitySessionDropClause(prompt: string): string {
  return prompt
    .replace(/\b(?:just|only)\s*$/i, '')
    .replace(/^\s*(?:just|only)\s+/i, '')
    .trim();
}

function inheritSessionWindowTimeFilter(
  target: AvailabilityWindow,
  existing: readonly AvailabilityWindow[],
): AvailabilityWindow {
  if (target.timeOfDay || target.timeFrom || target.timeTo || target.timeSlot) {
    return target;
  }

  for (const window of existing) {
    const weekday = target.weekdays?.[0];
    if (weekday && window.weekdays?.includes(weekday)) {
      return {
        ...target,
        timeOfDay: window.timeOfDay ?? null,
        timeFrom: window.timeFrom ?? null,
        timeTo: window.timeTo ?? null,
        timeSlot: window.timeSlot ?? null,
      };
    }
    if (target.date && window.date === target.date) {
      return {
        ...target,
        timeOfDay: window.timeOfDay ?? null,
        timeFrom: window.timeFrom ?? null,
        timeTo: window.timeTo ?? null,
        timeSlot: window.timeSlot ?? null,
      };
    }
  }

  return target;
}

function resolveSessionDropWindow(
  params: Record<string, unknown>,
  prompt: string,
): AvailabilityWindow | null {
  const clause = normalizeAvailabilitySessionDropClause(prompt);
  const parsed = parseAvailabilityWindowClause(clause);
  if (!parsed) return null;
  return inheritSessionWindowTimeFilter(
    parsed,
    normalizeAvailabilityWindows(params),
  );
}

/** Multi-turn follow-up — "Friday only" narrows session to one window (avail-session-drop-window-en). */
export function isAvailabilitySessionDropPrompt(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  if (hasAvailabilityOrPattern(prompt)) return false;
  if (!AVAILABILITY_SESSION_DROP_ONLY_PATTERN.test(prompt)) return false;
  const clause = normalizeAvailabilitySessionDropClause(prompt);
  return (
    clauseHasAvailabilityCue(clause) &&
    parseAvailabilityWindowClause(clause) != null
  );
}

/** Replace session availabilityWindows[] with a single narrowed window (avail-session-drop-window-en). */
export function enrichAvailabilitySessionDropFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const base = enrichFlexibleAvailabilityServiceCategoryFromPrompt(
    prompt,
    params,
  );
  const dropped = resolveSessionDropWindow(base, prompt);
  if (!dropped) return base;

  const next: Record<string, unknown> = {
    ...base,
    availabilityWindows: [dropped],
  };
  delete next.date;
  delete next.timeOfDay;
  delete next.weekdays;
  delete next.dateFrom;
  delete next.dateTo;
  delete next.applyDays;
  return next;
}

/** Append a parsed OR window onto session availabilityWindows[] (avail-session-add-window-en). */
export function enrichAvailabilitySessionAppendFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const base = enrichFlexibleAvailabilityServiceCategoryFromPrompt(
    prompt,
    params,
  );
  const clause = normalizeAvailabilitySessionAppendClause(prompt);
  const newWindow = parseAvailabilityWindowClause(clause);
  if (!newWindow) return base;

  const existing = normalizeAvailabilityWindows(base);
  const merged = [...existing];
  if (!merged.some((window) => availabilityWindowMatches(window, newWindow))) {
    merged.push(newWindow);
  }

  const next: Record<string, unknown> = {
    ...base,
    availabilityWindows: merged,
  };
  delete next.date;
  delete next.timeOfDay;
  delete next.weekdays;
  delete next.dateFrom;
  delete next.dateTo;
  delete next.applyDays;
  return next;
}

function windowsEquivalent(
  left: AvailabilityWindow[],
  right: AvailabilityWindow[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((window, index) => {
    const other = right[index];
    if (!other) return false;
    return (
      window.date === other.date &&
      JSON.stringify(window.weekdays ?? []) ===
        JSON.stringify(other.weekdays ?? []) &&
      window.timeOfDay === other.timeOfDay &&
      window.timeFrom === other.timeFrom &&
      window.timeTo === other.timeTo &&
      window.timeSlot === other.timeSlot &&
      window.employeeName === other.employeeName
    );
  });
}

/** Post-LLM enrichment — split OR phrases into availabilityWindows[] (avail-1.3). */
export function enrichAvailabilityWindowsFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  if (!prompt?.trim()) return params;
  if (isAvailabilityAndWeekdaysPattern(prompt)) return params;
  if (/\bgift\s+card\b/i.test(prompt)) return params;

  const parsed = parseAvailabilityWindowsFromPrompt(prompt);
  if (!parsed || parsed.length < 2) return params;

  const existing = normalizeAvailabilityWindows(params);
  if (windowsEquivalent(existing, parsed)) return params;

  const next: Record<string, unknown> = {
    ...params,
    availabilityWindows: parsed,
  };

  delete next.date;
  delete next.timeOfDay;
  delete next.weekdays;
  delete next.dateFrom;
  delete next.dateTo;
  delete next.applyDays;

  if (parsed.some((window) => window.employeeName)) {
    delete next.employeeName;
    delete next.employeeNames;
    delete next.allProviders;
  }

  return next;
}

/** Per-window slot scan inputs (avail-1.6 / discover-1.2). */
export type AvailabilityWindowScanQuery = {
  dateKeys: string[];
  timeOfDay: AvailabilityTimeOfDay | null;
  notBeforeTime?: string | null;
};

export type AvailabilityWindowSlotCandidate<T extends { startTime: string }> = {
  slot: T;
  windowIndex: number;
  timeOfDay: AvailabilityTimeOfDay | null;
  dateKeys: string[];
};

/** Pick earliest bookable slot across OR windows (avail-1.6 / discover-1.2). */
export function pickEarliestSlotAcrossWindows<T extends { startTime: string }>(
  candidates: readonly AvailabilityWindowSlotCandidate<T>[],
): AvailabilityWindowSlotCandidate<T> | null {
  if (candidates.length === 0) return null;
  return candidates.reduce((best, current) =>
    current.slot.startTime < best.slot.startTime ? current : best,
  );
}

/** Scan each availability window; return earliest slot across all windows (discover-1.2). */
export async function scanWindowsForSlots<T extends { startTime: string }>(
  windows: readonly AvailabilityWindowScanQuery[],
  scanWindow: (
    window: AvailabilityWindowScanQuery,
    windowIndex: number,
  ) => Promise<T | null>,
): Promise<AvailabilityWindowSlotCandidate<T> | null> {
  const candidates: AvailabilityWindowSlotCandidate<T>[] = [];

  for (let windowIndex = 0; windowIndex < windows.length; windowIndex++) {
    const window = windows[windowIndex];
    const slot = await scanWindow(window, windowIndex);
    if (!slot) continue;
    candidates.push({
      slot,
      windowIndex,
      timeOfDay: window.timeOfDay,
      dateKeys: window.dateKeys,
    });
  }

  return pickEarliestSlotAcrossWindows(candidates);
}
