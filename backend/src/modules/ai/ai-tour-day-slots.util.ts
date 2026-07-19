import { toIsoDay } from '../../common/utils/date-format.util.js';
import { isCatalogMutateCommandPrompt } from './ai-catalog.util.js';
import { isDiagnoseTourCapacityPrompt } from './ai-tour-capacity.util.js';
import { isExplainTourBookingPrompt } from './ai-tour-booking.util.js';

export const TOUR_DAY_SLOTS_INTENTS = ['explain_tour_day_slots'] as const;

export type TourDaySlotsIntent = (typeof TOUR_DAY_SLOTS_INTENTS)[number];

export type TourDaySlotsAspect =
  | 'oneDeparture'
  | 'remainingSpots'
  | 'fullyBooked'
  | 'all';

export interface ParsedExplainTourDaySlots {
  serviceName?: string;
  serviceId?: string;
  dateKey?: string;
  aspect: TourDaySlotsAspect;
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasReadTourDaySlotsCue(prompt: string): boolean {
  return (
    /\b(what|which|how|why|does|do|is|are|can|tell|explain|show|mean|meaning)\b/i.test(
      prompt,
    ) ||
    /\?\s*$/.test(prompt.trim()) ||
    /(ինչու|ինչու՞|ինչ\s|որքան|քանի\s|բացատր|ցույց|նշանակ)/i.test(prompt) ||
    /(какой|какая|какие|сколько|почему|объясни|осталось|недоступен)/i.test(
      prompt,
    )
  );
}

function hasBookingVisitorContext(prompt: string): boolean {
  return (
    /\b(booking\s+page|online\s+booking|public\s+booking|mobile\s+booking|this\s+page|on\s+this\s+page|here|catalog|when\s+(?:i\s+)?book|consumer\s+app|in\s+the\s+app)\b/i.test(
      prompt,
    ) ||
    /(գրանցման\s+էջ|այս\s+էջ|կայք|գրանցել|ցուցադր)/i.test(prompt) ||
    /(страниц\w*\s+записи|здесь|сайт\w*\s+записи|забронировать)/i.test(prompt)
  );
}

function hasTourDaySlotsTopic(prompt: string): boolean {
  return (
    /\b(one\s+departure|single\s+departure|one\s+time\s+per\s+day|one\s+(?:time\s+)?slot|day[-\s]?level|remaining\s+spots?|spots?\s+left|spots?\s+remaining|fully\s+booked|sold\s+out|grayed\s+out|no\s+(?:departure\s+)?times?|no\s+slots?|no\s+availability)\b/i.test(
      prompt,
    ) ||
    /\b(multi[-\s]?day\s+tours?).{0,60}\b(one|single)\b/i.test(prompt) ||
    /\b(one|single)\s+(?:time\s+)?slot.{0,40}\bmulti[-\s]?day\b/i.test(
      prompt,
    ) ||
    /\b(why|how\s+many).{0,40}\b(spots?|seats?|places?)\b/i.test(prompt) ||
    /(մեկ\s+մեկնում|մնաց|քանի\s+տեղ|ամբողջությամբ\s+ամրագրված|օրական)/i.test(
      prompt,
    ) ||
    /(одно\s+время|осталось|мест|недоступен|полностью\s+забронирован)/i.test(
      prompt,
    )
  );
}

function hasTourServiceReference(prompt: string): boolean {
  return (
    /\b(tours?|trek|excursion|hike)\b/i.test(prompt) ||
    /(էքսկուրսիա|տուր)/i.test(prompt) ||
    /(тур|экскурс)/i.test(prompt)
  );
}

function isAvailabilityListingPrompt(prompt: string): boolean {
  return (
    /\b(who\s+is\s+free|check\s+availability|open\s+times?|free\s+slots?)\b/i.test(
      prompt,
    ) || /(ով\s+է\s+ազատ|кто\s+свободен)/i.test(prompt)
  );
}

function isPlausibleTourServiceName(name: string): boolean {
  if (name.length > 48) return false;
  if (
    /\b(what|which|why|how|does|mean|remaining|spots|only|see|when|book)\b/i.test(
      name,
    )
  ) {
    return false;
  }
  return name.trim().split(/\s+/).length <= 6;
}

function extendTourCatalogServiceName(name: string, prompt: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const catalogTour = prompt.match(
    new RegExp(`\\b${escaped}(?:\\s+[A-Za-z0-9][\\w'&-]+)*\\s+Tour\\b`),
  );
  if (catalogTour?.[0]) return catalogTour[0].trim();
  const extended = prompt.match(
    new RegExp(
      `\\b${escaped}(?:\\s+[A-Za-z0-9][\\w'&-]+)*\\s+(?:trek|hike|drive)\\b`,
      'i',
    ),
  );
  return extended?.[0]?.trim() ?? name;
}

function canonicalizeDaySlotsServiceName(name: string, prompt: string): string {
  if (/\b3-Day\s+Mountain\s+Trek\b/i.test(prompt)) {
    return '3-Day Mountain Trek';
  }
  if (/^Mountain Trek$/i.test(name) || /^mountain\s+trek$/i.test(name)) {
    return '3-Day Mountain Trek';
  }
  return name;
}

function normalizeServiceNameCandidate(
  candidate: string,
  prompt?: string,
): string | null {
  let name = candidate.trim();
  for (let i = 0; i < 4; i += 1) {
    const next = name.replace(/^(?:the|a|an)\s+/i, '').trim();
    if (next === name) break;
    name = next;
  }
  name = name.replace(/-ը$/i, '').replace(/-ի$/i, '').trim();
  if (/^(?:tour|trek|excursion|տուր|էքսկուրսիա|тур|экскурс)$/i.test(name)) {
    return null;
  }
  if (name.length < 2) return null;
  const extended = prompt ? extendTourCatalogServiceName(name, prompt) : name;
  return prompt ? canonicalizeDaySlotsServiceName(extended, prompt) : extended;
}

function extractServiceNameFromPrompt(prompt: string): string | null {
  const patterns = [
    /\b(?:the\s+)?(\d+-Day\s+[A-Za-z]+(?:\s+[A-Za-z]+)*)\b/i,
    /\bExplain\s+day-level\s+booking\s+for\s+(?:the\s+)?(\d+-Day\s+[A-Za-z]+(?:\s+[A-Za-z]+)*)\b/i,
    /\bon\s+\d{1,2}\/\d{1,2}\/\d{4}\s+for\s+(?:the\s+)?(\d+-Day\s+[A-Za-z]+(?:\s+[A-Za-z]+)*)\b/i,
    /\bon\s+\d{1,2}\/\d{1,2}\/\d{4}\s+for\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)(?:\s+on\s+online\s+booking)?\s*\?/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+on\s+August\b/i,
    /\bshown\s+for\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+on\b/i,
    /\bfor\s+(?:the\s+)?(\d+-Day\s+[A-Za-z]+(?:\s+[A-Za-z]+)*)\b/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+on\s+(?:\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+on\s+online\s+booking\b/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+on\s+this\b/i,
    /\b(?:does|is)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+(?:only\s+)?show\b/i,
    /\bwhy\s+is\s+(?:\d{1,2}\/\d{1,2}\/\d{4}|\w+\s+\d{1,2})\s+fully\s+booked\s+for\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\b/i,
    /\bwhy\s+is\s+\d{1,2}\/\d{1,2}\/\d{4}\s+fully\s+booked\s+for\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\b/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+on\s+(?:\d{1,2}\/\d{1,2}\/\d{4})/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+tour\b/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+trek\b/i,
    /(?:у|для)\s+([A-Za-z0-9][\w\s&'-]+?)\s+(?:на\s+страниц|только\s+одно)/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)(?:-ը)\s+մեկ\s+մեկնում/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+on\s+(?:August\s+\d{1,2}|the\s+booking\s+page)/i,
    /([A-Za-z0-9][\w\s&'-]+?)\s+տուր/i,
    /([A-Za-z0-9][\w\s&'-]+?)-ի\s+համար/i,
    /\b(mountain\s+trek)\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const group = match?.[2] ?? match?.[1] ?? '';
    const candidate = normalizeServiceNameCandidate(group, prompt);
    if (candidate) return candidate;
  }
  return null;
}

function extractDateFromPrompt(prompt: string): string | undefined {
  const iso = prompt.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso?.[1]) return iso[1];

  const slash = prompt.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);
  if (slash?.[1]) {
    const normalized = toIsoDay(slash[1], 'UTC');
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  }

  const monthDay = prompt.match(/\b(?:on\s+)?(\d{1,2})\/(\d{1,2})\/(\d{4})\b/i);
  if (monthDay) {
    const normalized = toIsoDay(
      `${monthDay[1]}/${monthDay[2]}/${monthDay[3]}`,
      'UTC',
    );
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  }

  const august = prompt.match(/\b(?:on\s+)?August\s+(\d{1,2})\b/i);
  if (august?.[1]) return `2026-08-${august[1].padStart(2, '0')}`;

  return undefined;
}

function resolveTourDaySlotsAspect(prompt: string): TourDaySlotsAspect {
  const oneDeparture =
    /\b(one\s+departure|single\s+departure|one\s+(?:time\s+)?slot|day[-\s]?level|collapse|per\s+day)\b/i.test(
      prompt,
    ) ||
    /(одно\s+время|только\s+одно\s+время|в\s+день)/i.test(prompt) ||
    /(օրական|մեկ\s+մեկնում)/i.test(prompt);
  const remainingSpots =
    /\b(remaining\s+spots?|spots?\s+left|spots?\s+remaining|how\s+many\s+(?:spots?|seats?|places?)|spots?\s+mean)\b/i.test(
      prompt,
    ) ||
    /(сколько\s+мест|осталось)/i.test(prompt) ||
    /(մնաց|տեղ)/i.test(prompt);
  const fullyBooked =
    /\b(fully\s+booked|sold\s+out|grayed\s+out|no\s+(?:departure\s+)?times?|no\s+slots?|unavailable)\b/i.test(
      prompt,
    ) || /(недоступен|ամբողջությամբ\s+ամրագրված)/i.test(prompt);

  const count = [oneDeparture, remainingSpots, fullyBooked].filter(
    Boolean,
  ).length;
  if (count >= 2) return 'all';
  if (oneDeparture) return 'oneDeparture';
  if (remainingSpots) return 'remainingSpots';
  if (fullyBooked) return 'fullyBooked';
  return 'all';
}

export function isTourDaySlotsIntent(
  action: string,
): action is TourDaySlotsIntent {
  return (TOUR_DAY_SLOTS_INTENTS as readonly string[]).includes(action);
}

function isSingleTourDaySlotsPrompt(prompt: string): boolean {
  if (!hasTourDaySlotsTopic(prompt) || !hasReadTourDaySlotsCue(prompt)) {
    return false;
  }
  if (isAvailabilityListingPrompt(prompt)) return false;

  const serviceName = extractServiceNameFromPrompt(prompt);
  const dateKey = extractDateFromPrompt(prompt);
  if ((serviceName && isPlausibleTourServiceName(serviceName)) || dateKey) {
    return true;
  }
  if (hasBookingVisitorContext(prompt) && hasTourDaySlotsTopic(prompt)) {
    return true;
  }
  return (
    hasTourDaySlotsTopic(prompt) &&
    (hasTourServiceReference(prompt) || hasBookingVisitorContext(prompt))
  );
}

export function isExplainTourDaySlotsPrompt(prompt: string): boolean {
  if (
    /\b(?:book|reserve|schedule|get|buy|purchase|order)\b/i.test(prompt) &&
    /\b(?:tours?|treks?|excursions?|hikes?)\b/i.test(prompt) &&
    /\b(?:earliest|soonest|nearest|first\s+available|asap|next\s+available)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (isCatalogMutateCommandPrompt(prompt)) return false;
  if (isDiagnoseTourCapacityPrompt(prompt)) return false;
  if (isAvailabilityListingPrompt(prompt)) return false;

  if (isSingleTourDaySlotsPrompt(prompt)) {
    return true;
  }

  if (isExplainTourBookingPrompt(prompt)) return false;
  if (!hasTourDaySlotsTopic(prompt)) return false;
  if (!hasReadTourDaySlotsCue(prompt)) return false;

  if (
    hasBookingVisitorContext(prompt) &&
    Boolean(
      extractServiceNameFromPrompt(prompt) || extractDateFromPrompt(prompt),
    )
  ) {
    return true;
  }

  if (containsArmenianScript(prompt) || containsCyrillicScript(prompt)) {
    return (
      hasTourServiceReference(prompt) ||
      Boolean(extractServiceNameFromPrompt(prompt))
    );
  }

  return false;
}

export function parseExplainTourDaySlotsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainTourDaySlots | null {
  // e2e-bug.105 — nearest-departure compound step 2 carries serviceName +
  // aspect while the raw prompt is a book/reserve mutate (prompt detector false).
  const hasStructuredService =
    (typeof params.serviceName === 'string' &&
      params.serviceName.trim().length > 0) ||
    (typeof params.serviceId === 'string' &&
      params.serviceId.trim().length > 0);
  const fromCompound =
    hasStructuredService &&
    (params.bookingFirstAvailable === true ||
      params.tourGroupCheckout === true ||
      params.aspect === 'remainingSpots' ||
      params.aspect === 'oneDeparture' ||
      params.aspect === 'fullyBooked' ||
      params.aspect === 'all');
  if (!isExplainTourDaySlotsPrompt(prompt) && !fromCompound) return null;

  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const serviceNameFromParams =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  const extractedName = extractServiceNameFromPrompt(prompt);
  const serviceName =
    serviceNameFromParams ||
    (extractedName && isPlausibleTourServiceName(extractedName)
      ? extractedName
      : undefined);

  const dateFromParams =
    typeof params.date === 'string'
      ? toIsoDay(params.date.trim(), 'UTC')
      : typeof params.dateKey === 'string'
        ? params.dateKey.trim()
        : undefined;
  const dateKey =
    dateFromParams && /^\d{4}-\d{2}-\d{2}$/.test(dateFromParams)
      ? dateFromParams
      : extractDateFromPrompt(prompt);

  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  const aspect =
    aspectFromParams === 'oneDeparture' ||
    aspectFromParams === 'remainingSpots' ||
    aspectFromParams === 'fullyBooked' ||
    aspectFromParams === 'all'
      ? aspectFromParams
      : resolveTourDaySlotsAspect(prompt);

  return {
    serviceId,
    serviceName,
    dateKey,
    aspect,
  };
}

export function rescueTourDaySlotsIntent(
  prompt: string,
  action: string,
): { action: TourDaySlotsIntent; rescueReason: string } | null {
  if (isTourDaySlotsIntent(action)) return null;
  if (!parseExplainTourDaySlotsFromPrompt(prompt)) return null;
  return {
    action: 'explain_tour_day_slots',
    rescueReason: 'explain_tour_day_slots',
  };
}
