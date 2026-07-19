import {
  formatDateDisplay,
  formatTimeDisplay,
} from '../../common/utils/date-format.util.js';
import { formatProviderCustomerSnapshotBadgesText } from '../provider-mobile/provider-booking-customer-badges.util.js';
import { formatProviderLoyaltyQuickViewSummary } from '../provider-mobile/provider-booking-customer-loyalty.util.js';
import type { ProviderBookingCustomerContextView } from '../provider-mobile/provider-booking-customer-context.util.js';
import type { ProviderBookingCompletedVisitView } from '../provider-mobile/provider-booking-visit-history.util.js';
import type { ProviderBookingCustomerStaffNotesListView } from '../provider-mobile/provider-booking-customer-staff-notes.util.js';
import type { ProviderPreVisitIntakeSummaryView } from '../provider-mobile/provider-booking-pre-visit-intake.util.js';
import type {
  ProviderBookingMultiServiceBadge,
  ProviderBookingPackageBadge,
} from '../provider-mobile/provider-booking-checkout-context.util.js';
import type { BookingPaymentSummary } from '../booking/booking-payment-summary.util.js';
import { isCatalogMutateCommandPrompt } from './ai-catalog.util.js';
import { isSubscriptionUsageHistoryPrompt } from './ai-customer-crm.util.js';
import { PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS } from './ai-provider-client-context.fixtures.js';
import { PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS } from './ai-provider-client-context-multilingual.fixtures.js';
import { isSummarizeLoyaltyProgramPrompt } from './ai-billing-loyalty-dashboard.util.js';
import { isSummarizeAutomationPerformancePrompt } from './ai-marketing-growth.util.js';
import { isSummarizeMyAppointmentsPrompt } from './ai-provider-earnings.util.js';
import { isExplainServiceOnlinePaymentSetupPrompt } from './ai-service-online-payment-setup.util.js';
import { isConfigureLoyaltySettingsPrompt } from './ai-configure-loyalty-settings.util.js';
import { isExplainTenantAppInstallPrompt } from './ai-tenant-app-install.util.js';
import { isCheckGiftCardBalancePrompt } from './ai-payments.util.js';

export const PROVIDER_CLIENT_CONTEXT_INTENTS = [
  'summarize_client',
  'show_client_history',
  'add_client_note',
  'list_client_staff_notes',
  'explain_client_intake',
  'explain_package_visit_context',
  'explain_multi_service_timeline',
  'explain_booking_payment_breakdown',
  'explain_deposit_balance_due',
  'explain_retail_cart',
  'explain_cancel_policy_for_client',
  'explain_gift_card_redemption',
  'explain_tour_group_on_booking',
] as const;

export type ProviderClientContextIntent =
  (typeof PROVIDER_CLIENT_CONTEXT_INTENTS)[number];

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function isSummarizeClientPrompt(prompt: string): boolean {
  if (isExplainServiceOnlinePaymentSetupPrompt(prompt)) return false;
  if (isConfigureLoyaltySettingsPrompt(prompt)) return false;
  if (isExplainTenantAppInstallPrompt(prompt)) return false;
  if (isShowClientHistoryPrompt(prompt)) return false;
  if (isAddClientNotePrompt(prompt)) return false;
  if (isListClientStaffNotesPrompt(prompt)) return false;
  if (isExplainClientIntakePrompt(prompt)) return false;
  if (isExplainPackageVisitContextPrompt(prompt)) return false;
  if (isExplainMultiServiceTimelinePrompt(prompt)) return false;
  if (isExplainGiftCardRedemptionPrompt(prompt)) return false;
  if (isSummarizeMyAppointmentsPrompt(prompt)) return false;
  if (isCatalogMutateCommandPrompt(prompt)) return false;
  if (isSummarizeLoyaltyProgramPrompt(prompt)) return false;
  if (isSummarizeAutomationPerformancePrompt(prompt)) return false;

  const lower = prompt.toLowerCase();
  if (/\b(bookings?|appointments?)\s+overview\b/i.test(lower)) {
    return false;
  }

  const summarizeCue =
    /\b(summarize|summary|overview|brief me|tell me about|what should i know|client snapshot|know about|brief on)\b/i.test(
      lower,
    ) ||
    (containsArmenianScript(prompt) &&
      /(ամփոփ|պատմ|հաճախորդ|\u056b\u0574\u0561\u0576|snapshot|no-show|\u0584\u0561\u0576\u056b\s+\u0561\u0576\u0563\u0561\u0574)/i.test(
        prompt,
      )) ||
    (containsCyrillicScript(prompt) &&
      /(кратко|расскаж|об этом клиент|клиент|что мне нужно знать|снимок\s+клиент|сколько\s+раз)/i.test(
        prompt,
      )) ||
    /\bhow many times has [A-Z]/i.test(prompt);

  const clientCue =
    /\b(client|customer|this client|my client|guest|patient)\b/i.test(lower) ||
    /\b(loyalty|referral|no[\s-]?shows?|last visit|marketing)\b/i.test(lower) ||
    /(?:for|about|on|\u043e\u0431|\u043e)\s+[A-Z][\w'.-]+/i.test(prompt) ||
    /([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)-\u056b\u0576(?=\s)/i.test(prompt) ||
    /([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)-\u056b(?=\s)/i.test(prompt) ||
    /([A-Z][\w'.-]+)-\u043d(?=\s)/i.test(prompt) ||
    /([A-Z][\w'.-]+)-\u0576(?=\s)/i.test(prompt) ||
    (containsArmenianScript(prompt) &&
      /(հաճախորդ|լոյալ|այց|referral)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(клиент|лояльн|визит|referral|no-show)/i.test(prompt));

  const marketingSnapshot =
    /\b(marketing|opted in|opt in|referral|loyalty|no[\s-]?shows?)\b/i.test(
      lower,
    ) && /\b(client|customer|this customer|guest)\b/i.test(lower);

  if (
    marketingSnapshot &&
    !isAddClientNotePrompt(prompt) &&
    !isShowClientHistoryPrompt(prompt)
  ) {
    return true;
  }

  return summarizeCue && clientCue;
}

export function isShowClientHistoryPrompt(prompt: string): boolean {
  if (isAddClientNotePrompt(prompt)) return false;
  if (isSubscriptionUsageHistoryPrompt(prompt)) return false;
  if (/\bhow many times has [A-Z]/i.test(prompt)) return false;
  if (containsArmenianScript(prompt) && /քանի\s+անգամ/i.test(prompt)) {
    return false;
  }
  if (containsCyrillicScript(prompt) && /сколько\s+раз/i.test(prompt)) {
    return false;
  }

  const lower = prompt.toLowerCase();
  const historyCue =
    /\b(visit history|past (?:appointments?|visits?|bookings?)|previous visits?|recent completed|prior bookings?|visit record|who saw|last time (?:they|she|he) came|when did .+ last visit)\b/i.test(
      lower,
    ) ||
    (containsArmenianScript(prompt) &&
      /(այց.*պատմ|նախորդ|նախկին|վերջին\s+այց|service.*(?:նախկին|prior)|completed\s+visit|visit\s+record|prior\s+booking|\u057f\u0565\u057d.*\u057e\u0565\u0580\u057b\u056b\u0576)/i.test(
        prompt,
      )) ||
    (containsCyrillicScript(prompt) &&
      /(истори.*визит|прошл.*(?:запис|визит)|последн.*(?:визит|раз)|completed\s+visit|visit\s+record|prior\s+booking|кто\s+видел)/i.test(
        prompt,
      ));

  const clientCue =
    /\b(client|customer|guest|patient|this customer)\b/i.test(lower) ||
    /(?:for|about)\s+[A-Z][a-z]+/.test(prompt) ||
    /([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)-\u056b\u0576(?=\s)/i.test(prompt) ||
    /([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)-\u056b(?=\s)/i.test(prompt) ||
    /([A-Z][\w'.-]+)-\u043d(?=\s)/i.test(prompt) ||
    /([A-Z][\w'.-]+)-\u0576(?=\s)/i.test(prompt) ||
    (containsArmenianScript(prompt) && /(հաճախորդ|client)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) && /(клиент|customer)/i.test(prompt));

  return historyCue || (/\bhistory\b/i.test(lower) && clientCue);
}

export function isAddClientNotePrompt(prompt: string): boolean {
  if (isCatalogMutateCommandPrompt(prompt)) return false;
  if (isListClientStaffNotesPrompt(prompt)) return false;

  const lower = prompt.toLowerCase();
  return (
    /\b(add (?:a )?(?:staff )?note|staff note|client note|save (?:a )?note|write a note|log staff note|note for|remember that)\b/i.test(
      lower,
    ) ||
    /\bnote(?:\s|:| for\b| on\b)/i.test(lower) ||
    /^note:\s*/i.test(prompt) ||
    (containsArmenianScript(prompt) &&
      /(\u0576\u0577\u0578\u0576|\u0561\u057e\u0565\u056c\u0561\u0581\u0580|\u056b\u0577\u056b\u0580|staff note|client note)/i.test(
        prompt,
      )) ||
    (containsCyrillicScript(prompt) &&
      /(\u0437\u0430\u043c\u0435\u0442\u043a|\u0434\u043e\u0431\u0430\u0432\u044c|\u0437\u0430\u043f\u043e\u043c\u043d\u0438|staff note|client note|save client note|log staff note|add note)/i.test(
        prompt,
      ))
  );
}

export function isListClientStaffNotesPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(show|list|view|read|any|what|see|check)\b.*\b(staff )?notes?\b/i.test(
      lower,
    ) ||
    /\bnotes?\s+(do we have|on|about|for)\b/i.test(lower) ||
    (containsArmenianScript(prompt) &&
      /(\u0581\u0578\u0582\u0575\u0581\s+\u057f\u0578\u0582\u0580.*\u0576\u0577\u0578\u0576|\u0576\u0577\u0578\u0576\u0576\u0565\u0580\u0568|\u056b\u055e\u0576\u0579\s+\u0576\u0577\u0578\u0576)/i.test(
        prompt,
      )) ||
    (containsCyrillicScript(prompt) &&
      /(\u043f\u043e\u043a\u0430\u0436\u0438.*\u0437\u0430\u043c\u0435\u0442\u043a|\u043a\u0430\u043a\u0438\u0435\s+\u0437\u0430\u043c\u0435\u0442\u043a|\u0437\u0430\u043c\u0435\u0442\u043a\u0438\s+\u043e)/i.test(prompt))
  );
}

export function isExplainClientIntakePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const intakeCue =
    /\b(intake|pre-?visit (?:form|questionnaire|answers)|questionnaire)\b/i.test(
      lower,
    ) ||
    (containsArmenianScript(prompt) && /(\u0570\u0561\u0580\u0581\u0561\u0577\u0561\u0580|intake)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(\u0430\u043d\u043a\u0435\u0442|\u043e\u043f\u0440\u043e\u0441\u043d\u0438\u043a|intake)/i.test(prompt));
  if (!intakeCue) return false;

  return (
    /\b(what|show|explain|summarize|did (?:they|he|she) fill|answers?|says?)\b/i.test(
      lower,
    ) ||
    (containsArmenianScript(prompt) &&
      /(\u056b\u0576\u0579|\u0581\u0578\u0582\u0575\u0581\s+\u057f\u0578\u0582\u0580|\u0562\u0561\u0581\u0561\u057f\u0580\u056b\u0580|\u057a\u0561\u057f\u0561\u057d\u056d\u0561\u0576)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(\u0447\u0442\u043e|\u043f\u043e\u043a\u0430\u0436\u0438|\u043e\u0431\u044a\u044f\u0441\u043d\u0438|\u043e\u0442\u0432\u0435\u0442)/i.test(prompt))
  );
}

/** ai-cmd-provider-5.2.8 \u2014 which visit in a package this booking is. */
export function isExplainPackageVisitContextPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  // Dashboard bulk list/cancel/mutate phrasing owns "package visit(s)" plus an
  // operational verb or explicit booking-id targeting \u2014 not this booking's context.
  if (/\b(?:list|cancel|show all)\b/i.test(lower)) return false;
  if (/\bfor\s+booking\b/i.test(lower)) return false;
  if (/\b(?:reschedule|move|shift)\b/i.test(lower)) return false;
  // e2e-bug.129 — customer "visits left on my plan" is explain_my_subscription,
  // not provider package-visit progress for a named client.
  if (
    /\bmy\s+(?:plan|membership|subscription)\b/i.test(lower) &&
    !/\b(package|her|his|their|client|customer)\b/i.test(lower)
  ) {
    return false;
  }

  return (
    (/\bpackage\b/i.test(lower) && /\bvisits?\b/i.test(lower)) ||
    (/\bpackage\b/i.test(lower) && /\bprogress\b/i.test(lower)) ||
    /\b\d+\s+of\s+\d+\b.{0,20}\b(facials?|visits?|sessions?|treatments?|massages?|classes?)\b/i.test(
      lower,
    ) ||
    /\b(facials?|visits?|sessions?|treatments?|massages?|classes?)\b.{0,20}\b\d+\s+of\s+\d+\b/i.test(
      lower,
    ) ||
    /\bhow many (?:package )?visits? (?:are )?(?:left|remaining)\b/i.test(
      lower,
    ) ||
    (/\bvisits?\s+left\b/i.test(lower) && /\b(plan|package)\b/i.test(lower)) ||
    (containsArmenianScript(prompt) &&
      /(\u0583\u0561\u0569\u0565\u0569)/i.test(prompt) &&
      /(\u0561\u0575\u0581)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(\u043f\u0430\u043a\u0435\u0442)/i.test(prompt) &&
      /(\u0432\u0438\u0437\u0438\u0442)/i.test(prompt))
  );
}

/** ai-cmd-provider-5.2.9 \u2014 order of services in a multi-service booking group. */
export function isExplainMultiServiceTimelinePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\bwhat'?s\s+next\s+after\s+this\b/i.test(lower) ||
    /\bwhat\s+else\s+is\s+on\s+this\s+booking\b/i.test(lower) ||
    /\b(?:spa day|multi[\s-]?service)\s+(?:order|timeline|schedule)\b/i.test(
      lower,
    ) ||
    /\border\s+of\s+services?\b/i.test(lower) ||
    /\bwhich\s+service\s+is\s+first\b/i.test(lower) ||
    /\bgap\s+between\s+(?:her|his|their|the)\s+(?:two\s+)?appointments?\b/i.test(
      lower,
    ) ||
    (containsArmenianScript(prompt) &&
      /(\u0570\u0561\u057b\u0578\u0580\u0564.{0,20}\u056e\u0561\u057c\u0561\u0575\u0578\u0582\u0569\u0575\u0578\u0582\u0576|\u056b\u0576\u0579.{0,10}\u0570\u0561\u057b\u0578\u0580\u0564\u0568)/i.test(
        prompt,
      )) ||
    (containsCyrillicScript(prompt) &&
      /(\u0441\u043b\u0435\u0434\u0443\u044e\u0449.{0,20}\u0443\u0441\u043b\u0443\u0433|\u0447\u0442\u043e\s+\u0434\u0430\u043b\u044c\u0448\u0435)/i.test(
        prompt,
      ))
  );
}

/** ai-cmd-provider-5.3.3 — full payment breakdown (discounts/deposit/retail/total), not just tax lines or paid/pending status. */
export function isExplainBookingPaymentBreakdownPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(tax|vat|gst|pst|hst|inclusive|exclusive)\b/i.test(lower)) {
    return false;
  }
  // Dashboard/setup phrasing ("accept/enable online payment ... for <service> with
  // X% deposit") owns "deposit" + "booking" co-occurrence — not a breakdown query.
  if (
    /\bonline\s+payment\b/i.test(lower) ||
    /\b(accept|enable|require|decline|disable|turn\s+(?:on|off))\b/i.test(
      lower,
    )
  ) {
    return false;
  }

  if (
    /\bbreak(?:s|ing)?\s*down\b/i.test(lower) &&
    /\b(payment|price|total|booking|owes?|owed)\b/i.test(lower)
  ) {
    return true;
  }
  if (
    /\bbreakdown\b/i.test(lower) &&
    /\b(payment|price|total|booking)\b/i.test(lower)
  ) {
    return true;
  }
  if (
    /\b(discounts?|deposits?|prepaid|prepay)\b/i.test(lower) &&
    /\b(booking|appointment|applied|show|total)\b/i.test(lower)
  ) {
    return true;
  }
  if (
    /\bwhat'?s\s+included\b/i.test(lower) &&
    /\b(total|booking|price)\b/i.test(lower)
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(մանրամասն|վերլուծ|բաժան)/i.test(
      prompt,
    ) &&
    /(վճար|գին)/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(разбивк|разбей|детализ)/i.test(
      prompt,
    ) &&
    /(оплат|плат|цен)/i.test(
      prompt,
    )
  ) {
    return true;
  }

  return false;
}

/** ai-cmd-provider-5.3.5 — quick balance-due answer (deposit paid, rest owed), not the full itemized breakdown. */
export function isExplainDepositBalanceDuePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(tax|vat|gst|pst|hst|inclusive|exclusive)\b/i.test(lower)) {
    return false;
  }
  if (
    /\bonline\s+payment\b/i.test(lower) ||
    /\b(accept|enable|require|decline|disable|turn\s+(?:on|off))\b/i.test(
      lower,
    )
  ) {
    return false;
  }
  if (
    /\bbreak(?:s|ing)?\s*down\b/i.test(lower) ||
    /\bbreakdown\b/i.test(lower) ||
    /\bdiscounts?\b/i.test(lower) ||
    /\bwhat'?s\s+included\b/i.test(lower)
  ) {
    return false;
  }

  if (/\bbalance\s+due\b/i.test(lower)) return true;

  if (
    /\b(left|due|remaining|owe|owes|owed)\b/i.test(lower) &&
    /\b(checkout|pay|visit|appointment|booking|collect|rest|deposit)\b/i.test(
      lower,
    )
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(մնաց|պարտք)/i.test(prompt) &&
    /(վճար)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(остаток|остал|должн|баланс)/i.test(prompt) &&
    /(оплат|плат|счет)/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

/** ai-cmd-provider-5.12.3 — how much is left on the gift card being applied to this booking. */
export function isExplainGiftCardRedemptionPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    /\b(buy|purchase|order|claim|track|ship|deliver|cancel|extend|print)\b/i.test(
      lower,
    )
  ) {
    return false;
  }
  if (isCheckGiftCardBalancePrompt(prompt)) return false;

  const hasGiftCardMention =
    /\bgift\s*card\b/i.test(lower) ||
    (containsArmenianScript(prompt) && /(նվեր\s*քարտ)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) && /(подарочн)/i.test(prompt));
  if (!hasGiftCardMention) return false;

  if (/\bbalance\b/i.test(lower)) return true;
  if (/\bpaying\s+with\b/i.test(lower)) return true;
  if (/\busing\s+a\b/i.test(lower)) return true;
  if (/\b(left|remaining)\b/i.test(lower)) return true;
  if (/\bhow\s+much\b/i.test(lower)) return true;
  if (/\bcover(?:ed|s)?\b/i.test(lower)) return true;

  if (containsArmenianScript(prompt) && /(մնացորդ)/i.test(prompt)) {
    return true;
  }
  if (containsCyrillicScript(prompt) && /(баланс|остаток)/i.test(prompt)) {
    return true;
  }

  return false;
}

/** ai-cmd-provider-5.18.4 — tour group metadata (pax count, group size) on this booking. */
export function isExplainTourGroupOnBookingPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(add|change|update|set|edit)\b/i.test(lower)) return false;

  if (/\bhow\s+many\s+pax\b/i.test(lower)) return true;
  if (/\bgroup\s+booking\s+details?\b/i.test(lower)) return true;
  if (
    /\bhow\s+many\s+(?:people|guests?|travelers?|participants?)\b/i.test(
      lower,
    ) &&
    /\b(tour|group|booking)\b/i.test(lower)
  ) {
    return true;
  }
  if (/\bpax\s+count\b/i.test(lower)) return true;
  if (/\bgroup\s+size\b/i.test(lower) && /\btour\b/i.test(lower)) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(մասնակից|խմբի\s+չափ)/i.test(prompt) &&
    /(տուր)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(сколько\s+человек|размер\s+групп)/i.test(prompt) &&
    /(тур|групп)/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

/** ai-cmd-provider-5.4.3 — what's on the retail tab for this booking (read-only). */
export function isExplainRetailCartPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(add|sell|remove|delete|undo|take)\b/i.test(lower)) return false;

  if (/\bretail\s+(tab|cart|section)\b/i.test(lower)) return true;
  if (/\btotal\s+with\s+products?\b/i.test(lower)) return true;
  if (
    /\b(products?|retail)\b/i.test(lower) &&
    /\b(?:on\s+(?:this|the)\s+(?:booking|cart)|what'?s\s+on|show\s+me|list|total)\b/i.test(
      lower,
    )
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(ապրանք)/i.test(prompt) &&
    /(ցույց|ցուցակ)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(товар|розниц)/i.test(prompt) &&
    /(покажи|список|какие|сколько|сумма)/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

/** ai-cmd-provider-5.7.6 — explain this booking's cancel/reschedule policy and deposit-forfeiture exposure to the provider. */
export function isExplainCancelPolicyForClientPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  if (
    /\b(?:explain|what'?s|what\s+is|tell\s+me|describe)\b.*\b(?:cancel(?:lation)?|reschedule)\b.*\b(?:policy|rules?|window|notice)\b/i.test(
      lower,
    ) ||
    /\b(?:cancel(?:lation)?|reschedule)\b.*\b(?:policy|rules?|window|notice)\b/i.test(
      lower,
    )
  ) {
    return true;
  }

  const loseKeepCue = /\b(?:lose|forfeit|keep|refund(?:able)?)\b/i;
  if (
    (/\bdeposit\b/i.test(lower) &&
      new RegExp(`${loseKeepCue.source}.*\\bdeposit\\b|\\bdeposit\\b.*${loseKeepCue.source}`, 'i').test(lower)) &&
    /\bcancel/i.test(lower)
  ) {
    return true;
  }

  if (
    /\bhow\s+much\s+notice\b/i.test(lower) &&
    /\b(?:cancel|cancellation|reschedule)\b/i.test(lower)
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    const cancelCue = /(չեղարկ|հետաձգ)/i.test(prompt);
    const policyCue = /(քաղաքականություն|կանոն|ծանուցում)/i.test(prompt);
    const depositCue = /(deposit|կանխավճար|նախավճար)/i.test(prompt);
    const loseKeepCueHy = /(կկորցնի|կորցնել|պահում|վերադարձվող|վերադարձ)/i.test(
      prompt,
    );
    if (cancelCue && (policyCue || (depositCue && loseKeepCueHy))) {
      return true;
    }
  }
  if (containsCyrillicScript(prompt)) {
    const cancelCue = /(отмен|перенос)/i.test(prompt);
    const policyCue = /(политик|правил|уведомлен)/i.test(prompt);
    const depositCue = /(депозит|deposit)/i.test(prompt);
    const loseKeepCueRu = /(потеря|сохран|возвращ)/i.test(prompt);
    if (cancelCue && (policyCue || (depositCue && loseKeepCueRu))) {
      return true;
    }
  }

  return false;
}

function isPlaceholderClientNoteBody(body: string): boolean {
  return /^(for\s+)?(this\s+|the\s+)?(client|customer|guest|patient)\.?$/i.test(
    body.trim(),
  );
}

export function extractClientNoteBodyFromPrompt(prompt: string): string | null {
  const separator = String.raw`\s*[:\u2014-]+\s*`;
  const patterns = [
    new RegExp(
      `(?:add (?:a )?(?:staff )?note(?: for (?:this )?(?:client|customer))?${separator})(.+)$`,
      'i',
    ),
    new RegExp(
      `(?:staff note|client note|save client note|write a note on [^:]+)${separator}(.+)$`,
      'i',
    ),
    new RegExp(`(?:note for [^:]+)${separator}(.+)$`, 'i'),
    /^remember that\s+(.+)$/i,
    /^note:\s*(.+)$/i,
    new RegExp(`(?:log staff note for [^:]+)${separator}(.+)$`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const body = match?.[1]?.trim();
    if (body && !isPlaceholderClientNoteBody(body)) return body;
  }

  if (containsArmenianScript(prompt)) {
    const hy = prompt.match(/նշում[:\s—-]+(.+)$/i);
    if (hy?.[1]?.trim()) return hy[1].trim();
  }
  if (containsCyrillicScript(prompt)) {
    const ru = prompt.match(/заметк[а-я]*[:\s—-]+(.+)$/i);
    if (ru?.[1]?.trim()) return ru[1].trim();
  }

  return null;
}

export function extractCustomerNameFromClientPrompt(
  prompt: string,
): string | null {
  const patterns = [
    /\b([A-Z][a-z]+)'s\b/,
    /(?:about|for|on)\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)/,
    /(?:client|customer)\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)/i,
    /(?:note for|history for|visits for)\s+([A-Z][\w'.-]+)/i,
    /^summarize\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)/i,
    /([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)-\u056b\s+\u0574\u0561\u057d\u056b\u0576/i,
    /\u0447\u0442\u043e\s+\u043c\u043d\u0435\s+\u043d\u0443\u0436\u043d\u043e\s+\u0437\u043d\u0430\u0442\u044c\s+\u043e\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)/i,
    /([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)-\u056b(?=\s)/i,
    /([A-Z][\w'.-]+)-\u056b\u0576(?=\s)/i,
    /([A-Z][\w'.-]+)-\u043d(?=\s)/i,
    /(?:\u0561\u0574\u0583\u0588\u0572\u056b\u0580|\u041a\u0440\u0430\u0442\u043a\u043e)\s+([A-Z][\w'.-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }

  return null;
}

export function matchProviderClientContextScenario(
  prompt: string,
): { action: ProviderClientContextIntent; rescueReason: string } | null {
  for (const scenario of [
    ...PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS,
    ...PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS,
  ]) {
    if (scenario.prompt === prompt) {
      return {
        action: scenario.expectedAction,
        rescueReason: scenario.expectedAction,
      };
    }
  }
  return null;
}

export function rescueProviderClientContextIntent(
  prompt: string,
  action: string,
): { action: ProviderClientContextIntent; rescueReason: string } | null {
  const exact = matchProviderClientContextScenario(prompt);
  if (exact) return exact;

  if (isExplainCancelPolicyForClientPrompt(prompt)) {
    return {
      action: 'explain_cancel_policy_for_client',
      rescueReason: 'explain_cancel_policy_for_client',
    };
  }
  if (isListClientStaffNotesPrompt(prompt)) {
    return {
      action: 'list_client_staff_notes',
      rescueReason: 'list_client_staff_notes',
    };
  }
  if (isExplainClientIntakePrompt(prompt)) {
    return {
      action: 'explain_client_intake',
      rescueReason: 'explain_client_intake',
    };
  }
  if (isExplainPackageVisitContextPrompt(prompt)) {
    return {
      action: 'explain_package_visit_context',
      rescueReason: 'explain_package_visit_context',
    };
  }
  if (isExplainMultiServiceTimelinePrompt(prompt)) {
    return {
      action: 'explain_multi_service_timeline',
      rescueReason: 'explain_multi_service_timeline',
    };
  }
  if (isExplainDepositBalanceDuePrompt(prompt)) {
    return {
      action: 'explain_deposit_balance_due',
      rescueReason: 'explain_deposit_balance_due',
    };
  }
  if (isExplainGiftCardRedemptionPrompt(prompt)) {
    return {
      action: 'explain_gift_card_redemption',
      rescueReason: 'explain_gift_card_redemption',
    };
  }
  if (isExplainTourGroupOnBookingPrompt(prompt)) {
    return {
      action: 'explain_tour_group_on_booking',
      rescueReason: 'explain_tour_group_on_booking',
    };
  }
  if (isExplainBookingPaymentBreakdownPrompt(prompt)) {
    return {
      action: 'explain_booking_payment_breakdown',
      rescueReason: 'explain_booking_payment_breakdown',
    };
  }
  if (isExplainRetailCartPrompt(prompt)) {
    return {
      action: 'explain_retail_cart',
      rescueReason: 'explain_retail_cart',
    };
  }
  if (isAddClientNotePrompt(prompt)) {
    return { action: 'add_client_note', rescueReason: 'add_client_note' };
  }
  if (isShowClientHistoryPrompt(prompt)) {
    return {
      action: 'show_client_history',
      rescueReason: 'show_client_history',
    };
  }
  if (isSummarizeClientPrompt(prompt)) {
    return { action: 'summarize_client', rescueReason: 'summarize_client' };
  }

  if (
    action === 'show_appointments' &&
    /\b(summarize|overview|loyalty|referral)\b/i.test(prompt) &&
    /\b(client|customer)\b/i.test(prompt)
  ) {
    return { action: 'summarize_client', rescueReason: 'summarize_client' };
  }

  if (
    action === 'list_bookings' &&
    /\b(history|past visits?|previous)\b/i.test(prompt)
  ) {
    return {
      action: 'show_client_history',
      rescueReason: 'show_client_history',
    };
  }

  if (
    action === 'update_bookings' &&
    /\b(note|remember that)\b/i.test(prompt)
  ) {
    return { action: 'add_client_note', rescueReason: 'add_client_note' };
  }

  return null;
}

export function formatMarketingOptInLabel(optIn: boolean | null): string {
  if (optIn === true) return 'opted in to marketing';
  if (optIn === false) return 'opted out of marketing';
  return 'marketing preference not recorded';
}

export function formatProviderClientSummaryText(
  context: ProviderBookingCustomerContextView,
): string {
  const parts = [
    `${context.name}: ${context.completedVisitCount} completed visit${context.completedVisitCount === 1 ? '' : 's'}`,
  ];

  if (context.lastCompletedVisitAt) {
    parts.push(`last visit ${formatDateDisplay(context.lastCompletedVisitAt)}`);
  }
  if (context.noShowCount > 0) {
    parts.push(
      `${context.noShowCount} no-show${context.noShowCount === 1 ? '' : 's'}`,
    );
  }
  if (context.loyaltyQuickView) {
    parts.push(formatProviderLoyaltyQuickViewSummary(context.loyaltyQuickView));
  } else if (context.loyaltyPointsBalance > 0) {
    parts.push(
      `${context.loyaltyPointsBalance} loyalty pts (${context.loyaltyPointsValue})`,
    );
  }
  parts.push(formatMarketingOptInLabel(context.marketingOptIn));
  const badgeText = formatProviderCustomerSnapshotBadgesText(
    context.badges ?? [],
  );
  if (badgeText) {
    parts.push(badgeText);
  }
  if (context.referral) {
    parts.push(
      `referred by ${context.referral.referredByCustomerName}${
        context.referral.referralCodeUsed
          ? ` (code ${context.referral.referralCodeUsed})`
          : ''
      }`,
    );
  }

  const recent = context.recentCompletedVisits.slice(0, 2);
  if (recent.length) {
    const visitBits = recent.map(
      (visit) =>
        `${visit.serviceName} with ${visit.providerName} on ${formatDateDisplay(visit.completedAt)}`,
    );
    parts.push(`recent: ${visitBits.join('; ')}`);
  }

  return parts.join(' · ');
}

export function formatProviderClientHistoryText(
  customerName: string,
  visits: ProviderBookingCompletedVisitView[],
): string {
  if (!visits.length) {
    return `${customerName} has no completed visits on record yet.`;
  }

  const lines = visits.map(
    (visit) =>
      `${formatDateDisplay(visit.completedAt)} — ${visit.serviceName} with ${visit.providerName}`,
  );

  return `${customerName} — ${visits.length} recent visit${visits.length === 1 ? '' : 's'}:\n${lines.join('\n')}`;
}

export function resolveClientNoteBody(
  params: Record<string, unknown>,
  prompt: string,
): string | null {
  const fromParams = params.clientNote ?? params.reason ?? params.note;
  if (typeof fromParams === 'string' && fromParams.trim()) {
    return fromParams.trim();
  }
  return extractClientNoteBodyFromPrompt(prompt);
}

export function formatProviderClientStaffNotesText(
  customerName: string,
  view: ProviderBookingCustomerStaffNotesListView,
): string {
  if (!view.notes.length) {
    return `No staff notes on file for ${customerName} yet.`;
  }

  const lines = view.notes.map(
    (note) =>
      `${formatDateDisplay(note.createdAt)}${note.authorName ? ` (${note.authorName})` : ''} — ${note.body ?? '(hidden)'}`,
  );

  return `${customerName} — ${view.notes.length} staff note${view.notes.length === 1 ? '' : 's'}:\n${lines.join('\n')}`;
}

export function formatProviderClientIntakeText(
  view: ProviderPreVisitIntakeSummaryView,
): string {
  if (!view.visible) {
    return 'No pre-visit intake applies to this appointment.';
  }
  if (view.status === 'none') {
    return 'No pre-visit intake has been submitted for this booking yet.';
  }
  if (!view.answers.length) {
    return `Pre-visit intake "${view.questionnaireTitle ?? 'questionnaire'}" is ${view.status}${view.completedAt ? ` (completed ${formatDateDisplay(view.completedAt)})` : ''} — no answers recorded yet.`;
  }

  const lines = view.answers.map(
    (row) => `${row.questionText}: ${row.answerText}`,
  );
  const more =
    view.totalAnswerCount > view.answers.length
      ? ` (+${view.totalAnswerCount - view.answers.length} more on the dashboard)`
      : '';

  return `${view.questionnaireTitle ?? 'Pre-visit intake'} (${view.status}):\n${lines.join('\n')}${more}`;
}

/** ai-cmd-provider-5.2.8 — narrate which visit in a package this booking is. */
export function formatProviderPackageVisitContextText(
  customerName: string,
  pkg: ProviderBookingPackageBadge | null,
): string {
  if (!pkg) {
    return `${customerName}'s appointment isn't part of a package.`;
  }
  return `This is visit ${pkg.serviceIndex} of ${pkg.serviceTotal} in ${pkg.packageName} — ${pkg.visitsRemaining} visit${pkg.visitsRemaining === 1 ? '' : 's'} remaining.`;
}

/** ai-cmd-provider-5.2.9 — narrate the order of services in a multi-service booking group. */
export function formatProviderMultiServiceTimelineText(
  customerName: string,
  multi: ProviderBookingMultiServiceBadge | null,
): string {
  if (!multi || multi.lines.length === 0) {
    return `${customerName}'s appointment isn't part of a multi-service booking.`;
  }

  const currentIndex = multi.lines.findIndex((line) => line.isCurrent);
  const lines = multi.lines.map((line, index) => {
    const marker = line.isCurrent ? ' (current)' : '';
    const durationMinutes = Math.round(
      (new Date(line.endTime).getTime() - new Date(line.startTime).getTime()) /
        60000,
    );
    const nextLine = multi.lines[index + 1];
    const gapMinutes = nextLine
      ? Math.round(
          (new Date(nextLine.startTime).getTime() -
            new Date(line.endTime).getTime()) /
            60000,
        )
      : null;
    const gapNote =
      gapMinutes != null && gapMinutes > 0 ? ` (${gapMinutes}m gap after)` : '';
    return `${index + 1}. ${line.serviceName}${marker} — ${formatTimeDisplay(new Date(line.startTime))} with ${line.employeeName} (${durationMinutes}m)${gapNote}`;
  });

  const next =
    currentIndex >= 0 && currentIndex < multi.lines.length - 1
      ? multi.lines[currentIndex + 1]
      : undefined;
  const trailer = next
    ? `Next up: ${next.serviceName} with ${next.employeeName}.`
    : currentIndex === multi.lines.length - 1
      ? 'This is the last service in the group.'
      : '';

  return `${multi.serviceCount}-service booking:\n${lines.join('\n')}${trailer ? `\n${trailer}` : ''}`;
}

/** ai-cmd-provider-5.3.3 — narrate the full payment breakdown (service, retail, discounts, tax, collected vs owed). */
export function formatProviderBookingPaymentBreakdownText(
  customerName: string,
  paymentStatus: string,
  summary: BookingPaymentSummary | null,
): string {
  if (!summary) {
    return `No payment breakdown available for ${customerName}'s booking yet.`;
  }
  const money = (amount: number) => `${summary.currency} ${amount.toFixed(2)}`;
  const parts: string[] = [];

  if (summary.servicePrice != null) {
    parts.push(`Service: ${money(summary.servicePrice)}`);
  }
  if (summary.retailTotal > 0) {
    parts.push(`Retail: ${money(summary.retailTotal)}`);
  }
  if (summary.promoDiscount > 0) {
    parts.push(
      `Promo${summary.promoCode ? ` (${summary.promoCode})` : ''}: -${money(summary.promoDiscount)}`,
    );
  }
  if (summary.giftCardDiscount > 0) {
    parts.push(
      `Gift card${summary.giftCardCode ? ` (${summary.giftCardCode})` : ''}: -${money(summary.giftCardDiscount)}`,
    );
  }
  if (summary.loyaltyDiscount > 0) {
    parts.push(
      `Loyalty (${summary.loyaltyPointsRedeemed} pts): -${money(summary.loyaltyDiscount)}`,
    );
  }
  if (summary.taxAmount) {
    parts.push(`${summary.taxName ?? 'Tax'}: ${money(summary.taxAmount)}`);
  }
  parts.push(`Total: ${money(summary.grandTotal)}`);
  parts.push(`Collected: ${money(summary.cashPaid)}`);

  const remaining = summary.grandTotal - summary.cashPaid;
  const statusLine =
    paymentStatus === 'paid'
      ? 'Fully paid.'
      : remaining > 0
        ? `${money(remaining)} still owed (status: ${paymentStatus}).`
        : `Status: ${paymentStatus}.`;

  return `${customerName}'s payment breakdown:\n${parts.join('\n')}\n${statusLine}`;
}

/** ai-cmd-provider-5.3.5 — quick "how much is left to pay" answer, no line items. */
export function formatProviderDepositBalanceDueText(
  customerName: string,
  summary: BookingPaymentSummary | null,
): string {
  if (!summary) {
    return `No payment details available for ${customerName}'s booking yet.`;
  }
  const money = (amount: number) => `${summary.currency} ${amount.toFixed(2)}`;
  const remaining = summary.grandTotal - summary.cashPaid;

  if (remaining <= 0) {
    return `${customerName} has no balance due — fully paid (${money(summary.grandTotal)}).`;
  }

  const collectedNote =
    summary.cashPaid > 0 ? ` (${money(summary.cashPaid)} already collected)` : '';
  return `${customerName} owes ${money(remaining)} of ${money(summary.grandTotal)}${collectedNote}.`;
}

/** ai-cmd-provider-5.12.3 — gift card applied to this booking + its current balance. */
export function formatProviderGiftCardRedemptionText(
  customerName: string,
  summary: BookingPaymentSummary | null,
  cardBalance: number | null,
  cardCurrency: string | null,
): string {
  if (!summary || !summary.giftCardCode) {
    return `${customerName}'s booking isn't using a gift card.`;
  }
  const bookingMoney = (amount: number) =>
    `${summary.currency} ${amount.toFixed(2)}`;
  const appliedLine = `Gift card ${summary.giftCardCode} is covering ${bookingMoney(summary.giftCardDiscount)} of this booking.`;
  const remainingOwed = Math.max(
    0,
    summary.grandTotal - summary.giftCardDiscount,
  );
  const coverageLine =
    remainingOwed > 0
      ? `The card covers part of the total — ${bookingMoney(remainingOwed)} still owed by another payment method.`
      : `The card covers the full booking total — nothing else owed.`;

  if (cardBalance == null) {
    return `${appliedLine} ${coverageLine} Current card balance unavailable.`;
  }
  const balanceMoney = `${cardCurrency ?? summary.currency} ${cardBalance.toFixed(2)}`;
  return `${appliedLine} ${coverageLine} ${balanceMoney} remaining on the card.`;
}

/** ai-cmd-provider-5.18.4 — tour group metadata (pax count, group size) on this booking. */
export function formatProviderTourGroupText(
  customerName: string,
  tourMeta: { paxCount?: number | null } | null,
): string {
  if (!tourMeta || tourMeta.paxCount == null) {
    return `${customerName}'s booking doesn't have a stored pax count (defaults to 1 traveler).`;
  }
  return `${customerName}'s tour group: ${tourMeta.paxCount} ${tourMeta.paxCount === 1 ? 'traveler' : 'travelers'}.`;
}

/** ai-cmd-provider-5.4.3 — what's on the retail tab (products, quantities, retail total). */
export function formatProviderRetailCartText(
  customerName: string,
  summary: BookingPaymentSummary | null,
): string {
  if (!summary || summary.retailLines.length === 0) {
    return `No retail products on ${customerName}'s booking yet.`;
  }
  const money = (amount: number) => `${summary.currency} ${amount.toFixed(2)}`;
  const lines = summary.retailLines.map(
    (line) =>
      `${line.quantity}x ${line.productName} — ${money(line.lineTotal)}`,
  );
  return `${customerName}'s retail tab:\n${lines.join('\n')}\nRetail total: ${money(summary.retailTotal)}.`;
}

/** ai-cmd-provider-5.7.6 — narrate this booking's cancel/reschedule policy and deposit-forfeiture exposure for the provider. */
export function formatProviderCancelPolicyForClientText(
  customerName: string,
  settingsLines: string[],
  depositLines: string[],
  generalDepositLine: string | null,
): string {
  const parts = [...settingsLines];
  if (depositLines.length > 0) {
    parts.push(...depositLines);
  } else if (generalDepositLine) {
    parts.push(generalDepositLine);
  }
  if (!parts.length) {
    return `No cancel/reschedule policy is configured for ${customerName}'s booking.`;
  }
  return `${customerName}'s cancel/reschedule policy:\n${parts.join('\n')}`;
}
