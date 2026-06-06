import { isExplainTourBookingRecordPrompt } from './ai-tour-booking-record.util.js';
import { isExplainTourCalendarSpanPrompt } from './ai-tour-calendar-span.util.js';
import { isListTourCalendarWeekPrompt } from './ai-tour-calendar-week.util.js';

export const UPCOMING_TOUR_DEPARTURES_INTENTS = [
  'list_upcoming_tour_departures',
] as const;

export type UpcomingTourDeparturesIntent =
  (typeof UPCOMING_TOUR_DEPARTURES_INTENTS)[number];

export interface ParsedListUpcomingTourDepartures {
  serviceName?: string;
  serviceId?: string;
  daysAhead?: number;
}

function hasDashboardListCue(prompt: string): boolean {
  return (
    /\b(list|show|summarize|display|which|what|tell|give|overview|confirmed)\b/i.test(
      prompt,
    ) ||
    /\bdeparture\s+schedule\b/i.test(prompt) ||
    /\?\s*$/.test(prompt.trim()) ||
    /(ցույց|ցուցադր|բացատր|տուր|առաջիկա)/i.test(prompt) ||
    /(покажи|список|какие|предстоящ|выезд)/i.test(prompt)
  );
}

function isCatalogOnlyTourPrompt(prompt: string): boolean {
  return (
    /\b(cover\s+images?|catalog\s+services?|tour\s+services?\s+with|group\s+sizes?\s+and|what\s+tours?\s+(?:do\s+we\s+)?offer|tour\s+settings|difficulty|meeting\s+point|our\s+tour\s+catalog)\b/i.test(
      prompt,
    ) ||
    /\bexplain\s+(?:our\s+)?tour\s+services?\b/i.test(prompt) ||
    /(ծածկ|կատալոգ|առաջարկում|դժվարություն)/i.test(prompt) ||
    /(обложк|каталог|предлагаем|сложност)/i.test(prompt)
  );
}

function isPerBookingTourListPrompt(prompt: string): boolean {
  return (
    /\bwhat\s+upcoming\s+bookings?\s+does\b/i.test(prompt) ||
    /\bwho(?:'s| is)\s+booked\b/i.test(prompt) ||
    /\bcatalog\s+and\s+who\b/i.test(prompt)
  );
}

function hasDepartureAggregationTopic(prompt: string): boolean {
  const hasDepartureWord = /\bdepartures?\b/i.test(prompt);
  const hasCapacitySignal =
    /\b(?:remaining\s+)?capacity\b/i.test(prompt) ||
    /\b(?:seats?|spots?|places?)\b/i.test(prompt) ||
    /\bpax\b/i.test(prompt);

  return (
    /\b(upcoming\s+)?tour\s+departures?\b/i.test(prompt) ||
    /\bdeparture\s+(?:dates?|schedule)\b/i.test(prompt) ||
    /\bdepartures?\s+by\s+(?:departure\s+)?date\b/i.test(prompt) ||
    /\bwhich\s+departures?\b/i.test(prompt) ||
    /\bgrouped\s+by\s+departure\b/i.test(prompt) ||
    /\b(?:remaining\s+)?capacity\b/i.test(prompt) ||
    /\b(?:seats?|spots?|places?)\s+(?:left|remaining)\b/i.test(prompt) ||
    /\bremaining\s+(?:spots?|seats?|capacity)\b/i.test(prompt) ||
    /\bpax\s+booked\b/i.test(prompt) ||
    /\bbooked\s+pax\b/i.test(prompt) ||
    /\bconfirmed\s+departures?\b/i.test(prompt) ||
    (hasDepartureWord && hasCapacitySignal) ||
    /(մեկնում|մնացած\s+տեղ|հաստատված)/i.test(prompt) ||
    /(выезд|осталось|мест|предстоящ)/i.test(prompt)
  );
}

function hasDepartureDateWithPaxPrompt(prompt: string): boolean {
  return (
    /\b(upcoming|next|confirmed)\b.{0,40}\b(tour\s+)?bookings?\b.{0,40}\b(departure|pax|tour\s+start)\b/i.test(
      prompt,
    ) ||
    /\b(tour\s+)?bookings?\b.{0,40}\b(departure\s+dates?|pax|tour\s+start)\b/i.test(
      prompt,
    )
  );
}

function extractDaysAhead(prompt: string): number | undefined {
  const match =
    prompt.match(/\bnext\s+(\d{1,3})\s+days?\b/i) ??
    prompt.match(/\b(\d{1,3})\s+days?\s+ahead\b/i) ??
    prompt.match(/\b(\d{1,3})\s+օր(?:ի|ում)?\s+հաջորդ/i) ??
    prompt.match(/(?:следующ(?:ие|их|ей))\s+(\d{1,3})\s+дн/i);
  const days = Number(match?.[1]);
  if (Number.isFinite(days) && days > 0) return Math.floor(days);
  if (/\bupcoming\s+week\b/i.test(prompt)) return 7;
  if (/\bthis\s+month\b/i.test(prompt)) return 30;
  return undefined;
}

function extractServiceFilter(prompt: string): string | null {
  const forbidden =
    /^(list|show|summarize|upcoming|confirmed|which|what|departure)\b/i;
  const patterns = [
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+(?:tour|trek)\s+departures?\b/i,
    /\bon\s+upcoming\s+([A-Za-z0-9][\w\s&'-]+?)\s+departures?\b/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+(?:tour|trek)\s+departures?\b/i,
    /\b(?:mountain\s+trek|city\s+tour|heritage\s+tour|3-day\s+mountain\s+trek)\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = (match?.[1] ?? match?.[0] ?? '').trim();
    if (candidate.length >= 2 && !forbidden.test(candidate)) {
      return candidate
        .replace(/\s+departures?$/i, '')
        .replace(/^upcoming\s+/i, '')
        .trim();
    }
  }
  return null;
}

export function isUpcomingTourDeparturesIntent(
  action: string,
): action is UpcomingTourDeparturesIntent {
  return (UPCOMING_TOUR_DEPARTURES_INTENTS as readonly string[]).includes(
    action,
  );
}

function isTourDaySlotsConsumerExplainPrompt(prompt: string): boolean {
  const hasDaySlotsTopic =
    /\b(one\s+departure|single\s+departure|one\s+(?:time\s+)?slot|remaining\s+spots?|spots?\s+left|spots?\s+remaining|fully\s+booked|sold\s+out|no\s+(?:departure\s+)?times?|no\s+slots?)\b/i.test(
      prompt,
    ) ||
    /(մեկ\s+մեկնում|մնաց|տեղ|ամբողջությամբ\s+ամրագրված)/i.test(prompt) ||
    /(одно\s+время|осталось|мест|недоступен|полностью\s+забронирован)/i.test(
      prompt,
    );
  const hasExplainCue =
    /\b(what|which|how|why|does|do|is|are|mean|meaning|explain|show|tell)\b/i.test(
      prompt,
    ) ||
    /\?\s*$/.test(prompt.trim()) ||
    /(ինչ|որ|ինչու|բացատր|նշանակ)/i.test(prompt) ||
    /(какой|какая|почему|объясни|осталось)/i.test(prompt);
  return hasDaySlotsTopic && hasExplainCue;
}

export function isListUpcomingTourDeparturesPrompt(prompt: string): boolean {
  if (isTourDaySlotsConsumerExplainPrompt(prompt)) return false;
  if (isExplainTourBookingRecordPrompt(prompt)) return false;
  if (isExplainTourCalendarSpanPrompt(prompt)) return false;
  if (isListTourCalendarWeekPrompt(prompt)) return false;
  if (isCatalogOnlyTourPrompt(prompt)) return false;
  if (isPerBookingTourListPrompt(prompt)) return false;
  if (!hasDashboardListCue(prompt)) return false;

  if (hasDepartureAggregationTopic(prompt)) return true;
  if (hasDepartureDateWithPaxPrompt(prompt)) return true;

  return false;
}

export function parseListUpcomingTourDeparturesFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedListUpcomingTourDepartures | null {
  if (!isListUpcomingTourDeparturesPrompt(prompt)) return null;

  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const serviceNameFromParams =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  const serviceName =
    serviceNameFromParams || extractServiceFilter(prompt) || undefined;

  const daysAheadFromParams =
    typeof params.daysAhead === 'number'
      ? params.daysAhead
      : typeof params.daysAhead === 'string'
        ? Number(params.daysAhead)
        : undefined;
  const daysAhead =
    Number.isFinite(daysAheadFromParams) && daysAheadFromParams! > 0
      ? Math.floor(daysAheadFromParams!)
      : (extractDaysAhead(prompt) ?? 30);

  return {
    serviceId,
    serviceName,
    daysAhead,
  };
}

export function rescueListUpcomingTourDeparturesIntent(
  prompt: string,
  action: string,
): { action: UpcomingTourDeparturesIntent; rescueReason: string } | null {
  if (isUpcomingTourDeparturesIntent(action)) return null;
  if (!parseListUpcomingTourDeparturesFromPrompt(prompt)) return null;
  return {
    action: 'list_upcoming_tour_departures',
    rescueReason: 'list_upcoming_tour_departures',
  };
}
