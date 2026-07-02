import { toIsoDay } from '../../common/utils/date-format.util.js';

export const TOUR_CAPACITY_INTENTS = ['diagnose_tour_capacity'] as const;

export type TourCapacityIntent = (typeof TOUR_CAPACITY_INTENTS)[number];

export type TourCapacityAspect =
  | 'maxGroup'
  | 'fullyBooked'
  | 'insufficientSpots'
  | 'clampedPax'
  | 'all';

export interface ParsedDiagnoseTourCapacity {
  serviceName?: string;
  serviceId?: string;
  dateKey?: string;
  requestedPax?: number;
  aspect: TourCapacityAspect;
}

function hasCheckoutRejectionCue(prompt: string): boolean {
  return (
    /\b(reject(?:ed|ion)?|won'?t\s+accept|can(?:not|'t)\s+(?:\w+\s+)?book|cannot\s+book|failed?\s+to\s+book|booking\s+fail|checkout\s+fail|error|doesn'?t\s+let|wouldn'?t\s+let|not\s+accept)\b/i.test(
      prompt,
    ) ||
    /\b(only\s+\d+\s+spots?\s+remaining|fully\s+booked|this\s+tour\s+date\s+is\s+fully\s+booked)\b/i.test(
      prompt,
    ) ||
    /\b(clamp(?:ed)?|reduced?)\b.{0,30}\b(pax|people|guests?|count)\b/i.test(
      prompt,
    ) ||
    /\b(pax|people|guests?).{0,20}\b(reduced?|clamp(?:ed)?)\b/i.test(prompt) ||
    /\b(diagnose|troubleshoot)\b.{0,40}\b(capacity|checkout|pax)\b/i.test(
      prompt,
    ) ||
    /\bexplain\b.{0,40}\b(capacity|rejected|rejection)\b/i.test(prompt) ||
    /\bnot\s+enough\s+seats?\b/i.test(prompt) ||
    /\bcheckout\s+says\b/i.test(prompt) ||
    /\bbooking\s+failed?\b/i.test(prompt) ||
    /(մերժեց|checkout-?ը\s+մերժեց|չի\s+ընդունում|նվազեցրեց)/i.test(prompt) ||
    /(отклонил|не\s+принимает|checkout\s+отклон|уменьшил)/i.test(prompt)
  );
}

function hasTourCapacityTopic(prompt: string): boolean {
  return (
    /\b(pax|people|guests?|group\s+size|spots?\s+remaining|remaining\s+spots?|capacity|max\s+group|seats?)\b/i.test(
      prompt,
    ) ||
    /\b(checkout|booking\s+page)\b/i.test(prompt) ||
    /(հոգի|տեղ|խումբ|checkout)/i.test(prompt) ||
    /(checkout|pax|отклон|мест\s+осталось|не\s+приним)/i.test(prompt)
  );
}

function isEducationalDaySlotsOnlyPrompt(prompt: string): boolean {
  if (!hasCheckoutRejectionCue(prompt)) {
    return (
      /\b(what\s+does\s+remaining\s+spots?\s+mean|one\s+departure\s+per\s+day|day[-\s]?level)\b/i.test(
        prompt,
      ) && !/\b(reject|error|won'?t|can'?t)\b/i.test(prompt)
    );
  }
  return false;
}

export function extractTourPaxCountFromPrompt(
  prompt: string,
): number | undefined {
  const patterns = [
    /\b(\d{1,2})\s+(?:people|guests?|pax|persons?|travelers?|հոգի|человек|чел\.?)\b/i,
    /(?:отклонил|մերժեց)\s+(\d{1,2})\s+(?:հոգի|человек)/i,
    /\b(?:for|book|accept|reject(?:ed)?)\s+(\d{1,2})\s+(?:people|pax)\b/i,
    /\bgroup\s+size\s+of\s+(\d{1,2})\b/i,
    /\b(\d{1,2})\s+pax\b/i,
    /\bclamp(?:ed)?\s+(?:my\s+)?pax\s+to\s+(\d{1,2})\b/i,
    /\bbook\s+(\d{1,2})\s+pax\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const value = Number(match?.[1]);
    if (Number.isFinite(value) && value > 0) return Math.floor(value);
  }
  return undefined;
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

function normalizeServiceNameCandidate(
  candidate: string,
  prompt?: string,
): string | null {
  let name = candidate.trim();
  for (let i = 0; i < 4; i += 1) {
    const next = name.replace(/^(?:the|a|an|my)\s+/i, '').trim();
    if (next === name) break;
    name = next;
  }
  name = name.trim();
  if (
    /^(checkout|booking|pax|people|group|capacity|reject)$/i.test(name) ||
    name.length < 2
  ) {
    return null;
  }
  if (prompt) {
    name = extendTourCatalogServiceName(name, prompt);
  }
  return name;
}

function extractServiceNameFromPrompt(prompt: string): string | null {
  const patterns = [
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+on\s+(?:\d{1,2}\/|\d{4}-)/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+on\s+\d/i,
    /\bfor\s+([A-Za-z0-9][\w\s&'-]+?)\s*—/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+at\s+checkout\b/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s*[\?\.]?\s*$/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+(?:tour|trek)\b/i,
    /(?:на|для)\s+([A-Za-z0-9][\w\s&'-]+?)\s+(?:\d|15)/i,
    /([A-Za-z0-9][\w\s&'-]+?)-ի\s+համար/i,
    /\b(mountain\s+trek|city\s+tour|3-day\s+mountain\s+trek)\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = normalizeServiceNameCandidate(
      match?.[1] ?? match?.[0] ?? '',
      prompt,
    );
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

  return undefined;
}

function resolveTourCapacityAspect(prompt: string): TourCapacityAspect {
  const clamped =
    /\b(clamp(?:ed)?|reduced?)\b/i.test(prompt) ||
    (/\bwon'?t\s+accept\b/i.test(prompt) && /\b\d+\s+pax\b/i.test(prompt)) ||
    /\bclamp.{0,24}\bpax\b/i.test(prompt);
  const fullyBooked =
    /\b(fully\s+booked|this\s+tour\s+date\s+is\s+fully\s+booked|tour\s+date\s+full|date\s+full)\b/i.test(
      prompt,
    );
  const insufficient =
    /\b(not\s+enough\s+seats?|only\s+\d+\s+spots?\s+remaining|spots?\s+remaining|can'?t\s+book\s+\d+\s+pax)\b/i.test(
      prompt,
    ) || /\breject(?:ed)?\s+\d+\s+(?:people|pax)\b/i.test(prompt);
  const maxGroup =
    /\b(max\s+group|group\s+size\s+of)\b/i.test(prompt) ||
    (/\b(reject(?:ed)?|won'?t\s+accept)\b/i.test(prompt) &&
      /\b(group\s+size|capacity)\b/i.test(prompt));

  const count = [clamped, fullyBooked, insufficient, maxGroup].filter(
    Boolean,
  ).length;
  if (count >= 2) return 'all';
  if (fullyBooked) return 'fullyBooked';
  if (insufficient) return 'insufficientSpots';
  if (clamped) return 'clampedPax';
  if (maxGroup) return 'maxGroup';
  return 'all';
}

export function isTourCapacityIntent(
  action: string,
): action is TourCapacityIntent {
  return (TOUR_CAPACITY_INTENTS as readonly string[]).includes(action);
}

function hasProactiveTourCapacityCheckCue(prompt: string): boolean {
  return (
    /\b(?:book|reserve)\s+if\s+(?:enough|there\s+are\s+enough)\s+(?:seats?|spots?)\b/i.test(
      prompt,
    ) ||
    /\b(?:only\s+)?if\s+(?:enough|there\s+are\s+enough)\s+(?:seats?|spots?)\b/i.test(
      prompt,
    ) ||
    /\bwhen\s+(?:seats?|spots?)\s+(?:are\s+)?available\b/i.test(prompt) ||
    /\bif\s+capacity\s+allows?\b/i.test(prompt) ||
    /\bwhen\s+capacity\s+allows?\b/i.test(prompt) ||
    /(?:եթե|միայն\s+եթե).{0,20}(?:տեղ|բավական)/i.test(prompt) ||
    /(?:если|только\s+если).{0,20}(?:мест|хватит)/i.test(prompt)
  );
}

function hasProactiveTourBookingTopic(prompt: string): boolean {
  return (
    /\b(?:tours?|treks?|excursions?|hikes?)\b/i.test(prompt) ||
    /(?:տուր|էքսկուրս)/i.test(prompt) ||
    /(?:тур|экскурс)/i.test(prompt)
  );
}

export function isProactiveTourCapacityCheckPrompt(prompt: string): boolean {
  if (!hasProactiveTourCapacityCheckCue(prompt)) return false;
  if (!hasProactiveTourBookingTopic(prompt)) return false;
  if (extractTourPaxCountFromPrompt(prompt) == null) return false;
  return true;
}

export function isDiagnoseTourCapacityPrompt(prompt: string): boolean {
  if (isEducationalDaySlotsOnlyPrompt(prompt)) return false;
  if (isProactiveTourCapacityCheckPrompt(prompt)) return false;
  if (!hasCheckoutRejectionCue(prompt)) return false;
  if (!hasTourCapacityTopic(prompt)) return false;
  return true;
}

export function parseProactiveTourCapacityFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedDiagnoseTourCapacity | null {
  const fromCompound = params.tourGroupCheckout === true;
  if (!isProactiveTourCapacityCheckPrompt(prompt) && !fromCompound) return null;

  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const serviceNameFromParams =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  const serviceName =
    serviceNameFromParams || extractServiceNameFromPrompt(prompt) || undefined;

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

  const requestedPaxFromParams =
    typeof params.requestedPax === 'number'
      ? params.requestedPax
      : typeof params.requestedPax === 'string'
        ? Number(params.requestedPax)
        : typeof params.paxCount === 'number'
          ? params.paxCount
          : undefined;
  const requestedPax =
    Number.isFinite(requestedPaxFromParams) && requestedPaxFromParams! > 0
      ? Math.floor(requestedPaxFromParams!)
      : extractTourPaxCountFromPrompt(prompt);

  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  const aspect =
    aspectFromParams === 'maxGroup' ||
    aspectFromParams === 'fullyBooked' ||
    aspectFromParams === 'insufficientSpots' ||
    aspectFromParams === 'clampedPax' ||
    aspectFromParams === 'all'
      ? aspectFromParams
      : 'all';

  if (!serviceName && !serviceId && requestedPax == null) return null;

  return {
    serviceId,
    serviceName,
    dateKey,
    requestedPax,
    aspect,
  };
}

export function parseDiagnoseTourCapacityFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedDiagnoseTourCapacity | null {
  if (!isDiagnoseTourCapacityPrompt(prompt)) return null;

  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const serviceNameFromParams =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  const serviceName =
    serviceNameFromParams || extractServiceNameFromPrompt(prompt) || undefined;

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

  const requestedPaxFromParams =
    typeof params.requestedPax === 'number'
      ? params.requestedPax
      : typeof params.requestedPax === 'string'
        ? Number(params.requestedPax)
        : typeof params.paxCount === 'number'
          ? params.paxCount
          : undefined;
  const requestedPax =
    Number.isFinite(requestedPaxFromParams) && requestedPaxFromParams! > 0
      ? Math.floor(requestedPaxFromParams!)
      : extractTourPaxCountFromPrompt(prompt);

  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  const aspect =
    aspectFromParams === 'maxGroup' ||
    aspectFromParams === 'fullyBooked' ||
    aspectFromParams === 'insufficientSpots' ||
    aspectFromParams === 'clampedPax' ||
    aspectFromParams === 'all'
      ? aspectFromParams
      : resolveTourCapacityAspect(prompt);

  return {
    serviceId,
    serviceName,
    dateKey,
    requestedPax,
    aspect,
  };
}

export function rescueDiagnoseTourCapacityIntent(
  prompt: string,
  action: string,
): { action: TourCapacityIntent; rescueReason: string } | null {
  if (isTourCapacityIntent(action)) return null;
  if (!parseDiagnoseTourCapacityFromPrompt(prompt)) return null;
  return {
    action: 'diagnose_tour_capacity',
    rescueReason: 'diagnose_tour_capacity',
  };
}
