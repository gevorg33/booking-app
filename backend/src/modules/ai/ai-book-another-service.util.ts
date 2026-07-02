import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import { isExplainTourBookingRecordPrompt } from './ai-tour-booking-record.util.js';

export function extractBookAnotherServiceNameFromPrompt(
  prompt: string,
): string | null {
  const anotherNamed = prompt.match(
    /\b(?:book|schedule)\s+(?:a\s+|an\s+|the\s+)?(?:another|different|one\s+more)\s+([a-z][\w\s'-]{2,40}?)(?=\s*(?:same\s+day|today|this|tomorrow|,|;|\?|$))/i,
  );
  if (anotherNamed) {
    const name = anotherNamed[1].trim().replace(/[,.]$/, '');
    if (
      name &&
      !/^(service|appointment|visit|booking|something\s+else)$/i.test(name)
    ) {
      return name;
    }
  }
  return extractServiceNameFromPrompt(prompt);
}

export const BOOK_ANOTHER_SERVICE_INTENTS = ['book_another_service'] as const;

export type BookAnotherServiceIntent =
  (typeof BOOK_ANOTHER_SERVICE_INTENTS)[number];

export interface ParsedBookAnotherService {
  sameDay: boolean;
  bookingId?: string;
  serviceName?: string;
}

export const CUSTOMER_PUBLIC_BOOK_ANOTHER_SERVICE_CLASSIFIER_RULES = `- book_another_service: READ — start a fresh booking flow after checkout success without stale BookPage success state. Returns navigate to services or a named service checkout with freshBook=1 and optional same-day date from the just-finished booking. Triggers: "Book another service", "Book another service same day", "Schedule another appointment today", "Book something else after this booking". NOT explain_consumer_checkout_success (what the success-screen button does), NOT book_appointment|book_nearest_slot (specific service/time booking), NOT rebook_last_appointment (repeat last visit), NOT list_my_appointments.`;

const BOOK_ANOTHER_CUES = [
  /\b(?:book|schedule|start|take me to)\b.*\b(?:another|different|something else|one more|extra)\b.*\b(?:service|appointment|visit|booking)\b/i,
  /\b(?:book|schedule)\b.*\b(?:something else|another visit)\b/i,
  /\b(?:another|different)\s+(?:service|visit|booking|appointment)\b/i,
  /\b(?:book|schedule)\s+(?:a\s+|an\s+|the\s+)?(?:another|different|one\s+more)\s+[a-z]/i,
  /\bsomething\s+else\b.*\b(?:today|book|service|appointment)\b/i,
  /ամրագր(?:իր|եք|ել)\b|այլ\s+ծառայ|(?:ևս|մեկ)\s+(?:այց|ծառայ)|սկս(?:իր|ել)\b/iu,
  /(?:ещё|еще)\s+од(?:ну|ин)|друг(?:ая|ую|ой)\s+услуг|запиш(?:и|ись|аться)|хочу\s+.*запис/iu,
];

const SAME_DAY_CUE = new RegExp(
  String.raw`\b(?:same day|today|this afternoon|this evening|later today)\b|այս\s*օ(?:րը|ր)|сегодня|в\s+этот\s+день|в\s+тот\s+же\s+день`,
  'iu',
);

const EXPLAIN_CUE = new RegExp(
  String.raw`\b(?:what|how|why|does|do|mean|explain|tell me about)\b|ինչ|ինչպես|բացատր|что|как|объясн|зачем`,
  'iu',
);

const SPECIFIC_SLOT_CUE = new RegExp(
  String.raw`\b(?:at\s+\d|@\s*\d|\d{1,2}(?::\d{2})?\s*(?:am|pm)|tomorrow|next week|on monday|on friday)\b|վաղը|завтра|в\s+\d{1,2}[:.]`,
  'iu',
);

const REBOOK_CUE = new RegExp(
  String.raw`\b(?:rebook(?:\s+my)?\s+last|book again|repeat(?:\s+my)?\s+last|same as last|book my last)\b` +
    String.raw`|повтор(?:и|ить)\s+(?:послед|запись)|повторн.{0,20}запис|как\s+в\s+прошлый|снова\s+как` +
    String.raw`|նույն\s+(?:այց|\u0061mr)|` +
    String.raw`[\u054E\u057E]\u0565\u0580\u0561\u0574\u0561\u0572\u0580.{0,24}(?:\u057E\u0565\u0580\u057B\u056B\u0576|last)|` +
    String.raw`\u057E\u0565\u0580\u057B\u056B\u0576.{0,16}(?:\u0561\u0575\u0581|\u0061mr)`,
  'iu',
);

const SUCCESS_SCREEN_EXPLAIN = new RegExp(
  String.raw`\b(?:success screen|booking confirmed screen|checkout success)\b.*\b(?:what|how|does|mean|explain)\b|\b(?:what|how|does)\b.*\b(?:book another service|view appointments)\b.*\b(?:do|mean|success|screen|app)\b`,
  'iu',
);

export function isBookAnotherServiceIntent(
  action: string,
): action is BookAnotherServiceIntent {
  return (BOOK_ANOTHER_SERVICE_INTENTS as readonly string[]).includes(action);
}

export function inferBookAnotherServiceSameDay(prompt: string): boolean {
  return SAME_DAY_CUE.test(prompt);
}

export function isBookAnotherServicePrompt(prompt: string): boolean {
  if (isExplainTourBookingRecordPrompt(prompt)) return false;
  if (SUCCESS_SCREEN_EXPLAIN.test(prompt)) return false;
  if (EXPLAIN_CUE.test(prompt)) return false;
  if (
    /ամփոփիր\s+իմ|ինչ\s+ժամի|ովի\s+հետ|ամրագրում\s+եմ|какая\s+услуга|моя\s+запись/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (REBOOK_CUE.test(prompt)) return false;
  if (SPECIFIC_SLOT_CUE.test(prompt)) return false;
  return BOOK_ANOTHER_CUES.some((cue) => cue.test(prompt));
}

export function parseBookAnotherServiceFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedBookAnotherService | null {
  if (!isBookAnotherServicePrompt(prompt)) return null;

  const sameDayFromParams =
    params.sameDay === true || params.sameDay === 'true'
      ? true
      : params.sameDay === false || params.sameDay === 'false'
        ? false
        : undefined;

  const bookingId =
    (params.bookingId as string | undefined) ??
    (params.sessionBookingId as string | undefined);

  const serviceName =
    (params.serviceName as string | undefined) ??
    extractBookAnotherServiceNameFromPrompt(prompt) ??
    undefined;

  return {
    sameDay: sameDayFromParams ?? inferBookAnotherServiceSameDay(prompt),
    ...(bookingId ? { bookingId } : {}),
    ...(serviceName ? { serviceName } : {}),
  };
}

export function rescueBookAnotherServiceIntent(
  prompt: string,
  action: string,
): { action: BookAnotherServiceIntent; rescueReason: string } | null {
  if (isBookAnotherServiceIntent(action)) return null;
  if (!parseBookAnotherServiceFromPrompt(prompt)) return null;
  return {
    action: 'book_another_service',
    rescueReason: 'book_another_service',
  };
}
