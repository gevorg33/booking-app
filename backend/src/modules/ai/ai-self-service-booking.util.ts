import { SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS } from './ai-self-service-booking-multilingual.fixtures.js';
import {
  applyRelativeDateFromPrompt,
  formatDateDisplay,
  formatTimeDisplay,
  toIsoDay,
} from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { hasDashboardCustomerReference } from './ai-customer-crm.util.js';
import { isCancelPackageVisitSelfPrompt } from './ai-cancel-package-visit-self.util.js';
import { isReschedulePackageVisitSelfPrompt } from './ai-reschedule-package-visit-self.util.js';
import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import {
  formatTimeOfDayLabel,
  parseTimeOfDayWindow,
  slotOverlapsTimeWindow,
  timeToMinutes,
  type TimeOfDayWindow,
} from './ai-operations.util.js';
import {
  notBeforeTimeFromWindow,
  isBookNearestSlotPrompt,
} from './ai-payments.util.js';
import { PUBLIC_AVAILABILITY_SCAN_DAYS } from './ai-orchestration.helpers.js';
import { isConfirmMyBookingDetailsPrompt } from './ai-confirm-my-booking-details.util.js';
import { isAddBookingToCalendarPrompt } from './ai-add-booking-to-calendar.util.js';
import { isExplainPreparationNotesPrompt } from './ai-explain-preparation-notes.util.js';
import { rescueExplainPreparationNotesIntent } from './ai-explain-preparation-notes.util.js';
import { rescueExplainLabPrepIntent } from './ai-explain-lab-prep.util.js';
import { rescueExplainPublicIntakeFormIntent } from './ai-explain-public-intake-form.util.js';
import {
  isBookWithGiftCardPrompt,
  rescueBookWithGiftCardIntent,
} from './ai-book-with-gift-card.util.js';
import { isShareMyBookingPrompt } from './ai-share-my-booking.util.js';
import { isListMyUpcomingAppointmentsPrompt } from './ai-list-my-upcoming-appointments.util.js';
import { isBookAnotherServicePrompt } from './ai-book-another-service.util.js';
import { isExplainDepositForfeiturePrompt } from './ai-explain-deposit-forfeiture.util.js';
import { isExplainCancelPolicyPrompt } from './ai-explain-cancel-policy.util.js';
import {
  isExplainPackageVisitRulesPrompt,
  rescueExplainPackageVisitRulesIntent,
} from './ai-explain-package-visit-rules.util.js';
import { isGetManageLinkPrompt } from './ai-get-manage-link.util.js';
import { isRecoverLostManageLinkPrompt } from './ai-recover-lost-manage-link.util.js';
import {
  isSignInToManageBookingPrompt,
  rescueSignInToManageBookingIntent,
} from './ai-sign-in-to-manage-booking.util.js';
import {
  isExplainManageBookingPagePrompt,
  rescueExplainManageBookingPageIntent,
} from './ai-explain-manage-booking-page.util.js';
import { isNotifyRunningLatePrompt } from './ai-notify-running-late.util.js';
import { isLeaveVisitReviewPrompt } from './ai-leave-visit-review.util.js';
import { isExplainPostVisitReviewPrompt } from './ai-explain-post-visit-review-prompt.util.js';
import { isReportBookingProblemPrompt } from './ai-report-booking-problem.util.js';
import { isSignInAfterBookingPrompt } from './ai-sign-in-after-booking.util.js';
import {
  isCheckWaitlistStatusPrompt,
  isJoinWaitlistPrompt,
} from './ai-customer-waitlist.util.js';
import { hasSubscriptionFirstVisitBookCue } from './ai-subscription-first-visit-cue.util.js';
import {
  isExplainMultiServiceCartPrompt,
  rescueExplainMultiServiceCartIntent,
} from './ai-explain-multi-service-cart.util.js';
import {
  isExplainPackageSavingsPrompt,
  rescueExplainPackageSavingsIntent,
} from './ai-explain-package-savings.util.js';
import {
  isExplainSubscriptionVsOneTimePrompt,
  hasSubscriptionCheckoutCompareCue,
  rescueExplainSubscriptionVsOneTimeIntent,
} from './ai-explain-subscription-vs-one-time.util.js';

export const SELF_SERVICE_BOOKING_MUTATE_INTENTS = [
  'book_package',
  'book_multi_service',
  'select_subscription_plan',
  'use_subscription_credit',
  'cancel_my_booking',
  'reschedule_my_booking',
  'notify_running_late',
  'leave_visit_review',
  'report_booking_problem',
  'join_waitlist',
  'cancel_package_visit_self',
  'reschedule_package_visit_self',
  'book_with_cash',
  'book_with_gift_card',
  'change_provider_on_reschedule',
  'add_services_to_cart',
  'remove_service_from_cart',
] as const;

export const SELF_SERVICE_BOOKING_READ_INTENTS = [
  'check_package_availability',
  'check_multi_service_availability',
  'confirm_my_booking_details',
  'add_booking_to_calendar',
  'book_another_service',
  'explain_preparation_notes',
  'list_my_appointments',
  'list_my_upcoming_appointments',
  'list_my_package_visits',
  'get_manage_link',
  'recover_lost_manage_link',
  'sign_in_to_manage_booking',
  'explain_manage_booking_page',
  'check_waitlist_status',
  'explain_cancel_policy',
  'explain_deposit_forfeiture',
  'explain_post_visit_review_prompt',
  'sign_in_after_booking',
  'explain_multi_service_cart',
  'explain_package_savings',
  'explain_subscription_vs_one_time',
  'explain_package_visit_rules',
  'explain_lab_prep',
  'explain_public_intake_form',
  'explain_clinic_booking_fields',
  'show_cart_total_duration',
  'share_my_booking',
] as const;

export const SELF_SERVICE_BOOKING_INTENTS = [
  ...SELF_SERVICE_BOOKING_MUTATE_INTENTS,
  ...SELF_SERVICE_BOOKING_READ_INTENTS,
] as const;

export type SelfServiceBookingIntent =
  (typeof SELF_SERVICE_BOOKING_INTENTS)[number];

export interface CustomerBookingCompoundStep {
  action: SelfServiceBookingIntent;
  params: Record<string, unknown>;
  segment: string;
}

const CUSTOMER_BOOKING_VERB =
  /\b(book|reserve|schedule|cancel|reschedule|list|show|check|add|remove|select|use|pay|manage|policy|cart|package|multi|service|appointment|cash|gift|subscription|credit|provider|link|duration|total)\b/i;

const COMPOUND_NEXT =
  '(?:book|reserve|schedule|cancel|reschedule|list|show|check|add|remove|select|use|pay|manage|policy|cart|package|multi|service|appointment|cash|gift|subscription|credit|provider|link|duration|total|availability|visit|spa|my|with|explain|get)';

const COMPOUND_SPLIT = new RegExp(
  `\\s*;\\s*|\\s+and\\s+(?=${COMPOUND_NEXT}\\b)|\\s+then\\s+(?=${COMPOUND_NEXT}\\b)`,
  'i',
);

export function isSelfServiceBookingIntent(
  action: string,
): action is SelfServiceBookingIntent {
  return (SELF_SERVICE_BOOKING_INTENTS as readonly string[]).includes(action);
}

const SELF_SERVICE_FOR_CLIENT_PATTERN =
  /\bfor\s+(?!me\b|massage\b|facial\b|manicure\b|pedicure\b|haircut\b|color\b|blowdry\b|peel\b|beard\b|trim\b|spa\b|deep\b|swedish\b|tissue\b|my\s+cart\b|services?\b)[A-Za-z]/i;

const SERVICE_WORD_AFTER_WITH =
  /^(?:massage|facial|manicure|pedicure|haircut|color|blowdry|peel|beard|trim|spa|deep|tissue|swedish|a)$/i;

function isBookWithNamedProviderPrompt(prompt: string): boolean {
  const match = prompt.match(
    /\b(?:book|reserve|schedule)\b[^.?]*\bwith\s+(?:dr\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/,
  );
  if (!match?.[1]) return false;
  if (/\bwith\s+a\s+spa\b/i.test(prompt)) return false;
  const firstWord = match[1].trim().split(/\s+/)[0] ?? '';
  return !SERVICE_WORD_AFTER_WITH.test(firstWord);
}

function isDashboardCustomerBookingPrompt(prompt: string): boolean {
  return (
    /\bfor\s+(?:customer|client)\b/i.test(prompt) ||
    SELF_SERVICE_FOR_CLIENT_PATTERN.test(prompt) ||
    (hasDashboardCustomerReference(prompt) &&
      /\b(customer|client)\b/i.test(prompt))
  );
}

export function isSelfServiceCustomerPrompt(prompt: string): boolean {
  if (/\bfor\s+me\b/i.test(prompt)) return true;
  return !isDashboardCustomerBookingPrompt(prompt);
}

export function isBookPackagePrompt(prompt: string): boolean {
  if (
    /\bspa\s+day\b/i.test(prompt) &&
    /\band\b/i.test(prompt) &&
    !/\b(package|bundle|deal)\b/i.test(prompt)
  ) {
    return false;
  }
  const wantsPackage =
    /\bpackage\b/i.test(prompt) ||
    /\bbundle\b/i.test(prompt) ||
    /\bspa\s+day\b/i.test(prompt) ||
    /\bdeal\b/i.test(prompt) ||
    /փաթեթ/i.test(prompt) ||
    /пакет/i.test(prompt);
  const wantsBook =
    /\b(book|buy|purchase|order|get|reserve|schedule)\b/i.test(prompt) ||
    /ամրագրել/i.test(prompt) ||
    /(?:^|\s)(купить|купи|заброн|бронир|запис)(?:\s|$|[.,!?])/i.test(prompt);
  return (
    isSelfServiceCustomerPrompt(prompt) &&
    wantsBook &&
    wantsPackage &&
    !/\b(create|configure|update|deactivate)\b/i.test(prompt)
  );
}

export function isBookMultiServicePrompt(prompt: string): boolean {
  const wantsMultiServiceBook =
    /\b(book|reserve|schedule|start)\b/i.test(prompt) ||
    (/\b(want|need)\b/i.test(prompt) &&
      /\bmultiple\s+(?:treatments?|services?)\b/i.test(prompt)) ||
    /(amragrel|amragrum|grancvel|ամրագր)/i.test(prompt) ||
    /(зabron|бронир|запис)/i.test(prompt);
  return (
    isSelfServiceCustomerPrompt(prompt) &&
    !isBookWithNamedProviderPrompt(prompt) &&
    wantsMultiServiceBook &&
    (/\bmulti[\s-]?service\b/i.test(prompt) ||
      /\bmultiple\s+services?\b/i.test(prompt) ||
      /\bmultiple\s+treatments?\b/i.test(prompt) ||
      (/\bspa\s+day\b/i.test(prompt) &&
        /\band\b/i.test(prompt) &&
        !/\bpackage\b/i.test(prompt)) ||
      (/\b(and|together|և|ev|и|вместе)\b/i.test(prompt) &&
        /\b(massage|facial|service|services?|massage|массаж)\b/i.test(
          prompt,
        )) ||
      (/\b(schedule|reserve|book)\b/i.test(prompt) &&
        /\b[\w\s'-]+\s+and\s+[\w\s'-]+/i.test(prompt)) ||
      (/\b(want|need)\b/i.test(prompt) &&
        /\bmultiple\s+treatments?\b/i.test(prompt) &&
        /\band\b/i.test(prompt)) ||
      (/\band\b/i.test(prompt) && /\bservices?\b/i.test(prompt)) ||
      /\bbook\s+[\w\s'-]+\s+and\s+[\w\s'-]+/i.test(prompt)) &&
    !isBookPackagePrompt(prompt)
  );
}

export function isCheckPackageAvailabilityPrompt(prompt: string): boolean {
  if (
    /\bpackage\s+line\b/i.test(prompt) ||
    /\bline\s+availability\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    (/\b(check|is|when|what|show)\b/i.test(prompt) &&
      /\b(package)\b/i.test(prompt) &&
      /\b(available|availability|open|slots?|times?)\b/i.test(prompt)) ||
    /\bpackage\s+availability\b/i.test(prompt) ||
    (/(stugel|stuge|check|is|show|tsuyts)/i.test(prompt) &&
      /(package|spa day|spa\s+day|пакет|փաթեթ)/i.test(prompt) &&
      /(available|availability|open|slots?|times?|места|azat)/i.test(prompt)) ||
    (/(есть|провер|когда|свобод|доступ)/i.test(prompt) &&
      /(package|spa day|spa\s+day|пакет)/i.test(prompt) &&
      /(available|availability|места|слот|время|times?)/i.test(prompt))
  );
}

export function isCheckMultiServiceAvailabilityPrompt(prompt: string): boolean {
  if (
    /\bmulti[\s-]?service\s+block\s+availability\b/i.test(prompt) ||
    /\bblock\s+availability\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    (/\b(check|is|when|what|show)\b/i.test(prompt) &&
      (/\bmulti[\s-]?service\b/i.test(prompt) ||
        /\bmultiple\s+services?\b/i.test(prompt) ||
        /\bcart\b/i.test(prompt)) &&
      /\b(available|availability|open|slots?|times?)\b/i.test(prompt)) ||
    /\bmulti[\s-]?service\s+availability\b/i.test(prompt) ||
    (/\bwhen\s+can\s+(?:i|we)\s+(?:get|book)\b/i.test(prompt) &&
      /\band\b/i.test(prompt)) ||
    (/\b(open|times?)\b/i.test(prompt) &&
      /\bfor\b/i.test(prompt) &&
      /\band\b/i.test(prompt)) ||
    (/(stugel|stuge|check|is|show|tsuyts)/i.test(prompt) &&
      /(multi[\s-]?service|multiple services|cart|multi service)/i.test(
        prompt,
      ) &&
      /(available|availability|open|slots?|times?)/i.test(prompt)) ||
    (/(провер|есть|когда|доступ|свобод)/i.test(prompt) &&
      /(multi[\s-]?service|multi service|корзин|нескольк)/i.test(prompt) &&
      /(available|availability|доступн|слот|места)/i.test(prompt))
  );
}

export function isSelectSubscriptionPlanPrompt(prompt: string): boolean {
  if (hasSubscriptionCheckoutCompareCue(prompt)) return false;
  return (
    ((/\b(select|choose|pick|sign\s+up\s+for|subscribe\s+to)\b/i.test(prompt) &&
      /\b(subscription|membership|plan)\b/i.test(prompt)) ||
      (/ընtrel/i.test(prompt) &&
        /(amsakan|plan|abonament|պlan|subscription|membership)/i.test(
          prompt,
        )) ||
      (/(выбрать|выбер|подпис|оформ)/i.test(prompt) &&
        /(план|подписк|абонемент|membership)/i.test(prompt))) &&
    !/\b(discover|list|show\s+all)\b/i.test(prompt)
  );
}

export function isUseSubscriptionCreditPrompt(prompt: string): boolean {
  if (hasSubscriptionCheckoutCompareCue(prompt)) return false;
  if (
    (/\b(use|apply|redeem)\b/i.test(prompt) ||
      /\b(?:book|pay)\b/i.test(prompt)) &&
    /\b(?:membership|subscription|plan)\b/i.test(prompt) &&
    hasSubscriptionFirstVisitBookCue(prompt)
  ) {
    return false;
  }
  if (/\b(create|assign|extend|cancel)\b/i.test(prompt)) return false;
  if (
    /\b(show|list|view|discover|open)\b/i.test(prompt) &&
    !/\b(use|apply|redeem)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    (/\b(use|apply|redeem)\b/i.test(prompt) &&
      /\b(subscription|membership|credit|visit)s?\b/i.test(prompt)) ||
    (/\b(book|pay)\b/i.test(prompt) &&
      /\b(?:with\s+)?my\s+(subscription|membership|plan)\b/i.test(prompt)) ||
    /\bpay\s+with\s+membership\b/i.test(prompt) ||
    /\buse\s+my\s+membership\b/i.test(prompt) ||
    (/(օգt|ogtagorz|օգtagorz)/i.test(prompt) &&
      /(abonament|subscription|membership|credit|kredit|visit)/i.test(
        prompt,
      )) ||
    (/(использов|примен|списать|использ)/i.test(prompt) &&
      /(подписк|кредит|абонемент|визит|membership|credit)/i.test(prompt))
  );
}

export function hasCancelMyBookingCoreCue(prompt: string): boolean {
  if (isExplainCancelPolicyPrompt(prompt)) return false;
  if (isNotifyRunningLatePrompt(prompt)) return false;
  if (/\b(cancel\s+bookings|cancel\s+all|cancel\s+every)\b/i.test(prompt)) {
    return false;
  }
  return (
    ((/\b(cancel)\b/i.test(prompt) &&
      /\b(my|this|upcoming|next)\b/i.test(prompt) &&
      /\b(booking|appointment|visit|reservation)\b/i.test(prompt)) ||
      (/\b(cancel)\b/i.test(prompt) &&
        /\b(it|this)\b/i.test(prompt) &&
        /\b(no\s+longer\s+need|don't\s+need)\b/i.test(prompt)) ||
      (/\b(cancel)\b/i.test(prompt) &&
        /\b(tomorrow|today|tonight|next\s+week)\b/i.test(prompt)) ||
      (/\b(cancel)\b/i.test(prompt) &&
        /\b(without\s+calling|no\s+longer\s+need|don't\s+need)\b/i.test(
          prompt,
        )) ||
      (/\b(cancel)\b/i.test(prompt) &&
        /\bmy\b/i.test(prompt) &&
        /\b(massage|haircut|facial|color|manicure|blowdry|service)\b/i.test(
          prompt,
        )) ||
      (/\b(cancel)\b/i.test(prompt) &&
        /\b(massage|haircut|facial|color|manicure|blowdry)\b/i.test(prompt)) ||
      (/\b(cancel)\b/i.test(prompt) &&
        /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(
          prompt,
        )) ||
      (/(չեղարկ|չեղարկել)/i.test(prompt) &&
        /(իմ|այս)/i.test(prompt) &&
        /(amրag|amrag|visit|booking|appointment|ամրագր)/i.test(prompt)) ||
      (/(отмен|отменить|отмени)/i.test(prompt) &&
        /(мою|моя|мой|эту|это)/i.test(prompt) &&
        /(запис|визит|бронь|бронирован)/i.test(prompt))) &&
    !/\bpackage\s+visit\b/i.test(prompt) &&
    !/\bspa\s+day\b/i.test(prompt) &&
    (!hasDashboardCustomerReference(prompt) ||
      /\b(my|I\s+booked)\b/i.test(prompt))
  );
}

function hasCancelAndRebookBookCue(prompt: string): boolean {
  if (isBookNearestSlotPrompt(prompt)) return true;
  return (
    /\b(?:book|schedule|reserve|get)\b/i.test(prompt) &&
    /\b(?:nearest|soonest|next|earliest|first\s+available|asap|available\s+slot|opening)\b/i.test(
      prompt,
    )
  );
}

function shouldDeferToCancelAndRebookCompound(prompt: string): boolean {
  if (!hasCancelAndRebookBookCue(prompt)) return false;
  if (isExplainCancelPolicyPrompt(prompt)) return false;
  if (isCancelPackageVisitSelfPrompt(prompt)) return false;
  if (/\bcancel\s+bookings\b/i.test(prompt)) return false;
  return /\bcancel\b/i.test(prompt);
}

export function isCancelMyBookingPrompt(prompt: string): boolean {
  if (shouldDeferToCancelAndRebookCompound(prompt)) return false;
  if (isCancelPackageVisitSelfPrompt(prompt)) return false;
  return hasCancelMyBookingCoreCue(prompt);
}

export function isRescheduleMyBookingPrompt(prompt: string): boolean {
  if (isReschedulePackageVisitSelfPrompt(prompt)) return false;
  return (
    ((/\b(reschedule|move|change|shift)\b/i.test(prompt) &&
      /\b(my|this|upcoming|next)\b/i.test(prompt) &&
      /\b(booking|appointment|visit|reservation)\b/i.test(prompt)) ||
      (/\b(reschedule|move|change|shift)\b/i.test(prompt) &&
        /\b(to|for)\b/i.test(prompt) &&
        /\b(tomorrow|today|tonight|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(
          prompt,
        )) ||
      (/\b(reschedule|move|change|shift)\b/i.test(prompt) &&
        /\b(without\s+calling|no\s+need\s+to\s+call)\b/i.test(prompt)) ||
      (/\b(move|reschedule|change|shift)\b/i.test(prompt) &&
        /\bmy\b/i.test(prompt) &&
        /\b(massage|haircut|facial|color|manicure|blowdry|service)\b/i.test(
          prompt,
        )) ||
      (/\b(reschedule|move|change|shift)\b/i.test(prompt) &&
        /\b(massage|haircut|facial|color|manicure|blowdry)\b/i.test(prompt)) ||
      (/\b(need\s+to|want\s+to)\b/i.test(prompt) &&
        /\b(move|reschedule|change)\b/i.test(prompt) &&
        /\b(my|this)\b/i.test(prompt) &&
        /\b(appointment|booking|visit)\b/i.test(prompt)) ||
      (/վերամրագր/i.test(prompt) &&
        /(իմ|այս)/i.test(prompt) &&
        /(amրag|amrag|visit|booking|appointment|ամրագր)/i.test(prompt)) ||
      (/(перенес|перенести|измен|изменить|перенос)/i.test(prompt) &&
        /(мою|моя|мой|эту|это)/i.test(prompt) &&
        /(запис|визит|бронь|бронирован)/i.test(prompt))) &&
    !/\bpackage\s+visit\b/i.test(prompt) &&
    !/\bspa\s+day\b/i.test(prompt) &&
    (!hasDashboardCustomerReference(prompt) ||
      /\b(my|I\s+booked)\b/i.test(prompt))
  );
}

export { isReschedulePackageVisitSelfPrompt } from './ai-reschedule-package-visit-self.util.js';

export function isListMyAppointmentsPrompt(prompt: string): boolean {
  if (isListMyUpcomingAppointmentsPrompt(prompt)) return false;
  return (
    ((/\bmy\b/i.test(prompt) &&
      /\blist\b/i.test(prompt) &&
      /\b(upcoming\s+)?appointments?\b/i.test(prompt)) ||
      (/(list|show|canq|cucak|tsuyts)/i.test(prompt) &&
        /(իմ|im|my|mine)/i.test(prompt) &&
        /(amragрум|amragrum|appointment|visit|amagрум|amagруmner|amagруmner@|amagруmneri|запис|приём|прием)/i.test(
          prompt,
        )) ||
      (/(список|показ|list|show)/i.test(prompt) &&
        /(мои|моих|мою|моей)/i.test(prompt) &&
        /(запис|приём|прием|appointment|visit)/i.test(prompt))) &&
    !/\b(subscription|gift|package\s+visit|package\s+appointment|package\s+bundle)\b/i.test(
      prompt,
    ) &&
    !isListMyPackageVisitsCustomerPrompt(prompt) &&
    !hasDashboardCustomerReference(prompt)
  );
}

export function isListMyPackageVisitsCustomerPrompt(prompt: string): boolean {
  if (isExplainPackageVisitRulesPrompt(prompt)) return false;
  if (isCancelPackageVisitSelfPrompt(prompt)) return false;
  if (isReschedulePackageVisitSelfPrompt(prompt)) return false;
  if (
    hasDashboardCustomerReference(prompt) &&
    !/\bmy\b/i.test(prompt) &&
    !/\bon\s+my\s+account\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(list|show)\b/i.test(prompt) &&
    /\bpackage\s+(visits?|bookings?)\b/i.test(prompt) &&
    !/\bmy\b/i.test(prompt) &&
    !/\bon\s+my\s+account\b/i.test(prompt)
  ) {
    return false;
  }

  const packageContext =
    /\b(package\s+visits?|spa\s+day|package\s+bundle|package\s+appointment)\b/i.test(
      prompt,
    ) ||
    (/\bpackage\b/i.test(prompt) &&
      /\b(visit|appointment|bundle)\b/i.test(prompt)) ||
    /\bmy\s+package\b/i.test(prompt) ||
    (/\bbundle\b/i.test(prompt) &&
      /\b(my|next|facial|spa\s+day)\b/i.test(prompt));

  const selfScope =
    /\bmy\b/i.test(prompt) ||
    /\bon\s+my\s+account\b/i.test(prompt) ||
    (/\b(how\s+many|visits?\s+left|remaining|still\s+have)\b/i.test(prompt) &&
      (/\bpackage\b/i.test(prompt) ||
        /\bspa\s+day\b/i.test(prompt) ||
        /\bbundle\b/i.test(prompt)) &&
      !hasDashboardCustomerReference(prompt));

  const readCue =
    /\b(list|show|view|see|what|when|how\s+many|status|progress)\b/i.test(
      prompt,
    ) || /\b(visits?\s+left|remaining|still\s+have|next)\b/i.test(prompt);

  return packageContext && selfScope && readCue;
}

export {
  isExplainCancelPolicyPrompt,
  rescueExplainCancelPolicyIntent,
} from './ai-explain-cancel-policy.util.js';
export {
  isExplainPackageVisitRulesPrompt,
  rescueExplainPackageVisitRulesIntent,
} from './ai-explain-package-visit-rules.util.js';
export {
  isExplainPostVisitReviewPrompt,
  rescueExplainPostVisitReviewPromptIntent,
} from './ai-explain-post-visit-review-prompt.util.js';
export {
  isReportBookingProblemPrompt,
  rescueReportBookingProblemIntent,
} from './ai-report-booking-problem.util.js';
export {
  isGetManageLinkPrompt,
  rescueGetManageLinkIntent,
} from './ai-get-manage-link.util.js';
export {
  isNotifyRunningLatePrompt,
  rescueNotifyRunningLateIntent,
} from './ai-notify-running-late.util.js';
export {
  isLeaveVisitReviewPrompt,
  rescueLeaveVisitReviewIntent,
} from './ai-leave-visit-review.util.js';
export {
  isJoinWaitlistPrompt,
  isCheckWaitlistStatusPrompt,
  rescueJoinWaitlistIntent,
  rescueCheckWaitlistStatusIntent,
  rescueCustomerWaitlistIntent,
} from './ai-customer-waitlist.util.js';

export function isBookWithCashPrompt(prompt: string): boolean {
  return (
    isSelfServiceCustomerPrompt(prompt) &&
    (/\b(book|reserve|schedule)\b/i.test(prompt) ||
      /(amragrel|amragrum|grancvel|ամրագր)/i.test(prompt) ||
      (/(заброн|запис|бронир)/i.test(prompt) &&
        /(налич|cash|оплат)/i.test(prompt))) &&
    (/\b(cash|pay\s+cash|cash\s+at\s+visit|pay\s+at\s+(?:the\s+)?venue)\b/i.test(
      prompt,
    ) ||
      /(cash|nakits|налич|наличн)/i.test(prompt)) &&
    !/\bwalk[\s-]?in\b/i.test(prompt)
  );
}

export { isBookWithGiftCardPrompt } from './ai-book-with-gift-card.util.js';

export function isChangeProviderOnReschedulePrompt(prompt: string): boolean {
  return (
    (/\b(change|switch|different)\b/i.test(prompt) &&
      /\b(provider|specialist|stylist|therapist|employee)\b/i.test(prompt) &&
      /\b(reschedule|when\s+i\s+reschedule|on\s+reschedule)\b/i.test(prompt)) ||
    (/(poxanvel|փoxanvel|change|switch)/i.test(prompt) &&
      /(specialist|provider|stylist|therapist|employee|մասնagir)/i.test(
        prompt,
      ) &&
      /(reschedule|վeramagr|amragrum|перенос|перенес)/i.test(prompt)) ||
    (/(смен|друг|измен)/i.test(prompt) &&
      /(специалист|мастер|стилист|provider|specialist)/i.test(prompt) &&
      /(перенос|перенес|reschedule)/i.test(prompt))
  );
}

export function isAddServicesToCartPrompt(prompt: string): boolean {
  if (/\b(category|catalog|linked\s+services?|translations?)\b/i.test(prompt))
    return false;
  return (
    ((/\b(add|include|put)\b/i.test(prompt) &&
      (/\b(cart|basket|visit)\b/i.test(prompt) ||
        /\bservices?\b/i.test(prompt))) ||
      (/(avelacnel|avelyacnel|avelac)/i.test(prompt) &&
        /(zambyugh|zangvac|cart|service|massage|mersum)/i.test(prompt)) ||
      (/(добав|полож|добавить)/i.test(prompt) &&
        /(корзин|услуг|massage|массаж|service)/i.test(prompt))) &&
    !/\b(remove|delete|clear)\b/i.test(prompt)
  );
}

export function isRemoveServiceFromCartPrompt(prompt: string): boolean {
  return (
    (/\b(remove|delete|drop|take\s+out)\b/i.test(prompt) &&
      (/\b(cart|basket|visit)\b/i.test(prompt) ||
        /\bservice\b/i.test(prompt))) ||
    (/(heecacnel|heecac|hncacnel|հeecac|հeecacnel)/i.test(prompt) &&
      /(zambyugh|zangvac|cart|basket|service|massage|facial|զambyugh)/i.test(
        prompt,
      )) ||
    (/(удал|убра|убери|удалить)/i.test(prompt) &&
      /(корзин|услуг|massage|массаж|service|facial)/i.test(prompt))
  );
}

export function isShowCartTotalDurationPrompt(prompt: string): boolean {
  if (isExplainMultiServiceCartPrompt(prompt)) return false;
  return (
    (/\b(show|what\s+is|how\s+long|total)\b/i.test(prompt) &&
      (/\b(cart|basket|visit)\b/i.test(prompt) ||
        /\bselected\s+services?\b/i.test(prompt)) &&
      /\b(duration|time|minutes?|long)\b/i.test(prompt)) ||
    /\bcart\s+total\s+duration\b/i.test(prompt) ||
    (/(tsuyts|tsuyc|cuyts|show)/i.test(prompt) &&
      /(zambyugh|zangvac|cart|basket|զambyugh)/i.test(prompt) &&
      /(duration|time|tevox|ev\.?or|minutes|long|ըndhanur|teox)/i.test(
        prompt,
      )) ||
    (/(показ|сколько|общ)/i.test(prompt) &&
      /(корзин|длительн|cart|basket)/i.test(prompt))
  );
}

export { isCancelPackageVisitSelfPrompt } from './ai-cancel-package-visit-self.util.js';

export function extractBookingIdFromPrompt(prompt: string): string | undefined {
  const match =
    prompt.match(/\bbooking\s*#?\s*([a-z0-9-]{6,})\b/i) ??
    prompt.match(/\bappointment\s*#?\s*([a-z0-9-]{6,})\b/i);
  return match?.[1];
}

export function extractPackageNameFromPrompt(
  prompt: string,
): string | undefined {
  if (/\bspa\s+day\b/i.test(prompt)) return 'Spa Day';
  const quoted = prompt.match(/["']([^"']+?)["']\s+package/i)?.[1];
  if (quoted) return quoted.trim();
  const named = prompt.match(
    /\b(?:book|reserve|schedule|check)\s+(?:the\s+)?([a-z][\w\s-]{2,30}?)\s+package\b/i,
  );
  if (named?.[1]) return named[1].trim();
  return undefined;
}

export function extractServiceNamesFromPrompt(prompt: string): string[] {
  const names: string[] = [];
  const quoted = [...prompt.matchAll(/["']([^"']+?)["']/g)].map((m) =>
    m[1].trim(),
  );
  names.push(...quoted);
  const addMatch = prompt.match(/\badd\s+(.+?)\s+to\s+(?:my\s+)?cart\b/i);
  if (addMatch?.[1]) {
    for (const part of addMatch[1].split(/\s+and\s+|,/i)) {
      const trimmed = part.trim();
      if (trimmed) names.push(trimmed);
    }
  }
  const removeMatch = prompt.match(
    /\bremove\s+(.+?)\s+from\s+(?:my\s+)?cart\b/i,
  );
  if (removeMatch?.[1]) names.push(removeMatch[1].trim());

  const wantMatch = prompt.match(
    /\b(?:want|need|would\s+like|looking\s+for)\s+(.+?)(?:\s+tomorrow|\s+today|\s+(?:this|next)\s+\w+|\s+on\s+|\s+(?:morning|afternoon|evening)|\?|$)/i,
  );
  if (wantMatch?.[1] && /\band\b/i.test(wantMatch[1])) {
    const clause = wantMatch[1].replace(
      /^\s*multiple\s+(?:treatments?|services?)\s*[—–-]\s*/i,
      '',
    );
    for (const part of clause.split(/\s+and\s+|,/i)) {
      const trimmed = part.trim();
      if (trimmed.length >= 3) names.push(trimmed);
    }
  }

  const spaDayWithPair = prompt.match(
    /\bbook\s+a\s+spa\s+day\s+with\s+(.+?)\s+and\s+(.+?)(?:\s*$|\?)/i,
  );
  if (spaDayWithPair) {
    names.push(spaDayWithPair[1].trim(), spaDayWithPair[2].trim());
  } else {
    const bookPair = prompt.match(
      /\bbook\s+(?!a\s+spa\s+day\b)(.+?)\s+and\s+(.+?)(?:\s+together|\s+same\s+visit|\s+for\s+me|\?|$)/i,
    );
    if (bookPair) {
      names.push(bookPair[1].trim(), bookPair[2].trim());
    }
  }

  const schedulePair = prompt.match(
    /\b(?:schedule|reserve)\s+(.+?)\s+and\s+(.+?)(?:\s+on\s+(?:the\s+same|one)\s+visit|\s+together|\?|$)/i,
  );
  if (schedulePair) {
    names.push(schedulePair[1].trim(), schedulePair[2].trim());
  }

  const leadingPair = prompt.match(
    /^([A-Za-z][\w\s'-]+?)\s+and\s+([A-Za-z][\w\s'-]+?)\s+same\s+/i,
  );
  if (leadingPair) {
    names.push(
      leadingPair[1].trim().toLowerCase(),
      leadingPair[2].trim().toLowerCase(),
    );
  }

  const findTimeForPair = prompt.match(
    /\bfind\s+a\s+time\s+for\s+(.+?)\s+and\s+(.+?)(?:\s+on\b|\?|$)/i,
  );
  if (findTimeForPair) {
    names.push(findTimeForPair[1].trim(), findTimeForPair[2].trim());
  } else {
    const findTimePair = prompt.match(
      /\bfor\s+(.+?)\s+and\s+(.+?)(?:\s+on\b|\s+this\b|\s+tomorrow|\s+today|\s+this\s+week|\?|$)/i,
    );
    if (findTimePair) {
      names.push(findTimePair[1].trim(), findTimePair[2].trim());
    }
  }

  const whenGetPair = prompt.match(
    /\bwhen\s+can\s+i\s+(?:get|book)\s+(.+?)\s+and\s+(.+?)(?:\s+together|\?|$)/i,
  );
  if (whenGetPair) {
    names.push(whenGetPair[1].trim(), whenGetPair[2].trim());
  }

  return pruneExtractedServiceNames(names);
}

function pruneExtractedServiceNames(names: string[]): string[] {
  const normalized = names
    .map((name) =>
      name
        .trim()
        .replace(/^(?:schedule|reserve|book)\s+/i, '')
        .replace(/^\s*multi[\s-]?service\s+/i, '')
        .replace(/^\s*multiple\s+(?:treatments?|services?)\s*[—–-]\s*/i, '')
        .replace(/\s+for\s+me$/i, '')
        .replace(/^\s*find\s+a\s+time\s+for\s+/i, '')
        .replace(/\s+(?:tomorrow|today|this\s+week)$/i, '')
        .replace(/\s+on\s+one\s+visit$/i, '')
        .replace(/\s+on\s+the(?:\s+same(?:\s+visit)?)?$/i, '')
        .trim(),
    )
    .filter((name) => name.length >= 2);
  const unique: string[] = [];
  for (const name of normalized) {
    const key = name.toLowerCase();
    if (!unique.some((existing) => existing.toLowerCase() === key)) {
      unique.push(name);
    }
  }
  return unique;
}

export function enrichMultiServiceAvailabilityParams(
  prompt: string,
  params: Record<string, unknown>,
  tz: string,
): Record<string, unknown> {
  const enriched = { ...params };
  const effectivePrompt = prompt || String(params._prompt ?? '');

  if (
    !Array.isArray(enriched.serviceNames) ||
    !(enriched.serviceNames as string[]).length
  ) {
    const names = extractServiceNamesFromPrompt(effectivePrompt);
    if (names.length) enriched.serviceNames = names;
  }

  if (!enriched.date) {
    const dateParams: Record<string, unknown> = {};
    applyRelativeDateFromPrompt(dateParams, effectivePrompt, tz);
    if (dateParams.date) {
      enriched.date =
        toIsoDay(String(dateParams.date), tz) ?? String(dateParams.date);
    }
  } else if (typeof enriched.date === 'string') {
    enriched.date = toIsoDay(enriched.date.trim(), tz) ?? enriched.date;
  }

  const timeOfDay = parseTimeOfDayWindow(effectivePrompt, enriched);
  if (timeOfDay) enriched.timeOfDay = timeOfDay;

  const notBeforeTime = notBeforeTimeFromWindow(effectivePrompt, enriched);
  if (notBeforeTime) enriched.notBeforeTime = notBeforeTime;

  return enriched;
}

export function filterMultiServiceSlotsByTimePreference<
  T extends { startTime: string },
>(
  slots: T[],
  opts: {
    timeOfDay?: TimeOfDayWindow | null;
    notBeforeTime?: string | null;
  },
): T[] {
  if (opts.timeOfDay) {
    return slots.filter((slot) => {
      const hhmm = formatTimeDisplay(slot.startTime);
      return slotOverlapsTimeWindow(hhmm, undefined, opts.timeOfDay!);
    });
  }
  if (opts.notBeforeTime) {
    const floor = timeToMinutes(opts.notBeforeTime);
    return slots.filter((slot) => {
      const hhmm = formatTimeDisplay(slot.startTime);
      return timeToMinutes(hhmm) >= floor;
    });
  }
  return slots;
}

export function buildMultiServiceAvailabilitySummary(input: {
  slots: Array<{ startTime: string; employeeName: string }>;
  dateKey: string;
  timeOfDay?: TimeOfDayWindow | null;
}): string {
  const dateLabel = formatDateDisplay(input.dateKey);
  const windowLabel = input.timeOfDay
    ? formatTimeOfDayLabel(input.timeOfDay)
    : null;
  const header = windowLabel
    ? `${input.slots.length} block slot(s) on ${dateLabel} (${windowLabel}):`
    : `${input.slots.length} block slot(s) on ${dateLabel}:`;
  const lines = input.slots.map(
    (slot) =>
      `• ${formatTimeDisplay(slot.startTime)} with ${slot.employeeName}`,
  );
  return [header, '', ...lines].join('\n');
}

export function isMultiServiceAvailabilityDiscoveryPrompt(
  prompt: string,
): boolean {
  if (
    /\bmulti[\s-]?service\s+(?:blocks?|availability)\b/i.test(prompt) ||
    (/\b(show|check)\b/i.test(prompt) &&
      /\bmulti[\s-]?service\b/i.test(prompt) &&
      /\b(open|blocks?|availability)\b/i.test(prompt))
  ) {
    return false;
  }
  if (
    /\b(want|need)\b/i.test(prompt) &&
    /\bmultiple\s+(?:treatments?|services?)\b/i.test(prompt) &&
    !/\b(when|who|available|availability|free|open|time)\b/i.test(prompt)
  ) {
    return false;
  }

  const isAvailabilityQuestion =
    /\b(?:when|what)\s+(?:can|are)\s+(?:i|we)\b/i.test(prompt) ||
    /\bwhat\s+times?\s+are\s+open\b/i.test(prompt) ||
    /\bwho\s+is\s+free\b/i.test(prompt);

  const services = extractServiceNamesFromPrompt(prompt);
  const hasCompoundServices =
    services.length >= 2 ||
    (/\band\b/i.test(prompt) &&
      (/\b(want|need|would\s+like|looking\s+for)\b/i.test(prompt) ||
        isAvailabilityQuestion ||
        (/\b(open|times?)\b/i.test(prompt) && /\bfor\b/i.test(prompt))));
  if (!hasCompoundServices) return false;

  const hasExplicitBookTime =
    /\b(book|reserve|schedule)\b/i.test(prompt) &&
    !/\b(want|need|would\s+like)\b/i.test(prompt) &&
    !isAvailabilityQuestion &&
    (/\bat\s+\d{1,2}(?::\d{2})?\b/i.test(prompt) ||
      /\b\d{1,2}:\d{2}\b/.test(prompt));
  if (hasExplicitBookTime) return false;

  if (
    /\b(book|reserve|schedule)\b/i.test(prompt) &&
    !/\b(want|need|would\s+like|looking\s+for)\b/i.test(prompt) &&
    !isAvailabilityQuestion
  ) {
    return false;
  }

  return (
    /\b(want|need|would\s+like|looking\s+for)\b/i.test(prompt) ||
    isAvailabilityQuestion ||
    /\b(who\s+is\s+free|availability|available)\b/i.test(prompt) ||
    /\bfind\s+(?:a\s+)?time\b/i.test(prompt) ||
    /\b(tomorrow|today|morning|afternoon|evening|tonight)\b/i.test(prompt)
  );
}

export function buildMultiServiceAvailabilityFromSlots(
  slots: Array<{
    startTime: string;
    employeeId?: string;
    employeeName: string;
  }>,
): Array<{
  id?: string;
  name: string;
  previewTimes: string[];
}> {
  const byEmployee = new Map<
    string,
    { id?: string; name: string; previewTimes: string[] }
  >();

  for (const slot of slots) {
    const key = slot.employeeId ?? slot.employeeName;
    const time = formatTimeDisplay(slot.startTime);
    const existing = byEmployee.get(key);
    if (existing) {
      if (!existing.previewTimes.includes(time)) {
        existing.previewTimes = [...existing.previewTimes, time].sort();
      }
      continue;
    }
    byEmployee.set(key, {
      id: slot.employeeId,
      name: slot.employeeName,
      previewTimes: [time],
    });
  }

  return [...byEmployee.values()];
}

export function buildMultiServiceNoSlotsSummary(input: {
  dateKey?: string;
  timeOfDay?: TimeOfDayWindow | null;
  scanDays?: number;
}): string {
  const windowLabel = input.timeOfDay
    ? formatTimeOfDayLabel(input.timeOfDay)
    : null;
  if (input.dateKey) {
    const dateLabel = formatDateDisplay(input.dateKey);
    return windowLabel
      ? `No ${windowLabel} blocks on ${dateLabel} for these services together.`
      : `No block slots on ${dateLabel} for these services together.`;
  }
  const days = input.scanDays ?? PUBLIC_AVAILABILITY_SCAN_DAYS;
  return windowLabel
    ? `No ${windowLabel} blocks in the next ${days} days for these services together.`
    : `No multi-service blocks available for these services together.`;
}

export function extractPlanNameFromPrompt(prompt: string): string | undefined {
  return (
    prompt.match(/["']([^"']+?)["']\s+(?:plan|membership)/i)?.[1]?.trim() ??
    prompt
      .match(
        /\b(?:select|choose|pick)\s+(?:the\s+)?([a-z][\w\s-]{2,40}?)\s+(?:plan|membership)\b/i,
      )?.[1]
      ?.trim()
  );
}

export function extractGiftCardCodeFromPrompt(
  prompt: string,
): string | undefined {
  return (
    prompt.match(/\bcode\s+([A-Z0-9-]{4,})\b/i)?.[1] ??
    prompt.match(/\b([A-Z]{2,}\d{4,})\b/)?.[1]
  );
}

export function extractEmployeeNameFromPrompt(
  prompt: string,
): string | undefined {
  return (
    prompt.match(/\b(?:with|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/)?.[1] ??
    prompt.match(/\bprovider\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i)?.[1]
  );
}

export function parseCartServiceIds(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    );
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function isCustomerBookingCompoundPrompt(prompt: string): boolean {
  const steps = decomposeCustomerBookingCompoundPrompt(prompt);
  return steps.length >= 2;
}

function matchSelfServiceMultilingualScenario(
  prompt: string,
): (typeof SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS)[number] | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of SELF_SERVICE_BOOKING_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

/** NL rescue when classifier returns unknown or a nearby action. */
export function rescueSelfServiceBookingIntent(
  prompt: string,
  action: string,
): { action: SelfServiceBookingIntent; rescueReason: string } | null {
  if (
    action === 'book_multi_service' &&
    isMultiServiceAvailabilityDiscoveryPrompt(prompt)
  ) {
    return {
      action: 'check_multi_service_availability',
      rescueReason: 'multi_service_availability_discovery',
    };
  }
  const explainCartEarly = rescueExplainMultiServiceCartIntent(prompt, action);
  if (explainCartEarly) return explainCartEarly;
  const explainPackageSavingsEarly = rescueExplainPackageSavingsIntent(
    prompt,
    action,
  );
  if (explainPackageSavingsEarly) return explainPackageSavingsEarly;
  const explainSubscriptionVsOneTimeEarly =
    rescueExplainSubscriptionVsOneTimeIntent(prompt, action);
  if (explainSubscriptionVsOneTimeEarly)
    return explainSubscriptionVsOneTimeEarly;
  const explainLabPrepEarly = rescueExplainLabPrepIntent(prompt, action);
  if (explainLabPrepEarly) return explainLabPrepEarly;
  const explainPublicIntakeFormEarly = rescueExplainPublicIntakeFormIntent(
    prompt,
    action,
  );
  if (explainPublicIntakeFormEarly) return explainPublicIntakeFormEarly;
  const explainPreparationNotesEarly = rescueExplainPreparationNotesIntent(
    prompt,
    action,
  );
  if (explainPreparationNotesEarly) return explainPreparationNotesEarly;
  const explainManageBookingPageEarly = rescueExplainManageBookingPageIntent(
    prompt,
    action,
  );
  if (explainManageBookingPageEarly) return explainManageBookingPageEarly;
  if (isSelfServiceBookingIntent(action)) return null;
  if (isCustomerBookingCompoundPrompt(prompt)) return null;

  const multilingualScenario = matchSelfServiceMultilingualScenario(prompt);
  if (multilingualScenario) {
    return {
      action: multilingualScenario.expectedAction,
      rescueReason: multilingualScenario.rescueReason,
    };
  }
  if (isShowCartTotalDurationPrompt(prompt)) {
    return {
      action: 'show_cart_total_duration',
      rescueReason: 'cart_duration',
    };
  }
  if (isRemoveServiceFromCartPrompt(prompt)) {
    return { action: 'remove_service_from_cart', rescueReason: 'remove_cart' };
  }
  if (isAddServicesToCartPrompt(prompt)) {
    return { action: 'add_services_to_cart', rescueReason: 'add_cart' };
  }
  if (isChangeProviderOnReschedulePrompt(prompt)) {
    return {
      action: 'change_provider_on_reschedule',
      rescueReason: 'change_provider',
    };
  }
  if (isBookWithGiftCardPrompt(prompt)) {
    return (
      rescueBookWithGiftCardIntent(prompt, action) ?? {
        action: 'book_with_gift_card',
        rescueReason: 'book_gift_card',
      }
    );
  }
  if (isBookWithCashPrompt(prompt)) {
    return { action: 'book_with_cash', rescueReason: 'book_cash' };
  }
  if (isExplainDepositForfeiturePrompt(prompt)) {
    return {
      action: 'explain_deposit_forfeiture',
      rescueReason: 'deposit_forfeiture',
    };
  }
  if (isExplainCancelPolicyPrompt(prompt)) {
    return { action: 'explain_cancel_policy', rescueReason: 'cancel_policy' };
  }
  if (isExplainPackageVisitRulesPrompt(prompt)) {
    return {
      action: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
    };
  }
  if (isShareMyBookingPrompt(prompt)) {
    return { action: 'share_my_booking', rescueReason: 'share_my_booking' };
  }
  if (isSignInAfterBookingPrompt(prompt)) {
    return {
      action: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
    };
  }
  const explainManageBookingPage = rescueExplainManageBookingPageIntent(
    prompt,
    action,
  );
  if (explainManageBookingPage) return explainManageBookingPage;
  if (isSignInToManageBookingPrompt(prompt)) {
    return {
      action: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
    };
  }
  if (isRecoverLostManageLinkPrompt(prompt)) {
    return {
      action: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
    };
  }
  if (isGetManageLinkPrompt(prompt)) {
    return { action: 'get_manage_link', rescueReason: 'manage_link' };
  }
  if (isListMyPackageVisitsCustomerPrompt(prompt)) {
    return {
      action: 'list_my_package_visits',
      rescueReason: 'list_package_visits',
    };
  }
  if (isBookAnotherServicePrompt(prompt)) {
    return {
      action: 'book_another_service',
      rescueReason: 'book_another_service',
    };
  }
  if (isMultiServiceAvailabilityDiscoveryPrompt(prompt)) {
    return {
      action: 'check_multi_service_availability',
      rescueReason: 'multi_service_availability_discovery',
    };
  }
  if (isCheckMultiServiceAvailabilityPrompt(prompt)) {
    return {
      action: 'check_multi_service_availability',
      rescueReason: 'multi_availability',
    };
  }
  if (isListMyUpcomingAppointmentsPrompt(prompt)) {
    return {
      action: 'list_my_upcoming_appointments',
      rescueReason: 'list_upcoming_appointments',
    };
  }
  if (isListMyAppointmentsPrompt(prompt)) {
    return {
      action: 'list_my_appointments',
      rescueReason: 'list_appointments',
    };
  }
  if (isReschedulePackageVisitSelfPrompt(prompt)) {
    return {
      action: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    };
  }
  if (isCancelPackageVisitSelfPrompt(prompt)) {
    return {
      action: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    };
  }
  if (isRescheduleMyBookingPrompt(prompt)) {
    return { action: 'reschedule_my_booking', rescueReason: 'reschedule_my' };
  }
  if (isReportBookingProblemPrompt(prompt)) {
    return {
      action: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
    };
  }
  if (isExplainPostVisitReviewPrompt(prompt)) {
    return {
      action: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
    };
  }
  if (isLeaveVisitReviewPrompt(prompt)) {
    return {
      action: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
    };
  }
  if (isNotifyRunningLatePrompt(prompt)) {
    return {
      action: 'notify_running_late',
      rescueReason: 'notify_running_late',
    };
  }
  if (isCheckWaitlistStatusPrompt(prompt)) {
    return {
      action: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    };
  }
  if (isJoinWaitlistPrompt(prompt)) {
    return { action: 'join_waitlist', rescueReason: 'join_waitlist' };
  }
  if (isCancelMyBookingPrompt(prompt)) {
    return { action: 'cancel_my_booking', rescueReason: 'cancel_my' };
  }
  if (isUseSubscriptionCreditPrompt(prompt)) {
    return {
      action: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    };
  }
  if (isExplainSubscriptionVsOneTimePrompt(prompt)) {
    return {
      action: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
    };
  }
  if (isSelectSubscriptionPlanPrompt(prompt)) {
    return { action: 'select_subscription_plan', rescueReason: 'select_plan' };
  }
  if (isCheckPackageAvailabilityPrompt(prompt)) {
    return {
      action: 'check_package_availability',
      rescueReason: 'package_availability',
    };
  }
  if (isExplainPackageSavingsPrompt(prompt)) {
    return {
      action: 'explain_package_savings',
      rescueReason: 'package_savings',
    };
  }
  if (isBookMultiServicePrompt(prompt)) {
    return { action: 'book_multi_service', rescueReason: 'book_multi' };
  }
  if (isBookPackagePrompt(prompt)) {
    return { action: 'book_package', rescueReason: 'book_package' };
  }

  return null;
}

function classifyCustomerBookingSegment(
  segment: string,
): CustomerBookingCompoundStep | null {
  const text = segment.trim();
  if (!text) return null;

  const base: Record<string, unknown> = enrichParamsWithSharedEntities(
    {},
    text,
  );
  const bookingId = extractBookingIdFromPrompt(text);
  if (bookingId) base.bookingId = bookingId;
  const packageName = extractPackageNameFromPrompt(text);
  if (packageName) base.packageName = packageName;
  const serviceNames = extractServiceNamesFromPrompt(text);
  if (serviceNames.length) base.serviceNames = serviceNames;
  const planName = extractPlanNameFromPrompt(text);
  if (planName) base.planName = planName;
  if (!base.giftCardCode) {
    const giftCardCode = extractGiftCardCodeFromPrompt(text);
    if (giftCardCode) base.giftCardCode = giftCardCode;
  }
  const employeeName = extractEmployeeNameFromPrompt(text);
  if (employeeName) base.employeeName = employeeName;

  if (isShowCartTotalDurationPrompt(text)) {
    return { action: 'show_cart_total_duration', params: base, segment: text };
  }
  if (isRemoveServiceFromCartPrompt(text)) {
    return { action: 'remove_service_from_cart', params: base, segment: text };
  }
  if (isAddServicesToCartPrompt(text)) {
    return { action: 'add_services_to_cart', params: base, segment: text };
  }
  if (isChangeProviderOnReschedulePrompt(text)) {
    return {
      action: 'change_provider_on_reschedule',
      params: base,
      segment: text,
    };
  }
  if (isBookWithGiftCardPrompt(text)) {
    return { action: 'book_with_gift_card', params: base, segment: text };
  }
  if (isBookWithCashPrompt(text)) {
    return { action: 'book_with_cash', params: base, segment: text };
  }
  if (isExplainCancelPolicyPrompt(text)) {
    return { action: 'explain_cancel_policy', params: base, segment: text };
  }
  if (isExplainPackageVisitRulesPrompt(text)) {
    return {
      action: 'explain_package_visit_rules',
      params: base,
      segment: text,
    };
  }
  if (isRecoverLostManageLinkPrompt(text)) {
    return {
      action: 'recover_lost_manage_link',
      params: base,
      segment: text,
    };
  }
  if (isGetManageLinkPrompt(text)) {
    return { action: 'get_manage_link', params: base, segment: text };
  }
  if (isListMyPackageVisitsCustomerPrompt(text)) {
    return { action: 'list_my_package_visits', params: base, segment: text };
  }
  if (isListMyAppointmentsPrompt(text)) {
    return { action: 'list_my_appointments', params: base, segment: text };
  }
  if (isReschedulePackageVisitSelfPrompt(text)) {
    return {
      action: 'reschedule_package_visit_self',
      params: base,
      segment: text,
    };
  }
  if (isCancelPackageVisitSelfPrompt(text)) {
    return { action: 'cancel_package_visit_self', params: base, segment: text };
  }
  if (isRescheduleMyBookingPrompt(text)) {
    return { action: 'reschedule_my_booking', params: base, segment: text };
  }
  if (isCancelMyBookingPrompt(text)) {
    return { action: 'cancel_my_booking', params: base, segment: text };
  }
  if (isExplainSubscriptionVsOneTimePrompt(text)) {
    return {
      action: 'explain_subscription_vs_one_time',
      params: base,
      segment: text,
    };
  }
  if (isUseSubscriptionCreditPrompt(text)) {
    return { action: 'use_subscription_credit', params: base, segment: text };
  }
  if (isSelectSubscriptionPlanPrompt(text)) {
    return { action: 'select_subscription_plan', params: base, segment: text };
  }
  if (
    isMultiServiceAvailabilityDiscoveryPrompt(text) ||
    isCheckMultiServiceAvailabilityPrompt(text)
  ) {
    return {
      action: 'check_multi_service_availability',
      params: base,
      segment: text,
    };
  }
  if (isCheckPackageAvailabilityPrompt(text)) {
    return {
      action: 'check_package_availability',
      params: base,
      segment: text,
    };
  }
  if (isExplainPackageSavingsPrompt(text)) {
    return {
      action: 'explain_package_savings',
      params: base,
      segment: text,
    };
  }
  if (isBookMultiServicePrompt(text)) {
    return { action: 'book_multi_service', params: base, segment: text };
  }
  if (isBookPackagePrompt(text)) {
    return { action: 'book_package', params: base, segment: text };
  }
  return null;
}

/** Deterministic multi-command split for customer booking self-service flows. */
export function decomposeCustomerBookingCompoundPrompt(
  prompt: string,
): CustomerBookingCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !CUSTOMER_BOOKING_VERB.test(trimmed)) return [];

  const segments = trimmed.split(COMPOUND_SPLIT).map((s) => s.trim());
  const nonEmpty = segments.filter(Boolean);

  if (nonEmpty.length <= 1) {
    const single = classifyCustomerBookingSegment(trimmed);
    return single ? [single] : [];
  }

  const steps: CustomerBookingCompoundStep[] = [];
  for (const segment of segments) {
    const step = classifyCustomerBookingSegment(segment);
    if (step) steps.push(step);
  }
  return steps.length >= 2
    ? propagateCompoundStepParamsAcrossSteps(steps)
    : steps;
}
