import { EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_SCENARIOS } from './ai-tour-meeting-point-multilingual.fixtures.js';
import {
  EXPLAIN_TOUR_MEETING_POINT_PROMPTS,
  type ExplainTourMeetingPointPromptFixture,
  type TourMeetingPointAspect,
} from './ai-tour-meeting-point.fixtures.js';

export { EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-tour-meeting-point-multilingual.fixtures.js';

export const TOUR_MEETING_POINT_INTENTS = [
  'explain_tour_meeting_point',
] as const;

export type TourMeetingPointIntent =
  (typeof TOUR_MEETING_POINT_INTENTS)[number];

export interface ParsedExplainTourMeetingPoint {
  aspect: TourMeetingPointAspect;
  serviceName?: string;
  bookingId?: string;
}

const SALON_DIRECTIONS_BLOCK = new RegExp(
  String.raw`\b(?:directions?\s+to\s+(?:the\s+)?salon|navigate\s+to\s+(?:the\s+)?salon|google\s+maps\s+directions?|where\s+do\s+i\s+park(?:\s+at\s+the\s+salon)?)\b|ուղղություն.*սրահ|как\s+добраться\s+до\s+салон`,
  'iu',
);

const TOUR_TOPIC = new RegExp(
  String.raw`\b(?:tours?|treks?|excursions?|hikes?|group\s+tour)\b|(?:տուր|էքսկուրս)|(?:тур|экскурс)`,
  'iu',
);

const MY_TOUR_BOOKING = new RegExp(
  String.raw`\b(?:my|our)\s+(?:group\s+)?(?:tour|trek|excursion|hike)\b|\b(?:for|to)\s+my\s+(?:group\s+)?(?:tour|trek|booking)\b|իմ\s+տուր|мо(?:его|ем|й)\s+тур`,
  'iu',
);

const BOOKING_VISITOR_CONTEXT = new RegExp(
  String.raw`\b(?:booking\s+page|on\s+this\s+page|this\s+page|online\s+booking|when\s+i\s+book|in\s+the\s+app|consumer\s+app|here)\b|գրանցման\s+էջ|այս\s+էջ|страниц[аеы]\s+записи|здесь`,
  'iu',
);

const MEETING_TOPIC = new RegExp(
  String.raw`\b(?:where\s+do\s+we\s+meet|meeting\s+point|pickup\s+(?:point|location)|where\s+should\s+i\s+arrive|where\s+is\s+the\s+(?:meeting|pickup))\b|(?:որտեղ.*հանդիպ|հանդիպման\s+կետ)|(?:где.*встреч|точк.*встреч|место\s+сбора)`,
  'iu',
);

const ARRIVAL_TOPIC = new RegExp(
  String.raw`\b(?:what\s+time\s+should\s+i\s+arrive|when\s+should\s+i\s+arrive|what\s+time\s+do\s+i\s+need\s+to\s+arrive|what\s+time\s+do\s+i\s+need\s+to\s+be\s+there|when\s+do\s+we\s+leave(?:\s+for|\?)|arrival\s+time)\b|(?:ժամը\s+քանի|պետք\s+է\s+հասնեմ)|(?:во\s+сколько\s+приех|когда\s+приех|время\s+отправ)`,
  'iu',
);

const CLINIC_PREP_BLOCK = new RegExp(
  String.raw`\b(?:do i need to fast|should i fast|what\s+should\s+i\s+bring|prep(?:aration)?\s+notes?|fasting)\b|ծոմավոր|голод|что\s+взять`,
  'iu',
);

function matchExplainTourMeetingPointScenario(
  prompt: string,
): ExplainTourMeetingPointPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_TOUR_MEETING_POINT_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function extendTourCatalogServiceName(name: string, prompt: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const catalogTour = prompt.match(
    new RegExp(`\\b${escaped}(?:\\s+[A-Za-z0-9][\\w'&-]+)*\\s+Tour\\b`, 'i'),
  );
  if (catalogTour?.[0]) return catalogTour[0].trim();
  return name;
}

function normalizeServiceNameCandidate(
  candidate: string,
  prompt: string,
): string | null {
  const name = candidate
    .trim()
    .replace(/^(?:the|a|an|my)\s+/i, '')
    .trim();
  if (/^(?:tour|trek|excursion|hike|group)$/i.test(name)) return null;
  if (name.length < 2) return null;
  return extendTourCatalogServiceName(name, prompt);
}

export function extractTourServiceNameFromMeetingPrompt(
  prompt: string,
): string | undefined {
  const scenario = matchExplainTourMeetingPointScenario(prompt);
  if (scenario?.serviceName) return scenario.serviceName;

  const patterns = [
    /\b(?:for|on)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+tour\b/i,
    /\b(?:for|on)\s+(?:my\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+(?:trek|hike|excursion)\b/i,
    /\bmeeting\s+point\s+for\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+tour\b/i,
    /\b(?:pickup|arrive).{0,20}(?:for|on)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\b/i,
    /\b(?:leave|depart)\s+for\s+(?:the\s+)?(\d[\w-]*(?:\s+[A-Za-z0-9][\w&'-]+)*)\b/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+tour\b/i,
    /([A-Za-z0-9][\w\s&'-]+?)\s+տուր/i,
    /(?:для|на)\s+([A-Za-z0-9][\w\s&'-]+?)\s+тур/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = normalizeServiceNameCandidate(match?.[1] ?? '', prompt);
    if (candidate) return candidate;
  }

  return undefined;
}

export function inferTourMeetingPointAspect(
  prompt: string,
): TourMeetingPointAspect {
  const meeting = MEETING_TOPIC.test(prompt);
  const arrival = ARRIVAL_TOPIC.test(prompt);
  if (meeting && arrival) return 'all';
  if (arrival) return 'arrival_time';
  if (meeting) return 'meeting_point';
  return 'all';
}

function hasTourMeetingPointTopic(prompt: string): boolean {
  return MEETING_TOPIC.test(prompt) || ARRIVAL_TOPIC.test(prompt);
}

function hasTourMeetingPointContext(prompt: string): boolean {
  if (
    /\b(?:which|what\s+tour\s+services?|list|show\s+our|explain\s+our)\b/i.test(
      prompt,
    ) &&
    /\b(?:tour\s+services?|catalog|configured)\b/i.test(prompt)
  ) {
    return false;
  }
  if (/\b(?:set|configure|update)\s+meeting\s+point\b/i.test(prompt)) {
    return false;
  }
  if (/փոխ|измени/iu.test(prompt) && hasTourMeetingPointTopic(prompt)) {
    return false;
  }
  return (
    MY_TOUR_BOOKING.test(prompt) ||
    (TOUR_TOPIC.test(prompt) && hasTourMeetingPointTopic(prompt)) ||
    (BOOKING_VISITOR_CONTEXT.test(prompt) &&
      (TOUR_TOPIC.test(prompt) ||
        Boolean(extractTourServiceNameFromMeetingPrompt(prompt))))
  );
}

export function isTourMeetingPointIntent(
  action: string,
): action is TourMeetingPointIntent {
  return (TOUR_MEETING_POINT_INTENTS as readonly string[]).includes(action);
}

export function isExplainTourMeetingPointPrompt(prompt: string): boolean {
  if (matchExplainTourMeetingPointScenario(prompt)) return true;
  if (SALON_DIRECTIONS_BLOCK.test(prompt)) return false;
  if (CLINIC_PREP_BLOCK.test(prompt) && !TOUR_TOPIC.test(prompt)) return false;
  if (!hasTourMeetingPointTopic(prompt)) return false;
  if (!hasTourMeetingPointContext(prompt)) return false;
  return true;
}

export function parseExplainTourMeetingPointFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainTourMeetingPoint | null {
  if (!isExplainTourMeetingPointPrompt(prompt)) return null;

  const scenario = matchExplainTourMeetingPointScenario(prompt);
  const aspectFromParams =
    typeof params.aspect === 'string' &&
    ['meeting_point', 'arrival_time', 'all'].includes(params.aspect)
      ? (params.aspect as TourMeetingPointAspect)
      : undefined;

  const bookingId =
    (params.bookingId as string | undefined) ??
    (params.sessionBookingId as string | undefined);

  const serviceName =
    scenario?.serviceName ??
    (params.serviceName as string | undefined) ??
    extractTourServiceNameFromMeetingPrompt(prompt);

  return {
    aspect:
      aspectFromParams ??
      scenario?.aspect ??
      inferTourMeetingPointAspect(prompt),
    ...(bookingId ? { bookingId } : {}),
    ...(serviceName ? { serviceName } : {}),
  };
}

export function rescueExplainTourMeetingPointIntent(
  prompt: string,
  action: string,
): { action: TourMeetingPointIntent; rescueReason: string } | null {
  if (isTourMeetingPointIntent(action)) return null;
  if (!parseExplainTourMeetingPointFromPrompt(prompt)) return null;
  return {
    action: 'explain_tour_meeting_point',
    rescueReason: 'explain_tour_meeting_point',
  };
}

export function detectExplainTourMeetingPointAction(
  prompt: string,
): TourMeetingPointIntent | null {
  return rescueExplainTourMeetingPointIntent(prompt, 'unknown')?.action ?? null;
}
