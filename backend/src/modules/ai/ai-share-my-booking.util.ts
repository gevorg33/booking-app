import {
  SHARE_MY_BOOKING_PROMPTS,
  type ShareMyBookingPromptFixture,
} from './ai-share-my-booking.fixtures.js';
import { isRequestClientReviewPrompt } from './ai-provider-exp-2.util.js';

export const SHARE_MY_BOOKING_INTENTS = ['share_my_booking'] as const;

export type ShareMyBookingIntent = (typeof SHARE_MY_BOOKING_INTENTS)[number];

export interface ParsedShareMyBooking {
  bookingId?: string;
}

export { CUSTOMER_SHARE_MY_BOOKING_CLASSIFIER_RULES } from './ai-share-my-booking.fixtures.js';

const SHARE_CUE = new RegExp(
  String.raw`\b(?:share|send|post|forward|tell)\b|կիս|ուղարկ|подел|отправ|пересл`,
  'iu',
);

const BOOKING_CONTEXT = new RegExp(
  String.raw`\b(?:my|this|upcoming|confirmed)\b.*\b(?:booking|appointment|visit|reservation)\b|\b(?:booking|appointment|visit|reservation)\b.*\b(?:my|this|partner|friend|family|someone|link|details)\b|ամրագր|այց|запис|визит|брон`,
  'iu',
);

const MANAGE_LINK_CUE = new RegExp(
  String.raw`\b(?:manage\s+link|cancel\s+link|reschedule\s+link|self[\s-]?service\s+link|управлен|ссылк.*управлен)\b`,
  'iu',
);

const REFER_FRIEND_CUE = new RegExp(
  String.raw`\b(refer|invite).{0,40}\b(friend|buddy|referral)\b|\breferral (code|link|program)\b|հրավիր.{0,24}(ընկեր|friend)|реферал|приглас.{0,24}друг`,
  'iu',
);

const SALON_SHARE_CUE = new RegExp(
  String.raw`\b(?:salon|business|place|booking page)\b.*\b(?:link|share)\b|\bshare\b.*\b(?:salon|business|place)\b|սրահ|բիզնես|салон|бизнес`,
  'iu',
);

const EXPLAIN_ONLY = new RegExp(
  String.raw`\b(?:what|how|why|does|mean|explain)\b.*\b(?:share reward|points when i share)\b|\b(?:share reward|points)\b.*\b(?:policy|program|work)\b`,
  'iu',
);

const EXPLAIN_READ_BOOKING = new RegExp(
  String.raw`\b(?:what|when|where|who|which|tell\s+me\s+about|summarize|confirm)\b.*\b(?:booking|appointment|visit|reservation)\b|\b(?:booking|appointment)\b.*\b(?:details?|time|status)\b`,
  'iu',
);

function matchShareMyBookingScenario(
  prompt: string,
): ShareMyBookingIntent | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of SHARE_MY_BOOKING_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario.expectedAction;
    }
  }
  return null;
}

export function isShareMyBookingIntent(
  action: string,
): action is ShareMyBookingIntent {
  return (SHARE_MY_BOOKING_INTENTS as readonly string[]).includes(action);
}

export function isShareMyBookingPrompt(prompt: string): boolean {
  if (isRequestClientReviewPrompt(prompt)) return false;
  if (EXPLAIN_ONLY.test(prompt)) return false;
  if (
    /\b(?:ics|\.ics|google\s+calendar|outlook|add\s+to\s+calendar|calendar\s+file|download\s+calendar)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    EXPLAIN_READ_BOOKING.test(prompt) &&
    !/\b(?:share|send|post|forward)\b/i.test(prompt)
  ) {
    return false;
  }
  if (REFER_FRIEND_CUE.test(prompt)) return false;
  if (SALON_SHARE_CUE.test(prompt)) return false;
  if (MANAGE_LINK_CUE.test(prompt)) return false;
  if (
    /\b(get|send|show)\b/i.test(prompt) &&
    /\blink\b/i.test(prompt) &&
    /\b(booking|appointment)\b/i.test(prompt) &&
    !/\b(share|partner|friend|family|someone|forward|tell)\b/i.test(prompt)
  ) {
    return false;
  }

  if (matchShareMyBookingScenario(prompt)) return true;

  if (
    /(?:կիս.{0,24}ամրագր|ուղարկ.{0,24}(?:amr|ամրագր|այց)|подел.{0,24}(?:запис|визит|брон)|отправ.{0,24}(?:запис|визит|брон))/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (!SHARE_CUE.test(prompt)) return false;
  return BOOKING_CONTEXT.test(prompt);
}

export function parseShareMyBookingFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedShareMyBooking | null {
  if (!isShareMyBookingPrompt(prompt)) return null;

  const bookingId =
    (params.bookingId as string | undefined) ??
    (params.sessionBookingId as string | undefined);

  return {
    ...(bookingId ? { bookingId } : {}),
  };
}

export function rescueShareMyBookingIntent(
  prompt: string,
  action: string,
): { action: ShareMyBookingIntent; rescueReason: string } | null {
  if (isShareMyBookingIntent(action)) return null;
  if (!parseShareMyBookingFromPrompt(prompt)) return null;
  return {
    action: 'share_my_booking',
    rescueReason: 'share_my_booking',
  };
}

export type { ShareMyBookingPromptFixture };
