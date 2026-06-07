import { extractBookingIdFromPrompt } from './ai-provider-booking.util.js';
import { isDiagnoseTourCapacityPrompt } from './ai-tour-capacity.util.js';

export const TOUR_BOOKING_RECORD_INTENTS = [
  'explain_tour_booking_record',
] as const;

export type TourBookingRecordIntent =
  (typeof TOUR_BOOKING_RECORD_INTENTS)[number];

export type TourBookingRecordAspect =
  | 'paxCount'
  | 'dates'
  | 'specialRequirements'
  | 'calendarSpan'
  | 'all';

export interface ParsedExplainTourBookingRecord {
  bookingId?: string;
  customerName?: string;
  serviceName?: string;
  aspect: TourBookingRecordAspect;
}

function hasDashboardReadCue(prompt: string): boolean {
  return (
    /\b(what|which|how|why|explain|show|tell|stored|mean)\b/i.test(prompt) ||
    /\?\s*$/.test(prompt.trim()) ||
    /(ինչ|որ|որքան|բացատր|ցույց|ինչու)/i.test(prompt) ||
    /(какой|какая|какие|сколько|почему|объясни|покажи)/i.test(prompt)
  );
}

function hasTourBookingRecordTopic(prompt: string): boolean {
  return (
    /\b(tour\s+booking\s+record|booking\s+record|tour\s+metadata|tourstartdate|tourenddate|tour\s+start\s+date|tour\s+end\s+date)\b/i.test(
      prompt,
    ) ||
    /\b(pax\s+count|pax\b|special\s+requirements?)\b.{0,40}\b(booking|appointment)\b/i.test(
      prompt,
    ) ||
    /\b(booking|appointment)\b.{0,40}\b(pax\s+count|pax\b|special\s+requirements?|tour\s+dates?)\b/i.test(
      prompt,
    ) ||
    /\b(provider\s+calendar|calendar)\b/i.test(prompt) ||
    /\b(multiple\s+days|across\s+days)\b/i.test(prompt) ||
    /\b(span|multiple\s+days|across)\b.{0,50}\b(calendar|provider)\b/i.test(
      prompt,
    ) ||
    /(pax|տարեթվեր|ամրագրում|հատուկ\s+պահանջ)/i.test(prompt) ||
    /(pax|бронирован|дат(?:а|ы)\s+начал|дат(?:а|ы)\s+конц|особые\s+требован|несколько\s+дней)/i.test(
      prompt,
    ) ||
    /календар\w*\s+провайдер/i.test(prompt)
  );
}

function extractTourBookingIdFromPrompt(prompt: string): string | undefined {
  const explicit =
    prompt.match(/\bfor\s+booking\s+(bk-[a-z0-9-]+)\b/i) ??
    prompt.match(/\bbooking\s+(bk-[a-z0-9-]+)\b/i) ??
    prompt.match(
      /(?:бронирован(?:ия|ии|ию)|ամրագրում(?:ը|ի)?)\s+(bk-[a-z0-9-]+)\b/i,
    );
  if (explicit?.[1]) return explicit[1];

  const standard = extractBookingIdFromPrompt(prompt);
  if (standard && standard !== 'record') return standard;

  const short = prompt.match(
    /\b(?:booking|appointment)\s*#?\s*(bk-[a-z0-9-]+)\b/i,
  );
  if (short?.[1]) return short[1];

  const bare = prompt.match(/\b(bk-[a-z0-9-]+)\b/i);
  return bare?.[1];
}

function isExplainTourServicesLikeList(prompt: string): boolean {
  if (isUpcomingTourListPrompt(prompt)) return true;
  return (
    /\b(list|show|summarize|explain\s+our)\b.{0,40}\b(tour\s+services?|our\s+tours?|tour\s+catalog)\b/i.test(
      prompt,
    ) &&
    !/\bfor\s+(?:booking|appointment)\b/i.test(prompt) &&
    !/\bbooking\s+record\b/i.test(prompt)
  );
}

function isUpcomingTourListPrompt(prompt: string): boolean {
  if (
    /\b(departure\s+dates?|departure\s+schedule|remaining\s+capacity|seats?\s+left|spots?\s+remaining|grouped\s+by\s+departure)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  return (
    /\b(upcoming|next|list|show|summarize)\b.{0,40}\b(tour\s+bookings?|departures?|tours?)\b/i.test(
      prompt,
    ) &&
    !/\b(booking\s*#?|appointment\s*#?)\s*[a-z0-9-]{4,}\b/i.test(prompt) &&
    !/\bfor\s+(?:booking|appointment)\b/i.test(prompt)
  );
}

function extractCustomerNameFromPrompt(prompt: string): string | null {
  const patterns = [
    /\bfor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\b/,
    /\bfor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\s+(?:\d+-Day\s+)?[A-Za-z\s]+booking\b/,
    /(?:для|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i,
    /([A-Z][a-z]+)-ի\s+համար/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length >= 2) return candidate;
  }
  return null;
}

function extractServiceNameFromPrompt(prompt: string): string | null {
  const patterns = [
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+(?:tour|trek)\s+booking\b/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+(?:tour|trek)\s+booking\b/i,
    /\bheritage\s+tour\b/i,
    /\bmountain\s+trek\b/i,
    /\bcity\s+tour\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = (match?.[1] ?? match?.[0] ?? '').trim();
    if (
      candidate.length >= 2 &&
      !/^(explain|show|what|how|why|tell)$/i.test(candidate)
    ) {
      return candidate
        .replace(/\s+booking$/i, '')
        .replace(/^for\s+the\s+/i, '')
        .trim();
    }
  }
  return null;
}

function resolveTourBookingRecordAspect(
  prompt: string,
): TourBookingRecordAspect {
  const pax =
    /\b(pax\s+count|pax\b|how\s+many\s+pax|how\s+many\s+people)\b/i.test(
      prompt,
    ) || /(pax|հոգի)/i.test(prompt);
  const dates =
    /\b(tourstartdate|tourenddate|tour\s+start|tour\s+end|start\s+and\s+end\s+dates?|departure\s+dates?|pax\s+and\s+dates?)\b/i.test(
      prompt,
    ) ||
    /տարեթվեր/i.test(prompt) ||
    /дат(?:а|ы)/i.test(prompt) ||
    /\bdates?\b/i.test(prompt);
  const special =
    /\b(special\s+requirements?|dietary|accessibility\s+needs?|հատուկ\s+պահանջ|особые\s+требован)/i.test(
      prompt,
    );
  const calendar =
    /\b(provider\s+calendar|calendar\s+span|multiple\s+days|span\b|across\s+days)\b/i.test(
      prompt,
    ) || /(несколько\s+дней|календар\w*\s+провайдер)/i.test(prompt);

  const count = [pax, dates, special, calendar].filter(Boolean).length;
  if (count >= 2) return 'all';
  if (pax) return 'paxCount';
  if (dates) return 'dates';
  if (special) return 'specialRequirements';
  if (calendar) return 'calendarSpan';
  return 'all';
}

export function isTourBookingRecordIntent(
  action: string,
): action is TourBookingRecordIntent {
  return (TOUR_BOOKING_RECORD_INTENTS as readonly string[]).includes(action);
}

function isSingleTourBookingRecordPrompt(prompt: string): boolean {
  if (!hasTourBookingRecordTopic(prompt) || !hasDashboardReadCue(prompt)) {
    return false;
  }
  if (isUpcomingTourListPrompt(prompt)) return false;

  const bookingId = extractTourBookingIdFromPrompt(prompt);
  const customerName = extractCustomerNameFromPrompt(prompt);
  if (bookingId || customerName) return true;

  if (
    /\b(this|that)\s+(?:tour\s+)?(?:booking|tour)\b/i.test(prompt) ||
    /(?:это|эта|этот)\s+(?:\w+\s+){0,3}бронирован/i.test(prompt) ||
    /\bbooking\s+record\b/i.test(prompt) ||
    /(ամրագրում|tour\s+booking\s+record)/i.test(prompt)
  ) {
    return true;
  }

  return /\b(booking|appointment)\s*#?\s*[a-z0-9-]{4,}\b/i.test(prompt);
}

function isTourCalendarWeekListLikePrompt(prompt: string): boolean {
  const hasWeek =
    /\b(?:this\s+)?calendar\s+week\b/i.test(prompt) ||
    /\b(this|current)\s+week\b/i.test(prompt) ||
    /\bprovider\s+calendar\s+week\b/i.test(prompt);
  if (!hasWeek) return false;
  if (!/\b(calendar|provider\s+calendar)\b/i.test(prompt)) return false;
  return (
    /\b(?:which|what|list|show|summarize)\b.{0,80}\btours?\b/i.test(prompt) ||
    /\btours?\s+(?:are\s+)?(?:on|visible|departing)\b/i.test(prompt)
  );
}

export function isExplainTourBookingRecordPrompt(prompt: string): boolean {
  if (isDiagnoseTourCapacityPrompt(prompt)) return false;
  if (isTourCalendarWeekListLikePrompt(prompt)) return false;
  if (isUpcomingTourListPrompt(prompt)) return false;

  if (isExplainTourServicesLikeList(prompt)) return false;

  if (isSingleTourBookingRecordPrompt(prompt)) {
    return true;
  }
  if (!hasTourBookingRecordTopic(prompt)) return false;
  if (!hasDashboardReadCue(prompt)) return false;

  return Boolean(
    extractTourBookingIdFromPrompt(prompt) ||
    extractCustomerNameFromPrompt(prompt) ||
    /\bbooking\s+record\b/i.test(prompt),
  );
}

export function parseExplainTourBookingRecordFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainTourBookingRecord | null {
  const bookingIdFromParams =
    typeof params.bookingId === 'string' ? params.bookingId.trim() : '';
  if (!isExplainTourBookingRecordPrompt(prompt) && !bookingIdFromParams) {
    return null;
  }

  const bookingId =
    bookingIdFromParams || extractTourBookingIdFromPrompt(prompt) || undefined;

  const customerNameFromParams =
    typeof params.customerName === 'string'
      ? params.customerName.trim()
      : undefined;
  const customerName =
    customerNameFromParams ||
    extractCustomerNameFromPrompt(prompt) ||
    undefined;

  const serviceNameFromParams =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  const serviceName =
    serviceNameFromParams || extractServiceNameFromPrompt(prompt) || undefined;

  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  const aspect =
    aspectFromParams === 'paxCount' ||
    aspectFromParams === 'dates' ||
    aspectFromParams === 'specialRequirements' ||
    aspectFromParams === 'calendarSpan' ||
    aspectFromParams === 'all'
      ? aspectFromParams
      : resolveTourBookingRecordAspect(prompt);

  return {
    bookingId,
    customerName,
    serviceName,
    aspect,
  };
}

export function rescueExplainTourBookingRecordIntent(
  prompt: string,
  action: string,
): { action: TourBookingRecordIntent; rescueReason: string } | null {
  if (isTourBookingRecordIntent(action)) return null;
  if (!parseExplainTourBookingRecordFromPrompt(prompt)) return null;
  return {
    action: 'explain_tour_booking_record',
    rescueReason: 'explain_tour_booking_record',
  };
}
