import { extractServiceNameFromPrompt, isBookNearestSlotPrompt } from './ai-payments.util.js';
import { isExplicitPayOnlinePrompt } from './ai-pay-online-checkout.util.js';
import { isBookAnotherServicePrompt } from './ai-book-another-service.util.js';
import { isShareMyBookingPrompt } from './ai-share-my-booking.util.js';
import { isListMyUpcomingAppointmentsPrompt } from './ai-list-my-upcoming-appointments.util.js';
import { isExplainTourBookingRecordPrompt } from './ai-tour-booking-record.util.js';
import { isExplainTourBookingPrompt } from './ai-tour-booking.util.js';
import { isExplainTourMeetingPointPrompt } from './ai-tour-meeting-point.util.js';
import { isExplainAnyProviderOptionPrompt } from './ai-explain-any-provider-option.util.js';
import { isExplainNotificationCurrencyPrompt } from './ai-notification-currency.util.js';
import { isExplainTenantCurrencyPrompt } from './ai-tenant-currency.util.js';
import { isSignInAfterBookingPrompt } from './ai-sign-in-after-booking.util.js';
import { isAddBookingToCalendarPrompt } from './ai-add-booking-to-calendar.util.js';
import { isListTourCalendarWeekPrompt } from './ai-tour-calendar-week.util.js';
import { isExplainTourCalendarSpanPrompt } from './ai-tour-calendar-span.util.js';
import { isConfigureProviderPushDateFormatPrompt } from './ai-provider-date-format.util.js';
import { isExplainCheckoutRecommendationsPrompt } from './ai-checkout-recommendations.util.js';
import { isExplainBookingDateFormatPrompt } from './ai-booking-date-format.util.js';
import { isOpenBookingFromPushPrompt } from './ai-push-notifications.util.js';
import {
  isListReassignOptionsPrompt,
  isRequestClientReviewPrompt,
  hasMyStatsKeywordCue,
} from './ai-provider-exp-2.util.js';
import { isSummarizeMyRevenuePrompt } from './ai-provider-earnings.util.js';
import { isSuggestRetailUpsellPrompt } from './ai-retail-finance.util.js';
import { isExplainGuestCheckoutFieldsPrompt } from './ai-explain-guest-checkout-fields.util.js';
import { isExplainClinicBookingPrompt } from './ai-clinic-booking.util.js';
import { isExplainPackageCurrencyPrompt } from './ai-package-currency.util.js';
import { isExplainProviderPaymentCurrencyPrompt } from './ai-provider-payment-currency.util.js';
import { isExplainStripeCheckoutCurrencyPrompt } from './ai-stripe-checkout-currency.util.js';
import { isExplainBookingLanguagesPrompt } from './ai-booking-languages.util.js';
import { isExplainTourDaySlotsPrompt } from './ai-tour-day-slots.util.js';
import { isLeaveVisitReviewPrompt } from './ai-leave-visit-review.util.js';
import { isExplainSubscriptionVsOneTimePrompt } from './ai-explain-subscription-vs-one-time.util.js';
import { isReportBookingProblemPrompt } from './ai-report-booking-problem.util.js';
import { isBookingHelpPrompt } from './ai-public-booking-guide.util.js';
import { isExplainHomeScreenWidgetPrompt } from './ai-explain-home-screen-widget.util.js';
import type { ConfirmMyBookingDetailsAspect } from './ai-confirm-my-booking-details.fixtures.js';

export const CONFIRM_MY_BOOKING_DETAILS_INTENTS = [
  'confirm_my_booking_details',
] as const;

export type ConfirmMyBookingDetailsIntent =
  (typeof CONFIRM_MY_BOOKING_DETAILS_INTENTS)[number];

export interface ParsedConfirmMyBookingDetails {
  aspect: ConfirmMyBookingDetailsAspect;
  bookingId?: string;
  serviceName?: string;
}

export const CUSTOMER_PUBLIC_CONFIRM_MY_BOOKING_DETAILS_CLASSIFIER_RULES = `- confirm_my_booking_details: READ — summarize the visitor's current or most recent booking from session bookingId or signed-in account: service, provider, date/time, status, and salon location. Triggers: "What time is my appointment?", "Summarize my booking", "Who is my appointment with?", "What did I just book?", hy «ինչ ժամի է իմ ամրագրումը», «ամփոփիր իմ ամրագրումը», «Ի՞նչ ամրագրում եմ արել». Set aspect when clear (time|service|provider|status|location|all). Auth: signed-in sessionCustomerId must own bookingId; anonymous guests require bookingId + valid manageToken (manage link). Never return booking details from bookingId alone. Otherwise next matching upcoming visit for signed-in customers. NOT booking_help (how to book / funnel walkthrough — hy «Ինչպես ամրագրել», «Ինչպե՞ս ամրագրել այցելություն», ru «Как записаться»), NOT list_my_appointments (list all visits), NOT cancel_my_booking|reschedule_my_booking (mutate), NOT pay_online (pay online / pay with card for a booking — mutate checkout), NOT explain_subscription_vs_one_time (subscription/membership vs one-time / pay per visit checkout compare — "should I get the subscription or just pay per visit?"), NOT report_booking_problem (report/complaint / something went wrong / file a complaint / report a booking problem — never summarize instead), NOT explain_manage_booking_context (guest manage-link policy/context sibling), NOT get_manage_link|share_my_booking (links only), NOT add_booking_to_calendar (calendar links), NOT get_directions_to_salon (navigation/parking guidance), NOT explain_consumer_checkout_success (success-screen UI walkthrough).`;

const READ_CUE = new RegExp(
  String.raw`\b(what|when|where|who|which|tell|show|summarize|summary|details?|confirm|did|is|my|about|just)\b|ինչ|երբ|որտեղ|ով|բացատր|ամփոփ|что|когда|где|кто|какой|покаж|подтвер`,
  'iu',
);

// e2e-bug.230 — do not treat bare "just" as a booking determiner ("just pay per visit"
// is a subscription checkout compare, not "what did I just book?").
const BOOKING_CONTEXT = new RegExp(
  String.raw`\b(?:my|this|upcoming|current)\b.*\b(?:booking|appointment|visit|reservation|massage|haircut|facial|service)\b|\bjust\s+(?:booked|book)\b|\b(?:booking|appointment|visit|reservation)\b.*\b(?:my|this|details?|time|confirmed?)\b|what\s+did\s+i\s+(?:just\s+)?book|what\s+service\s+did\s+i\s+book|which\s+service\s+is\s+my\s+booking|summarize\s+my\s+booking|appointment\s+details?|booking\s+details?|booked\s+with`,
  'iu',
);

const TIME_TOPIC = new RegExp(
  String.raw`\b(?:what\s+time|when\s+is|what\s+day|upcoming\s+appointment|appointment\s+time)\b|երբ|ինչ\s+ժամի|во\s+сколько|когда\s+моя\s+запись|когда`,
  'iu',
);

const SERVICE_TOPIC = new RegExp(
  String.raw`\b(?:what\s+service|which\s+service|what\s+did\s+i\s+book|service\s+did\s+i)\b|ծառայություն|услуг|какая\s+услуга`,
  'iu',
);

const PROVIDER_TOPIC = new RegExp(
  String.raw`\b(?:who\s+(?:is|am)\s+(?:my\s+)?(?:appointment|booking|visit)\s+with|who\s+am\s+i\s+booked\s+with|booked\s+with|provider|stylist|specialist)\b|ովի\s+հետ|с\s+кем`,
  'iu',
);

const STATUS_TOPIC = new RegExp(
  String.raw`\b(?:is\s+my\s+appointment\s+confirmed|did\s+my\s+booking\s+go\s+through|booking\s+status|confirmed\?)\b|հաստատ|подтвержд|запись\s+подтвержд`,
  'iu',
);

const LOCATION_TOPIC = new RegExp(
  String.raw`\b(?:where\s+is\s+my\s+appointment|salon\s+location|where\s+do\s+i\s+go)\b|որտեղ|где\s+наход`,
  'iu',
);

const BLOCK_TOPIC = new RegExp(
  String.raw`\b(?:list\s+my|show\s+all|all\s+my|cancel|reschedule|move|shift|manage\s+link|share\s+my\s+booking|success\s+screen|view\s+appointments|book\s+another)\b|\bchange\b.{0,30}\b(?:to|for)\b.{0,20}\b(?:tomorrow|today|tonight|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\s*(?:am|pm)|\d{1,2}:\d{2})\b|\b(?:use|apply|redeem)\b.{0,30}\b(?:membership|subscription|loyalty|reward|points?)\b|\b(?:membership|subscription|loyalty|reward|points?)\b.{0,30}\b(?:use|apply|redeem)\b|ցուցակ|отмен|перенес`,
  'iu',
);

const LIST_ALL_APPOINTMENTS = new RegExp(
  String.raw`\b(?:list|show\s+all|all\s+my)\b.*\b(?:appointments?|visits?|bookings?)\b|\blist\b.*\bmy\b.*\bappointments?\b`,
  'iu',
);

export function isConfirmMyBookingDetailsIntent(
  action: string,
): action is ConfirmMyBookingDetailsIntent {
  return (CONFIRM_MY_BOOKING_DETAILS_INTENTS as readonly string[]).includes(
    action,
  );
}

export function extractConfirmMyBookingDetailsAspectFromPrompt(
  prompt: string,
): ConfirmMyBookingDetailsAspect {
  if (TIME_TOPIC.test(prompt)) return 'time';
  if (SERVICE_TOPIC.test(prompt)) return 'service';
  if (PROVIDER_TOPIC.test(prompt)) return 'provider';
  if (STATUS_TOPIC.test(prompt)) return 'status';
  if (LOCATION_TOPIC.test(prompt)) return 'location';
  if (
    /\b(?:summarize|summary|details?|confirm\s+my\s+booking|this\s+booking|just\s+book)\b/i.test(
      prompt,
    )
  ) {
    return 'all';
  }
  // e2e-bug.258 — do not treat ինչպես ամրագրել (how to book) as a summary cue;
  // only "what booking" / summarize shapes map to aspect all.
  if (
    /ամփոփիր|подтверди\s+детали|ինչ\s*[\u055e՞]?\s*ամրագրում|ամրագրում\s+եմ\s+արել/i.test(
      prompt,
    )
  ) {
    return 'all';
  }
  if (/ովի\s+հետ|с\s+кем/i.test(prompt)) {
    return 'provider';
  }
  return 'all';
}

const CONSUMER_CHECKOUT_SUCCESS_UI_BLOCK = new RegExp(
  String.raw`\b(?:success\s+screen|booking\s+confirmed\s+screen|checkout\s+success|confirmation\s+(?:screen|page|summary))\b|\b(?:payment\s+summary|green\s+checkmark|view\s+appointments|book\s+another|you\s+might\s+also\s+like|dismiss\s+recommendations?|product\s+cards?)\b.*\b(?:app|screen|success)\b|\b(?:app|screen|success)\b.*\b(?:payment\s+summary|green\s+checkmark|view\s+appointments|book\s+another|you\s+might\s+also\s+like|dismiss\s+recommendations?|product\s+cards?)\b`,
  'iu',
);

function isServicePaymentOptionsQuestionPrompt(prompt: string): boolean {
  if (/\bwhy\b/i.test(prompt)) return false;
  if (/\b(can|could|may)\b/i.test(prompt)) {
    return (
      /\b(?:can|could|may)\s+i\s+pay\s+(?:online|in\s+cash|cash|by\s+card)\b/i.test(
        prompt,
      ) &&
      /\b(?:this|the|selected|current|that)\s+(?:service|treatment)\b/i.test(
        prompt,
      )
    );
  }
  return (
    /\bdo\s+i\s+(?:need\s+to\s+)?pay\s+online\b/i.test(prompt) ||
    /\bdo\s+i\s+have\s+to\s+pay\s+(?:online|by\s+card)\b/i.test(prompt) ||
    /\bmust\s+i\s+pay\s+online\b/i.test(prompt)
  );
}

export function isConfirmMyBookingDetailsPrompt(prompt: string): boolean {
  // e2e-bug.258 — short Armenian/Russian how-to-book is booking_help, not a summary.
  if (isBookingHelpPrompt(prompt)) return false;
  // e2e-bug.236 — report/complaint phrasing is report_booking_problem, not a summary.
  if (isReportBookingProblemPrompt(prompt)) return false;
  // e2e-bug.88 — "pay online for my … booking" is pay_online, not a details read.
  if (isExplicitPayOnlinePrompt(prompt)) return false;
  // e2e-bug.230 — subscription vs pay-per-visit compare is not a booking summary.
  if (isExplainSubscriptionVsOneTimePrompt(prompt)) return false;
  if (isExplainGuestCheckoutFieldsPrompt(prompt)) return false;
  if (isExplainClinicBookingPrompt(prompt)) return false;
  if (isOpenBookingFromPushPrompt(prompt)) return false;
  if (isListReassignOptionsPrompt(prompt)) return false;
  if (isRequestClientReviewPrompt(prompt)) return false;
  if (hasMyStatsKeywordCue(prompt)) return false;
  if (isSummarizeMyRevenuePrompt(prompt)) return false;
  if (isSuggestRetailUpsellPrompt(prompt)) return false;
  if (isConfigureProviderPushDateFormatPrompt(prompt)) return false;
  if (isExplainCheckoutRecommendationsPrompt(prompt)) return false;
  if (isExplainBookingDateFormatPrompt(prompt)) return false;
  if (isSignInAfterBookingPrompt(prompt)) return false;
  if (isAddBookingToCalendarPrompt(prompt)) return false;
  // e2e-bug.295 — "Add my next appointment to the home screen" is OS widget
  // help, not booking-details summary (confirm cues match "my … appointment").
  if (isExplainHomeScreenWidgetPrompt(prompt)) return false;
  if (isListTourCalendarWeekPrompt(prompt)) return false;
  if (isExplainTourCalendarSpanPrompt(prompt)) return false;
  if (isBookNearestSlotPrompt(prompt)) return false;
  // e2e-bug.99 — intake + lab book + pay is a mutate compound, not booking details.
  if (
    /\b(?:intake|questionnaire|health\s+form|pre-visit)\b/i.test(prompt) &&
    /\b(?:book|schedule|reserve)\b/i.test(prompt) &&
    /\b(?:pay|paying|paid|deposit|cash|card|online)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(?:tax|vat|gst|payment\s+breakdown|marked\s+paid|collected|walk\s+me\s+through|payment\s+status)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (/\bmark\b.{0,30}\bpaid\b/i.test(prompt)) return false;
  if (
    /\b(mark|set)\b.{0,30}\b(in[\s-]?progress|confirmed|pending|complete|completed|done|no[\s-]?show)\b/i.test(
      prompt,
    ) ||
    /\b(start|begin)\b.{0,20}\b(service|appointment|visit)\b/i.test(prompt)
  ) {
    return false;
  }
  if (isServicePaymentOptionsQuestionPrompt(prompt)) return false;
  if (isExplainTourBookingRecordPrompt(prompt)) return false;
  if (isExplainTourBookingPrompt(prompt)) return false;
  if (isExplainTourMeetingPointPrompt(prompt)) return false;
  if (isExplainNotificationCurrencyPrompt(prompt)) return false;
  if (isExplainTenantCurrencyPrompt(prompt)) return false;
  if (isExplainPackageCurrencyPrompt(prompt)) return false;
  if (isExplainProviderPaymentCurrencyPrompt(prompt)) return false;
  if (isExplainStripeCheckoutCurrencyPrompt(prompt)) return false;
  if (isExplainBookingLanguagesPrompt(prompt)) return false;
  if (isExplainTourDaySlotsPrompt(prompt)) return false;
  if (isExplainAnyProviderOptionPrompt(prompt)) return false;
  if (isBookAnotherServicePrompt(prompt)) return false;
  if (isShareMyBookingPrompt(prompt)) return false;
  if (isLeaveVisitReviewPrompt(prompt)) return false;
  if (/\bpackage\s+visit\s+status\b/i.test(prompt)) return false;
  if (
    /\bpackage\s+visits?\b/i.test(prompt) &&
    /\b(status|progress|left|remaining|still\s+have|how\s+many)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (isListMyUpcomingAppointmentsPrompt(prompt)) return false;
  if (LIST_ALL_APPOINTMENTS.test(prompt)) return false;
  if (BLOCK_TOPIC.test(prompt)) return false;
  if (CONSUMER_CHECKOUT_SUCCESS_UI_BLOCK.test(prompt)) return false;
  if (
    /\b(?:where\s+(?:can\s+i|do\s+i|should\s+i)\s+park|directions?|how\s+do\s+i\s+(?:get|drive)|navigate|fast|bring|prepare|prep|meeting point|where do we meet)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  // e2e-bug.258 — removed bare `ինչ.*ամրագր` (matched ինչպես ամրագրել how-to).
  // Keep time/summarize/provider/just-booked HY + RU summary cues only.
  if (
    /(?:ինչ\s*[\u055d\u055e՞]?\s*ժամի|ամփոփիր\s+իմ|ովի\s+հետ|ամրագրում\s+եմ\s+արել|ինչ\s*[\u055e՞]?\s*ամրագրում|когда\s+моя\s+запись|подтверди\s+детали|какая\s+услуга|моя\s+запись\s+подтвержд)/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (!READ_CUE.test(prompt) && !BOOKING_CONTEXT.test(prompt)) return false;

  return BOOKING_CONTEXT.test(prompt);
}

export function parseConfirmMyBookingDetailsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfirmMyBookingDetails | null {
  if (!isConfirmMyBookingDetailsPrompt(prompt)) return null;

  const aspectFromParams =
    typeof params.aspect === 'string' &&
    ['time', 'service', 'provider', 'status', 'location', 'all'].includes(
      params.aspect,
    )
      ? (params.aspect as ConfirmMyBookingDetailsAspect)
      : undefined;

  const bookingId =
    (params.bookingId as string | undefined) ??
    (params.sessionBookingId as string | undefined);

  const serviceName =
    (params.serviceName as string | undefined) ??
    extractServiceNameFromPrompt(prompt) ??
    undefined;

  return {
    aspect:
      aspectFromParams ??
      extractConfirmMyBookingDetailsAspectFromPrompt(prompt),
    ...(bookingId ? { bookingId } : {}),
    ...(serviceName ? { serviceName } : {}),
  };
}

export function rescueConfirmMyBookingDetailsIntent(
  prompt: string,
  action: string,
): { action: ConfirmMyBookingDetailsIntent; rescueReason: string } | null {
  if (isConfirmMyBookingDetailsIntent(action)) return null;
  if (!parseConfirmMyBookingDetailsFromPrompt(prompt)) return null;
  return {
    action: 'confirm_my_booking_details',
    rescueReason: 'confirm_booking_details',
  };
}
