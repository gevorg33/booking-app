import { normalizeTourWeekAnchorDateKey } from '../../common/utils/tour-calendar.util.js';
import { extractSingleProviderNameFromPrompt } from './ai-dashboard-ops.util.js';
import { isExplainTourBookingRecordPrompt } from './ai-tour-booking-record.util.js';
import { isExplainTourCalendarSpanPrompt } from './ai-tour-calendar-span.util.js';
import { isMyStatsPrompt } from './ai-provider-exp-2.util.js';

/** e2e-bug.270 — drop classifier garbage like "this week" from weekStartDate. */
function normalizeTourWeekStartParam(
  raw: string | undefined,
): string | undefined {
  return normalizeTourWeekAnchorDateKey(raw);
}

export const TOUR_CALENDAR_WEEK_INTENTS = ['list_tour_calendar_week'] as const;

export type TourCalendarWeekIntent =
  (typeof TOUR_CALENDAR_WEEK_INTENTS)[number];

export interface ParsedListTourCalendarWeek {
  employeeName?: string;
  employeeId?: string;
  serviceName?: string;
  serviceId?: string;
  weekStartDate?: string;
}

function hasDashboardListCue(prompt: string): boolean {
  return (
    /\b(list|show|summarize|display|which|what|tell|give|overview)\b/i.test(
      prompt,
    ) ||
    /\?\s*$/.test(prompt.trim()) ||
    /(ցույց|ցուցադր(?!ր)|ինչու|ինչ[^ու]|(?:^|\s)որ\s+|բացատր|տուր)/i.test(
      prompt,
    ) ||
    /(покажи|список|какие|какой|тур)/i.test(prompt)
  );
}

/**
 * Rolling-window / capacity upcoming-departures cues.
 * e2e-bug.288 — bare "next week" / "last week" tour lists are calendar-week
 * reads, not capacity aggregation (do not block list_tour_calendar_week).
 */
function isUpcomingDaysCapacityPrompt(prompt: string): boolean {
  return (
    /\b(upcoming|next)\b.{0,40}\b\d{1,3}\s+days?\b/i.test(prompt) ||
    /\bupcoming\s+(?:tour\s+)?departures?\b/i.test(prompt) ||
    /\b(?:remaining\s+)?capacity\b/i.test(prompt) ||
    /\b(?:seats?|spots?|places?)\s+(?:left|remaining)\b/i.test(prompt) ||
    /\bremaining\s+(?:spots?|seats?|capacity)\b/i.test(prompt) ||
    /\bgrouped\s+by\s+departure\b/i.test(prompt) ||
    /\bdeparture\s+schedule\b/i.test(prompt) ||
    /(մնացած\s+տեղ|առաջիկա\s+մեկնում)/i.test(prompt) ||
    /(предстоящ|осталось\s+мест)/i.test(prompt)
  );
}

function isAllAppointmentsPrompt(prompt: string): boolean {
  return (
    /\b(all|every)\s+appointments?\b/i.test(prompt) ||
    /\bshow\s+appointments?\b/i.test(prompt) ||
    /\bupcoming\s+appointments?\b/i.test(prompt)
  );
}

function hasImplicitCalendarWeekListCue(prompt: string): boolean {
  return (
    /\bweek\s+of\s+\d{4}-\d{2}-\d{2}\b/i.test(prompt) ||
    /\bнедел[а-яё]*\s+\d{4}-\d{2}-\d{2}\b/i.test(prompt) ||
    /\b\d{4}-\d{2}-\d{2}\s+շաբաթ\b/i.test(prompt) ||
    /\bwith\s+(?:dates?\s+and\s+)?pax\b/i.test(prompt) ||
    /\bpax\b/i.test(prompt) ||
    /\bdeparting\s+(?:this|next|last)\s+week\b/i.test(prompt) ||
    /\bprovider\s+calendar\b/i.test(prompt) ||
    // Voice / casual: "tour bookings I have this/next/last week please"
    (/\btour\s+(?:bookings?|departures?)\b/i.test(prompt) &&
      /\b(this|current|next|last)\s+week\b/i.test(prompt)) ||
    // e2e-bug.288 — "Any tours next week?" / "Any tours last week?"
    (/\b(?:any\s+)?tours?\b/i.test(prompt) &&
      /\b(this|current|next|last)\s+week\b/i.test(prompt)) ||
    // e2e-bug.309 — RU "Какие туры на следующей неделе (в календаре)?"
    (/(?:тур|экскурс|выезд)/i.test(prompt) &&
      /(?:следующ|прошл|этой|текущ)[а-яё]*\s+недел/i.test(prompt)) ||
    // HY this/next/last week + tours (calendar optional when week word present)
    // e2e-bug.310 — նախորդ/անցյալ/վերջին synonyms (not only անցած).
    (/(?:էքսկուրսիա|տուր|մեկնումներ)/i.test(prompt) &&
      /(?:այս|հաջորդ|անցած|անցյալ|նախորդ|վերջին)\s+շաբաթ/i.test(prompt)) ||
    /календар[а-яё]*\s+провайдер/i.test(prompt) ||
    /в\s+календар[а-яё]*/i.test(prompt) ||
    /պրովայդերի\s+օրացույց/i.test(prompt)
  );
}

function hasCalendarWeekListTopic(prompt: string): boolean {
  // e2e-bug.288 — next/last week tour lists are calendar-week reads.
  // e2e-bug.309 — RU следующей/прошлой неделе + календарь (not only "этой").
  // e2e-bug.310 — HY նախորդ/անցյալ/վերջին + շաբաթվա genitive.
  const hasWeek =
    /\b(?:this\s+)?calendar\s+week\b/i.test(prompt) ||
    /\b(this|current|next|last)\s+week(?:'s)?\b/i.test(prompt) ||
    /\bprovider\s+calendar\s+week\b/i.test(prompt) ||
    /\bweek\s+of\s+(?:\d{4}-\d{2}-\d{2}|[A-Za-z]+\s+\d{1,2})/i.test(prompt) ||
    /(այս\s+շաբաթ|հաջորդ\s+շաբաթ|(?:անցած|անցյալ|նախորդ|վերջին)\s+շաբաթ|շաբաթվա\s+էքսկուրսիա|օրացույցում|օրացույցային\s+շաբաթ|պրովայդերի\s+օրացույցում\s+(?:այս|հաջորդ|անցած|անցյալ|նախորդ|վերջին)\s+շաբաթ)/i.test(
      prompt,
    ) ||
    /(?:на\s+)?(?:этой|текущ[а-яё]*|следующ[а-яё]*|прошл[а-яё]*)\s+(?:календарн[а-яё]*\s+)?недел/i.test(
      prompt,
    ) ||
    /календар[а-яё]*\s+провайдер/i.test(prompt) ||
    /календарн[а-яё]*\s+недел/i.test(prompt) ||
    /в\s+календар[а-яё]*/i.test(prompt) ||
    /\bнедел[а-яё]*\s+\d{4}-\d{2}-\d{2}\b/i.test(prompt) ||
    /\b\d{4}-\d{2}-\d{2}\s+շաբաթ\b/i.test(prompt);

  const hasTour =
    /\b(tour\s+departures?|tour\s+bookings?)\b/i.test(prompt) ||
    /\b(?:tour|tours?)\s+calendar\b/i.test(prompt) ||
    /\bcalendar\b.{0,40}\b(?:tour|tours?)\b/i.test(prompt) ||
    /\btours?\s+(?:are\s+)?(?:on|visible|departing)\b/i.test(prompt) ||
    /\b(provider\s+calendar|dashboard\s+calendar)\b.{0,60}\b(tour|trek|departure)\b/i.test(
      prompt,
    ) ||
    /\b(tour|trek|departure|tours?)\b.{0,60}\b(provider\s+calendar|calendar\s+week|(?:this|current|next|last)\s+week)\b/i.test(
      prompt,
    ) ||
    /(էքսկուրսիա|տուր|մեկնումներ)/i.test(prompt) ||
    /(тур|экскурс|выезд)/i.test(prompt);

  return hasWeek && hasTour;
}

function isPlausibleTourCalendarEmployeeName(
  candidate: string | null | undefined,
): boolean {
  const name = String(candidate ?? '').trim();
  if (!name) return false;
  // e2e-bug.309 residual — "for next week on the provider calendar" must not
  // become employeeName "next week".
  if (
    /^(provider|calendar|tour|tours?|trek|this|that|the|a|an|any|next|last|current|week)$/i.test(
      name,
    ) ||
    /^(this|current|next|last)\s+week$/i.test(name)
  ) {
    return false;
  }
  return true;
}

function extractEmployeeName(prompt: string): string | undefined {
  const fromParams = extractSingleProviderNameFromPrompt(prompt);
  if (fromParams && isPlausibleTourCalendarEmployeeName(fromParams)) {
    return fromParams;
  }

  const patterns = [
    /\bon\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\s+(?:provider\s+)?calendar\b/i,
    /\bfor\s+(?:provider\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\s+(?:provider\s+)?calendar\b/i,
    /\bcalendar\s+this\s+week\s+for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i,
    /\bfor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+this\s+week\b/i,
    /\b([A-Z][a-z]+)-ի\s+օրացույց/i,
    /\b([A-Z][a-z]+)-ի\s+պրովայդերի\s+օրացույց/i,
    /календар[а-яё]*\s+([A-Z][a-z]+)\s+на\s+этой\s+недел/i,
    /на\s+календар[а-яё]*\s+([A-Z][a-z]+)\s+на\s+этой\s+недел/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = match?.[1]?.trim();
    if (isPlausibleTourCalendarEmployeeName(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function extractWeekStartDate(prompt: string): string | undefined {
  const iso =
    prompt.match(/\bweek\s+of\s+(20\d{2}-\d{2}-\d{2})\b/i) ??
    prompt.match(/\bнедел[а-яё]*\s+(20\d{2}-\d{2}-\d{2})\b/i) ??
    prompt.match(/\b(20\d{2}-\d{2}-\d{2})\s+շաբաթ\b/i) ??
    prompt.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso?.[1]) return iso[1];

  // e2e-bug.288 — resolve relative week phrases so next/last week lists
  // anchor the correct Mon–Sun window (not today).
  // e2e-bug.309 — RU следующей/прошлой неделе; HY հաջորդ/անցած շաբաթ.
  // e2e-bug.310 — HY նախորդ/անցյալ/վերջին (+ շաբաթվա/շաբաթի genitive).
  if (
    /\bnext\s+week'?s?\b/i.test(prompt) ||
    /следующ[а-яё]*\s+(?:календарн[а-яё]*\s+)?недел/i.test(prompt) ||
    /հաջորդ\s+շաբաթ/i.test(prompt)
  ) {
    return normalizeTourWeekAnchorDateKey('next week');
  }
  if (
    /\blast\s+week'?s?\b/i.test(prompt) ||
    /прошл[а-яё]*\s+(?:календарн[а-яё]*\s+)?недел/i.test(prompt) ||
    /(?:անցած|անցյալ|նախորդ|վերջին)\s+շաբաթ/i.test(prompt)
  ) {
    return normalizeTourWeekAnchorDateKey('last week');
  }
  if (
    /\b(?:this|current)\s+week'?s?\b/i.test(prompt) ||
    /(?:этой|текущ[а-яё]*)\s+(?:календарн[а-яё]*\s+)?недел/i.test(prompt) ||
    /այս\s+շաբաթ/i.test(prompt)
  ) {
    return normalizeTourWeekAnchorDateKey('this week');
  }
  return undefined;
}

/**
 * e2e-bug.250 — reject classifier/prompt fragments mislabeled as serviceName
 * (e.g. "I have this week" from "What tour bookings do I have this week?").
 */
export function isPlausibleTourServiceNameFilter(
  candidate: string | null | undefined,
): boolean {
  const name = String(candidate ?? '').trim();
  if (name.length < 2 || name.length > 60) return false;

  if (
    /^(list|show|summarize|display|which|what|tour|tours?|trek|provider|calendar|week|bookings?|appointments?|departures?|this|that|the|any|do|does|did|have|has|i|we|you|me|my|our)\b/i.test(
      name,
    )
  ) {
    return false;
  }

  // Trailing clause / question fragments from the user prompt.
  if (
    /\b(i|we|you)\s+have\b/i.test(name) ||
    /\bdo\s+i\s+have\b/i.test(name) ||
    /\b(this|current|next|last)\s+week\b/i.test(name) ||
    /\bcalendar\s+week\b/i.test(name) ||
    /\b(tour\s+)?bookings?\b/i.test(name) ||
    /\b(with\s+)?(?:dates?|pax)\b/i.test(name) ||
    /\b(on|for|of|the|a|an)\s*$/i.test(name)
  ) {
    return false;
  }

  // Mostly stopwords / no content word that could be a tour title.
  const tokens = name.toLowerCase().split(/\s+/).filter(Boolean);
  const stop = new Set([
    'i',
    'we',
    'you',
    'me',
    'my',
    'our',
    'the',
    'a',
    'an',
    'do',
    'does',
    'did',
    'have',
    'has',
    'had',
    'this',
    'that',
    'week',
    'what',
    'which',
    'any',
    'tour',
    'tours',
    'tour',
    'bookings',
    'booking',
  ]);
  if (tokens.length > 0 && tokens.every((t) => stop.has(t))) return false;

  return true;
}

function extractServiceFilter(prompt: string): string | null {
  const patterns = [
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+tours?\s+on\s+this\s+calendar\s+week\b/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+(?:tour|trek)s?\s+on\s+this\s+calendar\s+week\b/i,
    /\b(?:mountain\s+trek|city\s+tour|heritage\s+tour|3-day\s+mountain\s+trek)\b/i,
    /\b(Mountain trek)\s+էքսկուրսիաներ/i,
    /\bтуры\s+(mountain trek)\b/i,
    /\bon\s+this\s+calendar\s+week\s+for\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+(?:tour|trek)\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = (match?.[1] ?? match?.[0] ?? '').trim();
    // Strip trailing plural "tours" from capture groups only — never "tour"
    // (that would turn "City tour" into "City").
    const cleaned = candidate.replace(/\s+tours$/i, '').trim();
    if (isPlausibleTourServiceNameFilter(cleaned)) {
      return cleaned;
    }
  }
  return null;
}

export function isTourCalendarWeekIntent(
  action: string,
): action is TourCalendarWeekIntent {
  return (TOUR_CALENDAR_WEEK_INTENTS as readonly string[]).includes(action);
}

export function isListTourCalendarWeekPrompt(prompt: string): boolean {
  if (isExplainTourBookingRecordPrompt(prompt)) return false;
  if (isExplainTourCalendarSpanPrompt(prompt)) return false;
  if (isMyStatsPrompt(prompt)) return false;
  if (isUpcomingDaysCapacityPrompt(prompt)) return false;
  if (isAllAppointmentsPrompt(prompt)) return false;
  if (!hasCalendarWeekListTopic(prompt)) return false;
  return hasDashboardListCue(prompt) || hasImplicitCalendarWeekListCue(prompt);
}

export function parseListTourCalendarWeekFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedListTourCalendarWeek | null {
  const employeeIdFromParams =
    typeof params.employeeId === 'string'
      ? params.employeeId.trim()
      : undefined;
  const employeeNameFromParamsRaw =
    typeof params.employeeName === 'string'
      ? params.employeeName.trim()
      : undefined;
  const employeeNameFromParams = isPlausibleTourCalendarEmployeeName(
    employeeNameFromParamsRaw,
  )
    ? employeeNameFromParamsRaw
    : undefined;
  const serviceIdFromParams =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const rawServiceNameFromParams =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  // e2e-bug.250 — never trust a garbage classifier fragment as serviceName.
  const serviceNameFromParams = isPlausibleTourServiceNameFilter(
    rawServiceNameFromParams,
  )
    ? rawServiceNameFromParams
    : undefined;
  const weekStartFromParams = normalizeTourWeekStartParam(
    typeof params.weekStartDate === 'string'
      ? params.weekStartDate
      : typeof params.date === 'string'
        ? params.date
        : undefined,
  );

  const hasParams =
    Boolean(employeeIdFromParams) ||
    Boolean(employeeNameFromParams) ||
    Boolean(serviceIdFromParams) ||
    Boolean(serviceNameFromParams) ||
    Boolean(weekStartFromParams);

  if (!isListTourCalendarWeekPrompt(prompt) && !hasParams) {
    return null;
  }

  const serviceNameFromPrompt = extractServiceFilter(prompt) || undefined;

  return {
    employeeId: employeeIdFromParams,
    employeeName:
      employeeNameFromParams || extractEmployeeName(prompt) || undefined,
    serviceId: serviceIdFromParams,
    serviceName: serviceNameFromParams || serviceNameFromPrompt || undefined,
    // e2e-bug.309 — prefer prompt next/last/this week over classifier anchors
    // that default to "this week" (live RU last-week was snapping to current Mon).
    weekStartDate:
      extractWeekStartDate(prompt) || weekStartFromParams || undefined,
  };
}

export function rescueListTourCalendarWeekIntent(
  prompt: string,
  action: string,
): { action: TourCalendarWeekIntent; rescueReason: string } | null {
  if (isTourCalendarWeekIntent(action)) return null;
  if (!parseListTourCalendarWeekFromPrompt(prompt)) return null;
  return {
    action: 'list_tour_calendar_week',
    rescueReason: 'list_tour_calendar_week',
  };
}
