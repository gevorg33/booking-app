/** Shared OR availability window parse/normalize/scan helpers (avail-1.1 / discover-1.2). */
import { promptMentionsMultilingualTomorrow } from './ai-check-and-book-multilingual.util.js';
import { parseTimeOfDayWindow, type TimeOfDayWindow } from './ai-operations.util.js';

export type AvailabilityTimeOfDay = TimeOfDayWindow;

export type AvailabilityWindow = {
  date?: string | null;
  weekdays?: string[] | null;
  timeOfDay?: AvailabilityTimeOfDay | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  timeSlot?: string | null;
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

const RELATIVE_DATE_PATTERN =
  /\b(tomorrow|today|tonight)\b/i;

const AVAILABILITY_CLAUSE_CUE =
  /(?:\b(tomorrow|today|tonight)\b|(?:առավոտ|утр[оа]?м|утром|ցերեկ|дн[её]м|երեկոյան|երեկո|вечером|вечер)|\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b|\b(?:morning|afternoon|evening|tonight|eve|am|pm|lunch)\b)/iu;

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

/** Shared weekday+timeOfDay AND pattern — not OR (avail-no-or-and-en). */
export function isAvailabilityAndWeekdaysPattern(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  if (/\s+or\s+/i.test(prompt)) return false;
  if (!/\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\s+and\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/i.test(
    prompt,
  )) {
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
    .replace(/^book(?:\s+(?:a|an|the|your))?\s+[\w\s-]{0,40}?\s+/i, '')
    .replace(
      /^(?:who'?s?|who is)\s+free\s+(?:for\s+[\w\s-]{0,40}?\s+)?(?:on\s+)?/i,
      '',
    )
    .replace(/^(?:any|some)\s+slots?\s+(?:for\s+[\w\s-]{0,40}?\s+)?(?:on\s+)?/i, '')
    .replace(/^[a-z][\w\s-]{0,40}?\s+(?=tomorrow|today|tonight|mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, '')
    .trim();
}

function stripTrailingBudgetPhrase(prompt: string): string {
  return prompt
    .replace(
      /,?\s*(?:i\s+)?(?:only\s+)?have\s+[\$€£]?\s*[\d,]+(?:\.\d{1,2})?.*$/i,
      '',
    )
    .replace(/,?\s*(?:under|below)\s+[\$€£]?\s*[\d,]+(?:\.\d{1,2})?.*$/i, '')
    .trim();
}

export function splitAvailabilityOrClauses(prompt: string): string[] {
  const normalizedPrompt = stripTrailingBudgetPhrase(prompt);
  const withoutEither = normalizedPrompt.replace(/^\s*either\s+/i, '');
  return withoutEither
    .split(/\s*,\s*|\s+or\s+/i)
    .map((clause) => stripLeadingAvailabilityIntentPrefix(clause))
    .map((clause) => clause.replace(/,?\s*(?:whichever|which ever)\s+is\s+sooner.*$/i, '').trim())
    .filter(Boolean);
}

export function hasAvailabilityOrPattern(prompt: string): boolean {
  if (!prompt?.trim() || isAvailabilityAndWeekdaysPattern(prompt)) {
    return false;
  }
  if (/\bgift\s+card\b/i.test(prompt)) return false;

  const normalizedPrompt = stripTrailingBudgetPhrase(prompt);
  const hasOrToken =
    /\s+or\s+/i.test(normalizedPrompt) ||
    (/,\s*/.test(normalizedPrompt) && /\s+or\s+/i.test(normalizedPrompt));
  const hasEitherOr =
    /\beither\b/i.test(normalizedPrompt) &&
    /\bor\b/i.test(normalizedPrompt);

  if (!hasOrToken && !hasEitherOr) return false;

  const clauses = splitAvailabilityOrClauses(normalizedPrompt);
  return (
    clauses.length >= 2 &&
    clauses.every((clause) => clauseHasAvailabilityCue(clause))
  );
}

function extractWeekdayNameFromClause(clause: string): string | null {
  const match = clause.match(WEEKDAY_PATTERN);
  if (!match?.[1]) return null;
  return normalizeWeekdayToken(match[1]);
}

function extractRelativeDateFromClause(clause: string): string | null {
  if (/\btomorrow\b/i.test(clause) || promptMentionsMultilingualTomorrow(clause)) {
    return 'tomorrow';
  }
  if (/\btoday\b/i.test(clause) || /\btonight\b/i.test(clause)) {
    return 'today';
  }
  return null;
}

function extractTimeOfDayFromClause(clause: string): AvailabilityTimeOfDay | null {
  const parsed = parseTimeOfDayWindow(clause, {});
  if (parsed) return parsed;

  if (/\b(?:eve|pm)\b/i.test(clause)) return 'evening';
  if (/\b(?:am|lunch)\b/i.test(clause)) return 'afternoon';
  return null;
}

export function parseAvailabilityWindowClause(
  clause: string,
): AvailabilityWindow | null {
  const trimmed = clause.trim();
  if (!trimmed) return null;

  const window: AvailabilityWindow = {};
  const relativeDate = extractRelativeDateFromClause(trimmed);
  const weekday = extractWeekdayNameFromClause(trimmed);

  if (relativeDate) window.date = relativeDate;
  if (weekday) window.weekdays = [weekday];

  const timeOfDay = extractTimeOfDayFromClause(trimmed);
  if (timeOfDay) window.timeOfDay = timeOfDay;

  if (!window.date && !window.weekdays?.length && !window.timeOfDay) {
    return null;
  }

  return window;
}

/** Parse OR availability windows from natural language (avail-1.1). */
export function parseAvailabilityWindowsFromPrompt(
  prompt: string,
): AvailabilityWindow[] | null {
  if (!hasAvailabilityOrPattern(prompt)) return null;

  const windows = splitAvailabilityOrClauses(prompt)
    .map((clause) => parseAvailabilityWindowClause(clause))
    .filter((window): window is AvailabilityWindow => window != null);

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
      window.timeSlot === other.timeSlot
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
export function pickEarliestSlotAcrossWindows<
  T extends { startTime: string },
>(
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
    const window = windows[windowIndex]!;
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
