import { isExplainCheckoutCurrencyPrompt } from './ai-checkout-currency.util.js';
import { isExplainStripeCheckoutCurrencyPrompt } from './ai-stripe-checkout-currency.util.js';
import { hasPackageOrGiftCardContext } from './ai-package-currency.util.js';
import { isDiagnoseTourCapacityPrompt } from './ai-tour-capacity.util.js';
export const TOUR_BOOKING_INTENTS = ['explain_tour_booking'] as const;

export type TourBookingIntent = (typeof TOUR_BOOKING_INTENTS)[number];

export type TourBookingAspect = 'groupSize' | 'pricing' | 'duration' | 'all';

export interface ParsedExplainTourBooking {
  serviceName?: string;
  serviceId?: string;
  aspect: TourBookingAspect;
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasReadTourBookingCue(prompt: string): boolean {
  return (
    /\b(what|which|how|why|does|do|is|are|can|tell|explain|show|max|maximum)\b/i.test(
      prompt,
    ) ||
    /\?\s*$/.test(prompt.trim()) ||
    /(ինչ|որ|որքան|քանի|բացատր|ցույց|մասնակց|կարող|ցուցադրվում|համար\s+է)/i.test(
      prompt,
    ) ||
    /(какой|какая|какие|сколько|почему|объясни|можно|указан|максимум)/i.test(
      prompt,
    )
  );
}

function hasBookingVisitorContext(prompt: string): boolean {
  return (
    /\b(booking\s+page|online\s+booking|public\s+booking|mobile\s+booking|consumer\s+booking|this\s+page|on\s+this\s+page|here|catalog|when\s+(?:i\s+)?book|book(?:ing)?\s+(?:this|a)\s+tour|consumer\s+app|in\s+the\s+app)\b/i.test(
      prompt,
    ) ||
    /(գրանցման\s+էջ|այս\s+էջ|կայք|գրանցել|ցուցադր)/i.test(prompt) ||
    /(?:на\s+)?(?:страниц[еаы]|сайт[еа])\s+записи/i.test(prompt) ||
    /\bздесь\b/i.test(prompt) ||
    /забронировать|указан/i.test(prompt)
  );
}

function hasTourBookingTopic(prompt: string): boolean {
  return (
    /\b(max\s+group|group\s+(?:size|cap|limit)|max\s+pax|how\s+many\s+(?:people|guests|pax)|per[-\s]?person|price\s+per|per\s+person|priced\s+per|multi[-\s]?day)\b/i.test(
      prompt,
    ) ||
    /\b(duration|how\s+long|how\s+many\s+days?|day\s+tour|\d+\s*day)\b/i.test(
      prompt,
    ) ||
    /длится/i.test(prompt) ||
    /(առավելագույն\s+խումբ|մարդ|հոգի|անձ|տևողություն|օր(?:եր|վա)?|ժամ)/i.test(
      prompt,
    ) ||
    /(размер\s+групп|человек|персон|длительность|сколько\s+дней|дн(?:я|ей)|за\s+человек)/i.test(
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

function isGenericCatalogListingPrompt(prompt: string): boolean {
  return (
    (/\b(list|show\s+all|what\s+services|all\s+(?:tour\s+)?services|prices?\s+and\s+durations?)\b/i.test(
      prompt,
    ) ||
      /\b(?:what|which)\s+(?:tour\s+)?services?\b/i.test(prompt)) &&
    !/\bfor\s+(?:the\s+)?[A-Za-z0-9]{2,}/i.test(prompt)
  );
}

function isAdminTourCatalogPrompt(prompt: string): boolean {
  return (
    /\b(?:list|show|summarize)\b.+\b(?:tour\s+services?|departures?|upcoming)\b/i.test(
      prompt,
    ) ||
    /\bcover\s+images?\b/i.test(prompt) ||
    /\b(?:our|we\s+offer)\s+tours?\b/i.test(prompt) ||
    /\bupcoming\s+tour\s+bookings?\b/i.test(prompt) ||
    /\b(?:tour\s+)?bookings?\s+with\s+pax\b/i.test(prompt)
  );
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
    const next = name.replace(/^(?:the|a|an)\s+/i, '').trim();
    if (next === name) break;
    name = next;
  }
  name = name.replace(/-ը$/i, '').replace(/-ի$/i, '').trim();
  if (/^(?:tour|trek|excursion|տուր|էքսկուրսիա|тур|экскурс)$/i.test(name)) {
    return null;
  }
  if (
    /^(?:what|which|why|how|does|show|list|our|the|a|an)$/i.test(name) ||
    /\b(what|which|why|how|does|group\s+size|duration)\b/i.test(name) ||
    name.split(/\s+/).length > 6
  ) {
    return null;
  }
  if (name.length < 2) return null;
  return prompt ? extendTourCatalogServiceName(name, prompt) : name;
}

function isDashboardTourCatalogMaxGroupPrompt(prompt: string): boolean {
  if (hasBookingVisitorContext(prompt)) return false;
  if (
    /\b(when\s+i\s+book|can\s+i|here\b|per[-\s]?person|priced\s+per)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  const dashboardMaxGroup =
    /\b(?:what\s+is\s+the\s+)?max\s+group\s+size\s+for\b/i.test(prompt) ||
    /максимальный\s+размер\s+группы\s+у(?:\s|$|[?.!,])/i.test(prompt) ||
    /առավելագույն\s+խումբ/i.test(prompt);
  if (!dashboardMaxGroup) return false;
  return !hasBookingVisitorContext(prompt);
}

function extractServiceNameFromPrompt(prompt: string): string | null {
  const patterns = [
    /\bmax\s+group\s+(?:size\s+)?for\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)(?:\s+on\b|\s+—|\?|$)/i,
    /\b(?:for|on)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+tour\b/i,
    /\bhow\s+(?:long|many\s+days?)\s+(?:is|does)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+tour\b/i,
    /\bhow\s+long\s+is\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+hike\b/i,
    /\b(?:does|is)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+tour\b/i,
    /\bhow\s+many\s+people\s+can\s+book\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+Tour\b/i,
    /\bhow\s+many\s+people\s+can\s+book\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)(?:\s+Tour)?\s*\?/i,
    /\bhow\s+(?:long|many\s+days?)\s+(?:is|does|can)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)(?:\s+tour)?\b/i,
    /\bhow\s+many\s+people\s+(?:is|does|can)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)(?:\s+tour)?\b/i,
    /\b(?:is|does)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+(?:priced\s+per|a\s+multi[-\s]?day|show)\b/i,
    /\bper[-\s]?person\s+price\s+(?:for|of)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+)\b/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+priced\s+per\s+person\b/i,
    /\bprice\s+for\s+([A-Za-z0-9][\w\s&'-]+)\s+when\s+i\s+book\b/i,
    /\btell\s+me\s+(?:the\s+)?[\w\s]*\s+for\s+([A-Za-z0-9][\w\s&'-]+)\s+on\s+online\s+booking\b/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+tour\b/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)(?:-ը)(?:\s|$|[?.!,])/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)(?:-ը)\s+քանի/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)-ի\s+(?:գին|տևողություն)/i,
    /группе\s+([A-Za-z0-9][\w\s&'-]+?)\s*\?/i,
    /длится\s+([A-Za-z0-9][\w\s&'-]+?)\s*\?/i,
    /([A-Za-z0-9][\w\s&'-]+?)\s+указан\s+за\s+человек/i,
    /(?:у|для)\s+([A-Za-z0-9][\w\s&'-]+?)\s+(?:на\s+страниц|указан)/i,
    /(?:у|для)\s+([A-Za-z0-9][\w\s&'-]+?)\s+на\s+страниц/i,
    /([A-Za-z0-9][\w\s&'-]+?)\s+տուր/i,
    /\bfor\s+([A-Za-z0-9][\w\s&'-]+)\s+on\s+online\s+booking\b/i,
    /\bgroup\s+cap\s+for\s+([A-Za-z0-9][\w\s&'-]+)\b/i,
    /\bmax\s+pax\s+for\s+([A-Za-z0-9][\w\s&'-]+?)\s+on\b/i,
    /\bgroup\s+limit\s+for\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+tour\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = normalizeServiceNameCandidate(match?.[1] ?? '', prompt);
    if (candidate) return candidate;
  }
  return null;
}

function resolveTourBookingAspect(prompt: string): TourBookingAspect {
  const groupSize =
    /\b(group\s+limit|max\s+pax)\b/i.test(prompt) ||
    /\b(max\s+group|group\s+(?:size|cap)|how\s+many\s+(?:people|guests|pax)|bring\s+\d+\s+people)\b/i.test(
      prompt,
    ) ||
    /(առավելագույն\s+խումբ|մարդ|հոգի|անձ(?!ի))/i.test(prompt) ||
    /(размер\s+групп|человек\s+максимум|сколько\s+человек)/i.test(prompt);
  const pricing =
    /\b(per[-\s]?person|price\s+per|per\s+person|priced\s+per|charged\s+per)\b/i.test(
      prompt,
    ) ||
    /(մեկ\s+անձ|անձի\s+համար)/i.test(prompt) ||
    /(за\s+человек|указан\s+за)/i.test(prompt);
  const duration =
    /\b(duration|how\s+long|how\s+many\s+days?|multi[-\s]?day|\d+\s*day)\b/i.test(
      prompt,
    ) ||
    /(տևողություն|օր(?:եր|վա)?|ժամ(?!անակ))/i.test(prompt) ||
    /(длительность|сколько\s+дней|дн(?:я|ей))/i.test(prompt);

  const topicCount = [groupSize, pricing, duration].filter(Boolean).length;
  if (topicCount >= 2) return 'all';
  if (groupSize) return 'groupSize';
  if (pricing) return 'pricing';
  if (duration) return 'duration';
  return 'all';
}

export function isTourBookingIntent(
  action: string,
): action is TourBookingIntent {
  return (TOUR_BOOKING_INTENTS as readonly string[]).includes(action);
}

function isSingleTourBookingDetailPrompt(prompt: string): boolean {
  if (!hasTourBookingTopic(prompt) || !hasReadTourBookingCue(prompt)) {
    return false;
  }
  if (
    isAdminTourCatalogPrompt(prompt) ||
    isGenericCatalogListingPrompt(prompt)
  ) {
    return false;
  }

  const serviceName = extractServiceNameFromPrompt(prompt);
  if (serviceName && !isDashboardTourCatalogMaxGroupPrompt(prompt)) return true;
  if (/\bthe\s+tour\b/i.test(prompt) && !serviceName) {
    return hasTourBookingTopic(prompt) && hasReadTourBookingCue(prompt);
  }
  if (
    hasBookingVisitorContext(prompt) &&
    hasTourServiceReference(prompt) &&
    serviceName
  ) {
    return true;
  }
  return (
    hasBookingVisitorContext(prompt) &&
    /\bfor\s+(?:the\s+)?[A-Za-z]/i.test(prompt)
  );
}

function isDashboardBookingRecordLikePrompt(prompt: string): boolean {
  return (
    /\b(booking\s+record|provider\s+calendar|tourstartdate|tourenddate|pax\s+count)\b/i.test(
      prompt,
    ) ||
    /(календар\w*\s+провайдер|запись\s+тура|несколько\s+дней\s+в\s+календар)/i.test(
      prompt,
    ) ||
    /(ամրագրում|տարեթվեր|հատուկ\s+պահանջ)/i.test(prompt)
  );
}

export function isExplainTourBookingPrompt(prompt: string): boolean {
  if (isExplainStripeCheckoutCurrencyPrompt(prompt)) return false;
  if (isDiagnoseTourCapacityPrompt(prompt)) return false;
  if (isDashboardTourCatalogMaxGroupPrompt(prompt)) return false;
  if (isDashboardBookingRecordLikePrompt(prompt)) return false;
  if (hasPackageOrGiftCardContext(prompt)) return false;

  if (isSingleTourBookingDetailPrompt(prompt)) {
    if (
      /\b(per[-\s]?person|per\s+person|priced\s+per)\b/i.test(prompt) ||
      /(за\s+человек|указан\s+за|անձի\s+համար|մեկ\s+անձ)/i.test(prompt)
    ) {
      return true;
    }
    return !isExplainCheckoutCurrencyPrompt(prompt);
  }

  if (isExplainCheckoutCurrencyPrompt(prompt)) return false;
  if (isAdminTourCatalogPrompt(prompt)) return false;
  if (isGenericCatalogListingPrompt(prompt)) return false;
  if (!hasTourBookingTopic(prompt)) return false;
  if (!hasReadTourBookingCue(prompt)) return false;

  if (
    hasBookingVisitorContext(prompt) &&
    Boolean(extractServiceNameFromPrompt(prompt))
  ) {
    return true;
  }

  if (containsArmenianScript(prompt) || containsCyrillicScript(prompt)) {
    if (isAdminTourCatalogPrompt(prompt)) return false;
    if (
      hasBookingVisitorContext(prompt) &&
      (hasTourServiceReference(prompt) ||
        Boolean(extractServiceNameFromPrompt(prompt)))
    ) {
      return true;
    }
    return (
      Boolean(extractServiceNameFromPrompt(prompt)) &&
      hasTourBookingTopic(prompt)
    );
  }

  return false;
}

export function parseExplainTourBookingFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainTourBooking | null {
  if (!isExplainTourBookingPrompt(prompt)) return null;

  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const serviceNameFromParams =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  const serviceName =
    serviceNameFromParams || extractServiceNameFromPrompt(prompt) || undefined;

  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  const aspect =
    aspectFromParams === 'groupSize' ||
    aspectFromParams === 'pricing' ||
    aspectFromParams === 'duration' ||
    aspectFromParams === 'all'
      ? aspectFromParams
      : resolveTourBookingAspect(prompt);

  return {
    serviceId,
    serviceName,
    aspect,
  };
}

export function rescueTourBookingIntent(
  prompt: string,
  action: string,
): { action: TourBookingIntent; rescueReason: string } | null {
  if (isTourBookingIntent(action)) return null;
  if (!parseExplainTourBookingFromPrompt(prompt)) return null;
  return {
    action: 'explain_tour_booking',
    rescueReason: 'explain_tour_booking',
  };
}
