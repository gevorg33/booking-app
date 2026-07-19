import type { GetDirectionsToSalonAspect } from './ai-get-directions-to-salon.fixtures.js';
import { isOpenBookingFromPushPrompt } from './ai-push-notifications.util.js';

export const GET_DIRECTIONS_TO_SALON_INTENTS = [
  'get_directions_to_salon',
] as const;

export type GetDirectionsToSalonIntent =
  (typeof GET_DIRECTIONS_TO_SALON_INTENTS)[number];

export const CUSTOMER_PUBLIC_GET_DIRECTIONS_TO_SALON_CLASSIFIER_RULES = `- get_directions_to_salon: READ — return Google Maps directions URL, profile map embed link, street address, and parking guidance for visiting the salon. Triggers: "Directions to the salon", "How do I get to the salon?", "Navigate to the salon", "Where do I park?", "Where can I park nearby?". Set aspect to directions|parking|all when clear. NOT explain_business_hours_and_location (static hours/address without navigation), NOT confirm_my_booking_details (my appointment summary), NOT business_info.`;

const DIRECTIONS_CUE = new RegExp(
  String.raw`\b(?:directions?|navigate|how\s+do\s+i\s+(?:get|drive|find)|get\s+there|google\s+maps\s+directions?|open\s+(?:in\s+)?maps|drive\s+to|route\s+to|show\s+me\s+directions?)\b|ուղղություն|ինչպես\s+գալ|ինչպես\s+հասն|как\s+добраться|как\s+проехать|навигац`,
  'iu',
);

const VISIT_PARKING_CUE = new RegExp(
  String.raw`\b(?:where\s+(?:can\s+i|do\s+i|should\s+i)\s+park|parking\s+(?:for|near|nearby|at|info)|park\s+(?:for|near|nearby|at|my)|where\s+to\s+park|\band\s+parking\b)\b|որտեղ.*կայան|կայանատեղ|где\s+(?:при)?парков|где\s+парковаться|парковка\s+(?:рядом|для|у)`,
  'iu',
);

const SALON_VISIT_CONTEXT = new RegExp(
  String.raw`\b(?:salon|your\s+(?:location|place|shop|studio|clinic)|the\s+salon|for\s+my\s+(?:visit|appointment)|nearby|your\s+location)\b|սրահ|տեղ|салон|ваш(?:его|ей)?\s+(?:салон|адрес|место)`,
  'iu',
);

const EXPLAIN_HOURS_LOCATION_BLOCK = new RegExp(
  String.raw`\b(?:when\s+are\s+you\s+open|opening\s+hours|business\s+hours|what\s+time|are\s+you\s+open|close|closing|what\s+are\s+your\s+hours|hours\s+and\s+where|where\s+are\s+you\s+located|what(?:'s|\s+is)\s+the\s+address|map\s+link|is\s+there\s+parking)\b|աշխատանքային|բաց|ժամեր|часы|открыт|адрес|есть\s+ли\s+парков`,
  'iu',
);

const BOOKING_SUMMARY_BLOCK = new RegExp(
  String.raw`\b(?:confirm\s+my\s+booking|what\s+time\s+is\s+my\s+appointment|summarize\s+my\s+booking|who\s+is\s+my\s+appointment\s+with)\b|իմ\s+ամրագր(?:ման)?\s+մանրամաս|подтверди\s+детали|когда\s+моя\s+запись`,
  'iu',
);

export function isGetDirectionsToSalonIntent(
  action: string,
): action is GetDirectionsToSalonIntent {
  return (GET_DIRECTIONS_TO_SALON_INTENTS as readonly string[]).includes(
    action,
  );
}

export function inferGetDirectionsToSalonAspect(
  prompt: string,
): GetDirectionsToSalonAspect {
  const directions = DIRECTIONS_CUE.test(prompt);
  const parking = VISIT_PARKING_CUE.test(prompt);
  if (directions && parking) return 'all';
  if (parking) return 'parking';
  return 'directions';
}

const CONSUMER_SUCCESS_SCREEN_NAV_BLOCK = new RegExp(
  String.raw`\b(?:success\s+screen|checkout\s+success|booking\s+confirmed)\b.*\b(?:appointments?|view\s+appointments|my\s+appointments)\b|\b(?:appointments?|view\s+appointments|my\s+appointments)\b.*\b(?:success\s+screen|checkout\s+success|booking\s+confirmed)\b`,
  'iu',
);

export function isGetDirectionsToSalonPrompt(prompt: string): boolean {
  if (isOpenBookingFromPushPrompt(prompt)) return false;
  if (BOOKING_SUMMARY_BLOCK.test(prompt)) return false;
  if (CONSUMER_SUCCESS_SCREEN_NAV_BLOCK.test(prompt)) return false;
  if (/\bis\s+there\s+parking\b/i.test(prompt)) return false;
  if (
    /\b(?:where\s+do\s+we\s+meet|meeting\s+point|pickup\s+point|where\s+should\s+i\s+arrive)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    EXPLAIN_HOURS_LOCATION_BLOCK.test(prompt) &&
    !DIRECTIONS_CUE.test(prompt) &&
    !VISIT_PARKING_CUE.test(prompt)
  ) {
    return false;
  }

  const directions = DIRECTIONS_CUE.test(prompt);
  const parking = VISIT_PARKING_CUE.test(prompt);
  if (!directions && !parking) return false;

  return (
    SALON_VISIT_CONTEXT.test(prompt) ||
    /\bdirections?\b/i.test(prompt) ||
    /\bhow\s+do\s+i\s+(?:get|drive)\b/i.test(prompt) ||
    /\bnavigate\b/i.test(prompt) ||
    /\bwhere\s+(?:can\s+i|do\s+i|should\s+i)\s+park\b/i.test(prompt) ||
    /(?:ուղղություն|որտեղ.*կայան|как\s+добраться|где.*парков|припарков)/iu.test(
      prompt,
    )
  );
}

export function enrichGetDirectionsToSalonParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const aspect =
    (params.aspect as GetDirectionsToSalonAspect | undefined) ??
    inferGetDirectionsToSalonAspect(prompt);
  return {
    ...params,
    aspect,
  };
}

export function parseGetDirectionsToSalonFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { aspect: GetDirectionsToSalonAspect } | null {
  if (!isGetDirectionsToSalonPrompt(prompt)) return null;
  const aspectFromParams =
    typeof params.aspect === 'string' &&
    ['directions', 'parking', 'all'].includes(params.aspect)
      ? (params.aspect as GetDirectionsToSalonAspect)
      : undefined;
  return {
    aspect: aspectFromParams ?? inferGetDirectionsToSalonAspect(prompt),
  };
}

export function rescueGetDirectionsToSalonIntent(
  prompt: string,
  action: string,
): { action: GetDirectionsToSalonIntent; rescueReason: string } | null {
  if (isGetDirectionsToSalonIntent(action)) return null;
  if (!parseGetDirectionsToSalonFromPrompt(prompt)) return null;
  return {
    action: 'get_directions_to_salon',
    rescueReason: 'salon_directions',
  };
}

export function detectGetDirectionsToSalonAction(
  prompt: string,
): GetDirectionsToSalonIntent | null {
  return rescueGetDirectionsToSalonIntent(prompt, 'unknown')?.action ?? null;
}
