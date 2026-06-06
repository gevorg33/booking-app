import { isExplainTourBookingRecordPrompt } from './ai-tour-booking-record.util.js';

export const TOUR_CALENDAR_SPAN_INTENTS = [
  'explain_tour_calendar_span',
] as const;

export type TourCalendarSpanIntent =
  (typeof TOUR_CALENDAR_SPAN_INTENTS)[number];

export type TourCalendarSpanAspect =
  | 'multiDaySpan'
  | 'serviceColors'
  | 'clippedWeek'
  | 'stackedDepartures'
  | 'all';

export interface ParsedExplainTourCalendarSpan {
  serviceName?: string;
  serviceId?: string;
  weekStartDate?: string;
  aspect: TourCalendarSpanAspect;
}

function hasDashboardReadCue(prompt: string): boolean {
  return (
    /\b(what|which|how|why|explain|show|tell|mean|display|render)\b/i.test(
      prompt,
    ) ||
    /\?\s*$/.test(prompt.trim()) ||
    /(ինչ|որ|որքան|բացատր|ցույց|ինչու)/i.test(prompt) ||
    /(как|какой|какая|почему|объясни|покажи)/i.test(prompt)
  );
}

function isCalendarWeekListPrompt(prompt: string): boolean {
  const en =
    (/\b(?:this\s+)?calendar\s+week\b/i.test(prompt) ||
      /\b(this|current)\s+week\b/i.test(prompt) ||
      /\bprovider\s+calendar\s+week\b/i.test(prompt)) &&
    /\b(list|show|summarize|which|what)\b/i.test(prompt) &&
    /\b(tour\s+departures?|tour\s+bookings?|tours?\s+(?:are\s+)?(?:on|visible|departing))\b/i.test(
      prompt,
    );

  const hy =
    /(այս\s+շաբաթ|օրացույցային\s+շաբաթ|\d{4}-\d{2}-\d{2}\s+շաբաթ|պրովայդերի\s+օրացույցում\s+այս\s+շաբաթ)/i.test(
      prompt,
    ) &&
    /(էքսկուրսիա|տուր|մեկնում)/i.test(prompt) &&
    /(ցուցադրիր|ցուցադրի|(?:^|\s)որ\s+(էքսկուրսիա|տուրեր))/i.test(prompt);

  const ru =
    /(на\s+этой\s+(?:календарн[а-яё]*\s+)?недел|календарн[а-яё]*\s+недел|недел[а-яё]*\s+\d{4}-\d{2}-\d{2})/i.test(
      prompt,
    ) &&
    /(тур|экскурс|выезд)/i.test(prompt) &&
    /(покажи|список|какие|какой)/i.test(prompt);

  return en || hy || ru;
}

function isCatalogOrDeparturesPrompt(prompt: string): boolean {
  if (isCalendarWeekListPrompt(prompt)) return true;
  return (
    /\b(list|summarize)\b.{0,40}\b(upcoming\s+)?(tour\s+)?departures?\b/i.test(
      prompt,
    ) ||
    /\b(remaining\s+capacity|seats?\s+left|spots?\s+remaining)\b/i.test(
      prompt,
    ) ||
    /\b(explain\s+our\s+tour\s+services?|tour\s+catalog|cover\s+images?)\b/i.test(
      prompt,
    )
  );
}

function isSingleBookingRecordPrompt(prompt: string): boolean {
  return (
    /\b(this|that)\s+(?:tour\s+)?booking\b/i.test(prompt) ||
    /\bfor\s+(?:booking|appointment)\b/i.test(prompt) ||
    /\bbk-[a-z0-9-]+\b/i.test(prompt) ||
    /\bbooking\s*#?\s*[a-z0-9-]{4,}\b/i.test(prompt) ||
    /\b(pax\s+count|special\s+requirements?|tourstartdate|tourenddate|tour\s+metadata|booking\s+record)\b/i.test(
      prompt,
    ) ||
    /(?:это|эта|этот)\s+(?:\w+\s+){0,3}бронирован/i.test(prompt) ||
    /(ամրագրում|pax-ով|տարեթվեր)/i.test(prompt)
  );
}

function hasCalendarSpanTopic(prompt: string): boolean {
  return (
    /\b(tour\s+calendar\s+span|calendar\s+span|provider\s+calendar)\b/i.test(
      prompt,
    ) ||
    /\b(service\s+colou?rs?|color\s+(?:per|for)\s+(?:each\s+)?(?:tour\s+)?service)\b/i.test(
      prompt,
    ) ||
    /\b(clipped?\s+(?:week|boundary)|week\s+boundar(?:y|ies)|visible\s+week)\b/i.test(
      prompt,
    ) ||
    /\b(stacked?\s+(?:departure\s+)?lanes?|stacked?\s+(?:departures?|tours?|rows?)|separate\s+lanes?)\b/i.test(
      prompt,
    ) ||
    /\b(multi[-\s]?day\s+(?:tour\s+)?(?:span|booking|display)|span(?:s)?\s+across\s+(?:multiple\s+)?days)\b/i.test(
      prompt,
    ) ||
    /\b(?:tour|trek)\s+spans?\s+(?:show|on|across)\b/i.test(prompt) ||
    /\beach\s+tour\s+service\b.{0,40}\b(?:different\s+)?colou?r\b/i.test(
      prompt,
    ) ||
    /\bdifferent\s+colou?r\b.{0,40}\bcalendar\b/i.test(prompt) ||
    /\b(vert-tour-1\.10|tour\s+span\s+rendering)\b/i.test(prompt) ||
    /\b(provider\s+calendar|dashboard\s+calendar)\b.{0,60}\b(span|color|lane|clip|multi[-\s]?day|display)\b/i.test(
      prompt,
    ) ||
    /\b(span|color|lane|clip|multi[-\s]?day)\b.{0,60}\b(provider\s+calendar|tour\s+calendar|dashboard\s+calendar)\b/i.test(
      prompt,
    ) ||
    /(կուտակված\s+տող|մի\s+քանի\s+օր.{0,40}օրացույց|տարբեր\s+գույն|կտրվում\s+շաբաթ|span-|պրովայդերի\s+օրացույց.{0,30}(span|կուտակ|գույն|մի\s+քանի))/i.test(
      prompt,
    ) ||
    /(календар[а-яё]*\s+провайдер|цвет[а-яё]*\s+на\s+календар|полос[а-яё]*\s+на\s+календар|отдельные\s+полос|ряд[а-яё]*\s+на\s+календар|обрезан[а-яё]*\s+недел|несколько\s+дней.{0,40}календар|обрезается.{0,40}недел|span\s+(?:3[-\s]?day\s+)?(?:mountain\s+trek|тур))/i.test(
      prompt,
    )
  );
}

function extractServiceNameFromPrompt(prompt: string): string | null {
  const forbidden =
    /^(explain|show|what|how|why|tell|list|summarize)\b/i;
  const patterns = [
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+(?:tour|trek)\s+spans?\b/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+(?:tour|trek)\s+spans?\b/i,
    /\b(?:3-day\s+mountain\s+trek|mountain\s+trek|city\s+tour|heritage\s+tour)\b/i,
    /\b(3-Day Mountain Trek)-ի\s+span/i,
    /\bspan\s+(3-Day Mountain Trek)\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = (match?.[1] ?? match?.[0] ?? '').trim();
    if (candidate.length >= 2 && !forbidden.test(candidate)) {
      return candidate.replace(/\s+spans?$/i, '').trim();
    }
  }
  return null;
}

function extractWeekStartDate(prompt: string): string | undefined {
  const iso =
    prompt.match(/\b(20\d{2}-\d{2}-\d{2})\b/) ??
    prompt.match(/\bweek\s+(?:of\s+|starting\s+)?(20\d{2}-\d{2}-\d{2})\b/i);
  return iso?.[1];
}

function resolveCalendarSpanAspect(prompt: string): TourCalendarSpanAspect {
  if (
    /\b(vert-tour-1\.10|tour\s+span\s+rendering)\b/i.test(prompt) ||
    /բացատրիր\s+ինչպես\s+է\s+պրովայդերի\s+օրացույցը\s+ցույց\s+տալիս/i.test(
      prompt,
    ) ||
    /объясни\s+как\s+календар[а-яё]*/i.test(prompt)
  ) {
    return 'all';
  }

  if (
    /\b(3[-\s]?day\s+mountain\s+trek|mountain\s+trek).{0,30}\bspan/i.test(
      prompt,
    ) ||
    /\bspan.{0,30}\b(3[-\s]?day\s+mountain\s+trek)\b/i.test(prompt) ||
    /(3-Day Mountain Trek)-ի\s+span/i.test(prompt)
  ) {
    return 'multiDaySpan';
  }

  const multiDay =
    /\b(multi[-\s]?day|across\s+(?:multiple\s+)?days|span(?:s)?\s+(?:across|on|show)|tour\s+spans?)\b/i.test(
      prompt,
    ) || /(մի քանի\s+օր|несколько\s+дней)/i.test(prompt);
  const colors =
    /\b(service\s+colou?rs?|color\s+(?:per|for)\s+service|different\s+color)\b/i.test(
      prompt,
    ) ||
    /(տարբեր\s+գույն|օրացույց[ա-ֆ]*\s+գույն|գույն[ա-ֆ]*\s+օրացույց)/i.test(prompt) ||
    /(свой\s+цвет|цвет[а-яё]*\s+на\s+календар|календар[а-яё]*\s+цвет)/i.test(prompt);
  const clipped =
    /\b(clipped?\s+(?:week|boundary)|week\s+boundar(?:y|ies)|visible\s+week|only\s+show\s+the\s+visible\s+week|7-day\s+tour)\b/i.test(
      prompt,
    ) ||
    /(կտրվում\s+շաբաթ|շաբաթվա\s+սահման)/i.test(prompt) ||
    /(обрезается|обрезан|границ[а-яё]*\s+недел)/i.test(prompt);
  const stacked =
    /\b(stacked?\s+(?:departure\s+)?lanes?|stacked?\s+(?:departures?|tours?|rows?)|separate\s+lanes?|same\s+day\s+stack)\b/i.test(
      prompt,
    ) ||
    /(կուտակված\s+տող|կուտակված)/i.test(prompt) ||
    /(полос|отдельные\s+полос)/i.test(prompt);

  if (stacked) return 'stackedDepartures';
  if (clipped) return 'clippedWeek';
  if (colors) return 'serviceColors';
  if (multiDay) return 'multiDaySpan';
  return 'all';
}

export function isTourCalendarSpanIntent(
  action: string,
): action is TourCalendarSpanIntent {
  return (TOUR_CALENDAR_SPAN_INTENTS as readonly string[]).includes(action);
}

export function isExplainTourCalendarSpanPrompt(prompt: string): boolean {
  if (isExplainTourBookingRecordPrompt(prompt)) return false;
  if (isCatalogOrDeparturesPrompt(prompt)) return false;
  if (isSingleBookingRecordPrompt(prompt)) return false;
  if (!hasCalendarSpanTopic(prompt)) return false;
  return hasDashboardReadCue(prompt);
}

export function parseExplainTourCalendarSpanFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainTourCalendarSpan | null {
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
  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;

  const hasParams =
    Boolean(serviceIdFromParams) ||
    Boolean(serviceNameFromParams) ||
    Boolean(weekStartFromParams) ||
    aspectFromParams === 'multiDaySpan' ||
    aspectFromParams === 'serviceColors' ||
    aspectFromParams === 'clippedWeek' ||
    aspectFromParams === 'stackedDepartures' ||
    aspectFromParams === 'all';

  if (!isExplainTourCalendarSpanPrompt(prompt) && !hasParams) {
    return null;
  }

  const serviceName =
    serviceNameFromParams || extractServiceNameFromPrompt(prompt) || undefined;
  const weekStartDate =
    weekStartFromParams || extractWeekStartDate(prompt) || undefined;
  const aspect =
    aspectFromParams === 'multiDaySpan' ||
    aspectFromParams === 'serviceColors' ||
    aspectFromParams === 'clippedWeek' ||
    aspectFromParams === 'stackedDepartures' ||
    aspectFromParams === 'all'
      ? aspectFromParams
      : resolveCalendarSpanAspect(prompt);

  return {
    serviceId: serviceIdFromParams,
    serviceName,
    weekStartDate,
    aspect,
  };
}

export function rescueExplainTourCalendarSpanIntent(
  prompt: string,
  action: string,
): { action: TourCalendarSpanIntent; rescueReason: string } | null {
  if (isTourCalendarSpanIntent(action)) return null;
  if (!parseExplainTourCalendarSpanFromPrompt(prompt)) return null;
  return {
    action: 'explain_tour_calendar_span',
    rescueReason: 'explain_tour_calendar_span',
  };
}
