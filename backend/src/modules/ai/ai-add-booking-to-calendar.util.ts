import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import { isShareMyBookingPrompt } from './ai-share-my-booking.util.js';
import { isExplainTourBookingRecordPrompt } from './ai-tour-booking-record.util.js';
import { isSignInAfterBookingPrompt } from './ai-sign-in-after-booking.util.js';
import { isRequestClientReviewPrompt } from './ai-provider-exp-2.util.js';
import { hasSubscriptionCheckoutCompareCue } from './ai-explain-subscription-vs-one-time.util.js';
import type { AddBookingToCalendarFormat } from './ai-add-booking-to-calendar.fixtures.js';

export const ADD_BOOKING_TO_CALENDAR_INTENTS = [
  'add_booking_to_calendar',
] as const;

export type AddBookingToCalendarIntent =
  (typeof ADD_BOOKING_TO_CALENDAR_INTENTS)[number];

export interface ParsedAddBookingToCalendar {
  format: AddBookingToCalendarFormat;
  bookingId?: string;
  serviceName?: string;
}

export const CUSTOMER_PUBLIC_ADD_BOOKING_TO_CALENDAR_CLASSIFIER_RULES = `- add_booking_to_calendar: READ — return calendar links for the visitor's current or most recent booking: Google Calendar deep link, Outlook compose link, and downloadable .ics URL when supported. Triggers: "Add to my calendar", "Send me an ICS", "Put my booking in Google Calendar", "Save my appointment to calendar". Set format when clear (google|outlook|ics|all). Uses session bookingId when present; otherwise next matching upcoming visit for signed-in customers. NOT confirm_my_booking_details (summary only), NOT get_manage_link|share_my_booking (manage/share links only), NOT list_my_appointments, NOT cancel_my_booking|reschedule_my_booking, NOT explain_subscription_vs_one_time (subscribe vs pay-per-visit / "should I get the subscription or just pay per visit?" — bare "get"+"visit" is not calendar).`;

const CALENDAR_CUE = new RegExp(
  String.raw`\b(?:add|save|put|create|export|download|send|get|open|calendar|ics|invite|event)\b|օրացույց|календар|ics|google\s+calendar|outlook`,
  'iu',
);

const BOOKING_CONTEXT = new RegExp(
  String.raw`\b(?:my|this|just|upcoming|current|phone)\b.*\b(?:booking|appointment|visit|reservation|massage|haircut|facial|service|calendar)\b|\b(?:tomorrow|today|tonight)\b.*\b(?:massage|haircut|facial|appointment|booking|visit)\b|\b(?:booking|appointment|visit|reservation)\b.*\b(?:my|this|calendar|ics)\b|what\s+i\s+just\s+booked|calendar\s+(?:file|invite|event)|(?:export|download).*\b(?:ics|calendar)\b|\bics\b.*\b(?:file|booking|appointment)\b`,
  'iu',
);

const GOOGLE_FORMAT = new RegExp(String.raw`\bgoogle\s+calendar\b`, 'iu');

const OUTLOOK_FORMAT = new RegExp(
  String.raw`\boutlook(?:\s+calendar)?\b`,
  'iu',
);

const ICS_FORMAT = new RegExp(
  String.raw`\b(?:ics|\.ics)\b|\bcalendar\s+file\b|\bdownload\b.*\bcalendar\s+file\b|\b(?:export|send\s+me|get\s+an).*\bics\b|\bics\b.*\b(?:file|for)\b|ֆայլ|файл`,
  'iu',
);

const BLOCK_TOPIC = new RegExp(
  String.raw`\b(?:list\s+my|show\s+all|all\s+my|cancel|reschedule|manage\s+link|share\s+my\s+booking|hide\s+appointments|what\s+time|summarize|confirm\s+my\s+booking|who\s+is\s+my\s+appointment)\b|ցուցակ|отмен|перенес|когда\s+моя\s+запись|подтверди\s+детали`,
  'iu',
);

export function isAddBookingToCalendarIntent(
  action: string,
): action is AddBookingToCalendarIntent {
  return (ADD_BOOKING_TO_CALENDAR_INTENTS as readonly string[]).includes(
    action,
  );
}

export function extractAddBookingToCalendarFormatFromPrompt(
  prompt: string,
): AddBookingToCalendarFormat {
  if (GOOGLE_FORMAT.test(prompt)) return 'google';
  if (OUTLOOK_FORMAT.test(prompt)) return 'outlook';
  if (ICS_FORMAT.test(prompt)) return 'ics';
  return 'all';
}

export function isAddBookingToCalendarPrompt(prompt: string): boolean {
  if (
    /(?:ավելացր.*օրացույց|օրացույց.*ավելաց|ics\s+ֆայլ|պահպան.*օրացույց|добав.*календар|google\s+calendar|outlook|ics\s+файл|сохрани.*календар|пришли\s+ics|отправ.*ics)/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(?:show|list|summarize)\b/i.test(prompt) &&
    /\b(?:tour\s+bookings?|tour\s+departures?|tours?)\b/i.test(prompt) &&
    /\b(?:calendar\s+week|provider\s+calendar|provider\s+schedule|current\s+calendar\s+week)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (isExplainTourBookingRecordPrompt(prompt)) return false;
  if (isShareMyBookingPrompt(prompt)) return false;
  if (isSignInAfterBookingPrompt(prompt)) return false;
  if (isRequestClientReviewPrompt(prompt)) return false;
  // e2e-bug.79 — "should I get the subscription or just pay per visit?" matched
  // bare get + just…visit and stole before explain_subscription_vs_one_time.
  if (hasSubscriptionCheckoutCompareCue(prompt)) return false;
  if (BLOCK_TOPIC.test(prompt)) return false;

  if (!CALENDAR_CUE.test(prompt)) return false;
  return (
    BOOKING_CONTEXT.test(prompt) ||
    /\badd\s+to\s+(?:my\s+)?calendar\b/i.test(prompt)
  );
}

export function parseAddBookingToCalendarFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedAddBookingToCalendar | null {
  if (!isAddBookingToCalendarPrompt(prompt)) return null;

  const formatFromParams =
    typeof params.format === 'string' &&
    ['google', 'outlook', 'ics', 'all'].includes(params.format)
      ? (params.format as AddBookingToCalendarFormat)
      : undefined;

  const bookingId =
    (params.bookingId as string | undefined) ??
    (params.sessionBookingId as string | undefined);

  const serviceName =
    (params.serviceName as string | undefined) ??
    extractServiceNameFromPrompt(prompt) ??
    undefined;

  return {
    format:
      formatFromParams ?? extractAddBookingToCalendarFormatFromPrompt(prompt),
    ...(bookingId ? { bookingId } : {}),
    ...(serviceName ? { serviceName } : {}),
  };
}

export function rescueAddBookingToCalendarIntent(
  prompt: string,
  action: string,
): { action: AddBookingToCalendarIntent; rescueReason: string } | null {
  if (isAddBookingToCalendarIntent(action)) return null;
  if (!parseAddBookingToCalendarFromPrompt(prompt)) return null;
  return {
    action: 'add_booking_to_calendar',
    rescueReason: 'add_booking_calendar',
  };
}
