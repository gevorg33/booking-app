import { extractSingleProviderNameFromPrompt } from './ai-dashboard-ops.util.js';
import { isExplainTourBookingRecordPrompt } from './ai-tour-booking-record.util.js';
import { isExplainTourCalendarSpanPrompt } from './ai-tour-calendar-span.util.js';

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
    /(ցուցադր(?!ր)|ինչու|ինչ[^ու]|(?:^|\s)որ\s+|բացատր|տուր)/i.test(prompt) ||
    /(покажи|список|какие|какой|тур)/i.test(prompt)
  );
}

function isUpcomingDaysCapacityPrompt(prompt: string): boolean {
  return (
    /\b(upcoming|next)\b.{0,40}\b(\d{1,3}\s+days?|week|month)\b/i.test(
      prompt,
    ) ||
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
    /\bdeparting\s+this\s+week\b/i.test(prompt) ||
    /\bprovider\s+calendar\b/i.test(prompt) ||
    /календар[а-яё]*\s+провайдер/i.test(prompt) ||
    /պրովայդերի\s+օրացույց/i.test(prompt)
  );
}

function hasCalendarWeekListTopic(prompt: string): boolean {
  const hasWeek =
    /\b(?:this\s+)?calendar\s+week\b/i.test(prompt) ||
    /\b(this|current)\s+week(?:'s)?\b/i.test(prompt) ||
    /\bprovider\s+calendar\s+week\b/i.test(prompt) ||
    /\bweek\s+of\s+(?:\d{4}-\d{2}-\d{2}|[A-Za-z]+\s+\d{1,2})/i.test(prompt) ||
    /(այս\s+շաբաթ|շաբաթվա\s+էքսկուրսիա|օրացույցում|օրացույցային\s+շաբաթ|պրովայդերի\s+օրացույցում\s+այս\s+շաբաթ)/i.test(
      prompt,
    ) ||
    /(на\s+этой\s+(?:календарн[а-яё]*\s+)?недел|календар[а-яё]*\s+провайдер|календарн[а-яё]*\s+недел|недел[а-яё]*\s+\d{4}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}\s+շաբաթ)/i.test(
      prompt,
    );

  const hasTour =
    /\b(tour\s+departures?|tour\s+bookings?)\b/i.test(prompt) ||
    /\btours?\s+(?:are\s+)?(?:on|visible|departing)\b/i.test(prompt) ||
    /\b(provider\s+calendar|dashboard\s+calendar)\b.{0,60}\b(tour|trek|departure)\b/i.test(
      prompt,
    ) ||
    /\b(tour|trek|departure|tours?)\b.{0,60}\b(provider\s+calendar|calendar\s+week|this\s+week)\b/i.test(
      prompt,
    ) ||
    /(էքսկուրսիա|տուր|մեկնումներ)/i.test(prompt) ||
    /(тур|экскурс|выезд)/i.test(prompt);

  return hasWeek && hasTour;
}

function extractEmployeeName(prompt: string): string | undefined {
  const fromParams = extractSingleProviderNameFromPrompt(prompt);
  if (fromParams) return fromParams;

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
    if (
      candidate &&
      !/^(provider|calendar|tour|tours|this|the)$/i.test(candidate)
    ) {
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
  return iso?.[1];
}

function extractServiceFilter(prompt: string): string | null {
  const forbidden =
    /^(list|show|summarize|which|what|tour|tours|provider|calendar)\b/i;
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
    if (candidate.length >= 2 && !forbidden.test(candidate)) {
      return candidate.replace(/\s+tours?$/i, '').trim();
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
  const employeeNameFromParams =
    typeof params.employeeName === 'string'
      ? params.employeeName.trim()
      : undefined;
  const serviceIdFromParams =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const serviceNameFromParams =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  const weekStartFromParams =
    typeof params.weekStartDate === 'string'
      ? params.weekStartDate.trim()
      : undefined;

  const hasParams =
    Boolean(employeeIdFromParams) ||
    Boolean(employeeNameFromParams) ||
    Boolean(serviceIdFromParams) ||
    Boolean(serviceNameFromParams) ||
    Boolean(weekStartFromParams);

  if (!isListTourCalendarWeekPrompt(prompt) && !hasParams) {
    return null;
  }

  return {
    employeeId: employeeIdFromParams,
    employeeName:
      employeeNameFromParams || extractEmployeeName(prompt) || undefined,
    serviceId: serviceIdFromParams,
    serviceName:
      serviceNameFromParams || extractServiceFilter(prompt) || undefined,
    weekStartDate:
      weekStartFromParams || extractWeekStartDate(prompt) || undefined,
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
