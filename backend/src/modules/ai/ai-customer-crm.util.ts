import {
  isExplainMySubscriptionPrompt,
  rescueExplainMySubscriptionIntent,
} from './ai-explain-my-subscription.util.js';
import {
  isUpdateMyProfilePrompt,
  rescueUpdateMyProfileIntent,
} from './ai-update-my-profile.util.js';
import {
  isGetMyLocalePrompt,
  isUpdateMyLocalePrompt,
  rescueMyLocaleIntent,
} from './ai-my-locale.util.js';
import { isTrackPhysicalGiftCardOrderCustomerPrompt } from './ai-track-physical-gift-card-order.util.js';
import { rescueClaimGiftCardBalanceIntent } from './ai-claim-gift-card-balance.util.js';
import { hasSubscriptionCheckoutCompareCue } from './ai-explain-subscription-vs-one-time.util.js';
import { isExplicitPayOnlinePrompt } from './ai-pay-online-checkout.util.js';
import { isProtectedFromCrmListSteal } from './ai-crm-list-steal-guard.util.js';
import { isExplainHomeScreenWidgetPrompt } from './ai-explain-home-screen-widget.util.js';

export const DASHBOARD_CRM_MUTATE_INTENTS = [
  'extend_subscription',
  'cancel_subscription_admin',
  'merge_customers',
  'export_customer_data',
  'delete_customer_data',
  'send_reengagement_message',
  'tag_customer',
  'update_customer',
] as const;

export const DASHBOARD_CRM_READ_INTENTS = [
  'list_customer_subscriptions',
  'subscription_usage_history',
  'list_customer_gift_cards',
  'list_customer_bookings',
  'customer_no_show_history',
] as const;

export const CUSTOMER_ACCOUNT_MUTATE_INTENTS = [
  'request_gift_card_cancel',
  'request_gift_card_modify',
  'claim_gift_card_balance',
  'privacy_export',
  'privacy_delete',
  'update_my_profile',
  'update_my_locale',
] as const;

export const CUSTOMER_ACCOUNT_READ_INTENTS = [
  'my_profile',
  'get_my_locale',
  'my_appointments',
  'explain_my_subscription',
  'my_subscriptions',
  'subscription_usage',
  'my_gift_cards',
  'gift_card_balance',
  'gift_card_redemption_history',
  'track_physical_gift_card_order',
  'explain_gift_card_order',
] as const;

export const DISCOVERY_INTENTS = [
  'discover_packages',
  'discover_subscription_plans',
  'discover_gift_card_products',
] as const;

export const CUSTOMER_CRM_INTENTS = [
  ...DASHBOARD_CRM_MUTATE_INTENTS,
  ...DASHBOARD_CRM_READ_INTENTS,
  ...CUSTOMER_ACCOUNT_MUTATE_INTENTS,
  ...CUSTOMER_ACCOUNT_READ_INTENTS,
  ...DISCOVERY_INTENTS,
] as const;

export type CustomerCrmIntent = (typeof CUSTOMER_CRM_INTENTS)[number];

export interface CrmCompoundStep {
  action: CustomerCrmIntent;
  params: Record<string, unknown>;
  segment: string;
}

const CRM_VERB =
  /\b(list|show|my|tag|export|delete|extend|cancel|merge|discover|track|request|what|which)\b/i;

const COMPOUND_SPLIT =
  /\s*;\s*|\s+and\s+(?=(?:list|show|my|tag|export|delete|extend|cancel|merge|discover|track|request|what|which|gift)\b)/i;

export function isCustomerCrmIntent(
  action: string,
): action is CustomerCrmIntent {
  return (CUSTOMER_CRM_INTENTS as readonly string[]).includes(action);
}

export function isMyAccountPrompt(prompt: string): boolean {
  return /\bmy\b/i.test(prompt);
}

/** Dashboard CRM prompts that refer to a named customer (not self-service "my"). */
export function hasDashboardCustomerReference(prompt: string): boolean {
  return (
    /\b(customer|client|for)\b/i.test(prompt) ||
    /'s\s+(?:subscription|membership|plan|gift|appointments?|bookings?|no[\s-]?shows?)/i.test(
      prompt,
    ) ||
    /\b(her|his|their)\s+(?:subscription|membership|plan|gift|appointments?|bookings?|no[\s-]?shows?)/i.test(
      prompt,
    )
  );
}

/**
 * e2e-bug.138 — owner asks about customers' memberships ("my customers"),
 * not the signed-in customer's own "my subscriptions".
 */
export function hasBusinessWideCustomerMembershipScope(
  prompt: string,
): boolean {
  return (
    /\bmy\s+customers?\b/i.test(prompt) ||
    /\b(?:our|the)\s+customers?\b/i.test(prompt) ||
    /\bfor\s+(?:my\s+|our\s+|the\s+)?customers?\b/i.test(prompt) ||
    /\bcustomers['']?\s+(?:active\s+)?(?:memberships?|subscriptions?|plans?)\b/i.test(
      prompt,
    ) ||
    /\b(?:memberships?|subscriptions?)\s+for\s+(?:my\s+|our\s+|the\s+)?customers?\b/i.test(
      prompt,
    )
  );
}

export function isListCustomerSubscriptionsPrompt(prompt: string): boolean {
  if (
    !/\b(list|show)\b/i.test(prompt) ||
    !/\b(subscription|membership|plan)s?\b/i.test(prompt)
  ) {
    return false;
  }
  // e2e-bug.138 — "List active memberships for my customers" is dashboard CRM.
  if (hasBusinessWideCustomerMembershipScope(prompt)) return true;
  return hasDashboardCustomerReference(prompt) && !isMyAccountPrompt(prompt);
}

export function isSubscriptionUsageHistoryPrompt(prompt: string): boolean {
  // e2e-bug.79 — "…subscription better value than paying per visit?" matched
  // visit + subscription/plan and leaked dashboard subscription_usage_history.
  if (hasSubscriptionCheckoutCompareCue(prompt)) return false;
  return (
    /\b(usage|visits?|history)\b/i.test(prompt) &&
    /\b(subscription|membership|plan)\b/i.test(prompt) &&
    !/\b(create|add|update|deactivate|assign|give|enroll)\b/i.test(prompt) &&
    !isMyAccountPrompt(prompt)
  );
}

export function isExtendSubscriptionPrompt(prompt: string): boolean {
  return (
    /\b(extend|renew|prolong)\b/i.test(prompt) &&
    /\b(subscription|membership|plan)\b/i.test(prompt) &&
    !isMyAccountPrompt(prompt)
  );
}

export function isCancelSubscriptionAdminPrompt(prompt: string): boolean {
  return (
    /\b(cancel|terminate|end)\b/i.test(prompt) &&
    /\b(subscription|membership)\b/i.test(prompt) &&
    /\b(for|customer|client)\b/i.test(prompt) &&
    !isMyAccountPrompt(prompt) &&
    !/\b(my|mine)\b/i.test(prompt)
  );
}

export function isListCustomerGiftCardsPrompt(prompt: string): boolean {
  return (
    /\b(list|show)\b/i.test(prompt) &&
    /\b(gift\s*cards?|orders?)\b/i.test(prompt) &&
    hasDashboardCustomerReference(prompt) &&
    !isMyAccountPrompt(prompt)
  );
}

export function isListCustomerBookingsPrompt(prompt: string): boolean {
  return (
    /\b(list|show)\b/i.test(prompt) &&
    hasDashboardCustomerReference(prompt) &&
    /\b(appointments?|bookings?|visits?)\b/i.test(prompt) &&
    !/\b(package|multi[\s-]?service)\s+(visits?|bookings?)\b/i.test(prompt) &&
    !isMyAccountPrompt(prompt)
  );
}

export function isMergeCustomersPrompt(prompt: string): boolean {
  return (
    /\b(merge|combine|dedupe|deduplicate)\b/i.test(prompt) &&
    /\bcustomers?\b/i.test(prompt)
  );
}

export function isExportCustomerDataPrompt(prompt: string): boolean {
  return (
    /\b(export|download)\b/i.test(prompt) &&
    /\b(customer|gdpr|data)\b/i.test(prompt) &&
    !isMyAccountPrompt(prompt)
  );
}

export function isDeleteCustomerDataPrompt(prompt: string): boolean {
  return (
    /\b(delete|erase|remove|anonymize)\b/i.test(prompt) &&
    /\b(customer|gdpr|data|account)\b/i.test(prompt) &&
    !isMyAccountPrompt(prompt)
  );
}

export function isSendReengagementPrompt(prompt: string): boolean {
  return (
    /\b(re[\s-]?engage|win[\s-]?back|reach[\s-]?out|send)\b/i.test(prompt) &&
    /\b(customer|client|message|email)\b/i.test(prompt)
  );
}

export function isTagCustomerPrompt(prompt: string): boolean {
  return (
    /\b(tag|label|mark)\b/i.test(prompt) &&
    /\b(customer|client|vip|at[\s-]?risk)\b/i.test(prompt)
  );
}

export function isCustomerNoShowHistoryPrompt(prompt: string): boolean {
  return (
    /\b(no[\s-]?shows?|missed)\b/i.test(prompt) &&
    /\b(customer|client|history)\b/i.test(prompt) &&
    !isMyAccountPrompt(prompt)
  );
}

export function isMyProfilePrompt(prompt: string): boolean {
  if (isUpdateMyProfilePrompt(prompt)) return false;
  // e2e-bug.76 — "what language is my account set to?" is get_my_locale.
  if (isGetMyLocalePrompt(prompt) || isUpdateMyLocalePrompt(prompt)) {
    return false;
  }
  // e2e-bug.75 — "confirm my booking details" is confirm_my_booking_details.
  if (
    /\b(booking|appointment|visit|reservation)\b/i.test(prompt) &&
    /\b(confirm|summarize|summary|details)\b/i.test(prompt)
  ) {
    return false;
  }
  // e2e-bug.232 — "Attach referral code SAVE20 to my account" is claim_referral_code.
  if (/\b(?:referral|invite)\s*codes?\b/i.test(prompt)) return false;
  return (
    /\bmy\b/i.test(prompt) && /\b(profile|account|details)\b/i.test(prompt)
  );
}

export function isMyAppointmentsPrompt(prompt: string): boolean {
  // e2e-bug.134 — "cancel/reschedule my booking" (+ manage-link URL) is mutate,
  // not a signed-in appointments list. CRM rescue was stealing cancel_my_booking
  // / cancel_booking_with_token into my_appointments → "Sign in to view…".
  if (
    /\b(cancel|reschedule|move|shift|skip)\b/i.test(prompt) ||
    /\bchange\s+(?:my|this|the)\s+(?:booking|appointment|visit|reservation)/i.test(
      prompt,
    )
  ) {
    return false;
  }
  // e2e-bug.295 — "Add my next appointment to the home screen" is OS widget help
  // ("my" + "appointment" would otherwise match this list cue).
  if (isExplainHomeScreenWidgetPrompt(prompt)) return false;
  // e2e-bug.75 — pre-visit/intake ("my" + "visit" across hyphen), calendar, confirm.
  if (
    /\bpre[\s-]?visit\b/i.test(prompt) ||
    /\b(intake|questionnaire|health\s+form)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(calendar|ics|outlook)\b/i.test(prompt) ||
    /\badd\s+(?:to\s+)?(?:my\s+)?calendar\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(confirm|summarize|summary|details?\s+of)\b/i.test(prompt) &&
    /\b(booking|appointment|visit|reservation)\b/i.test(prompt)
  ) {
    return false;
  }
  // e2e-bug.88 — pay online for my booking/appointment is pay_online, not list.
  if (isExplicitPayOnlinePrompt(prompt)) return false;
  if (
    /\bpay\s+(?:cash|at\s+(?:the\s+)?(?:visit|venue|salon)|in\s+cash)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (/[?&]bookingId=/i.test(prompt) && /[?&]token=/i.test(prompt)) {
    return false;
  }
  return (
    /\bmy\b/i.test(prompt) &&
    /\b(appointments?|bookings?|visits?|schedule)\b/i.test(prompt) &&
    !/\b(subscription|gift)\b/i.test(prompt)
  );
}

export function isMySubscriptionsPrompt(prompt: string): boolean {
  if (isExplainMySubscriptionPrompt(prompt)) return false;
  if (isSubscriptionUsagePrompt(prompt)) return false;
  // e2e-bug.138 — never treat owner "my customers" membership lists as self-service.
  if (hasBusinessWideCustomerMembershipScope(prompt)) return false;
  if (isListCustomerSubscriptionsPrompt(prompt)) return false;
  if (hasDashboardCustomerReference(prompt) && !/\bmy\b/i.test(prompt)) {
    return false;
  }
  // e2e-bug.75 — cancel/end/stop membership is cancel_my_subscription, not list.
  if (
    /\b(cancel|end|stop)\b/i.test(prompt) &&
    /\b(subscription|membership|plan)s?\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(use|apply|redeem|book|pay)\b/i.test(prompt) &&
    /\b(subscription|membership|plan|credit|visit)s?\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(discover|browse|sign\s+up|subscribe\s+to|select|choose|pick)\b/i.test(
      prompt,
    ) &&
    /\b(subscription|membership|plan)s?\b/i.test(prompt)
  ) {
    return false;
  }
  const mentionsMembership =
    /\b(subscription|membership|plan)s?\b/i.test(prompt) ||
    /բաժանորդագր|պլան/i.test(prompt) ||
    /подписк|план/i.test(prompt);
  if (!mentionsMembership) return false;

  // Armenian/Cyrillic script alone implies self-scope + read-intent here: this
  // domain has no dashboard-admin equivalent phrased in those scripts, and the
  // earlier hasDashboardCustomerReference bail-out already screens out
  // admin-tone asks.
  const hasNonLatinScript = /[԰-֏Ѐ-ӿ]/.test(prompt);

  return (
    (/\bmy\b/i.test(prompt) &&
      !/\b(usage|visits?\s+left|remaining|credits?)\b/i.test(prompt)) ||
    /\b(show|list|view|open|where)\b/i.test(prompt) ||
    /\bdo\s+i\s+have\s+(?:a\s+)?(?:subscription|membership|plan)s?\b/i.test(
      prompt,
    ) ||
    /\bwhat\s+memberships?\s+do\s+i\s+have\b/i.test(prompt) ||
    /\bwhat\s+(?:are\s+)?my\s+active\s+subscriptions?\b/i.test(prompt) ||
    /\bwhat\s+is\s+on\s+my\s+subscription\b/i.test(prompt) ||
    hasNonLatinScript
  );
}

export function isSubscriptionUsagePrompt(prompt: string): boolean {
  if (isExplainMySubscriptionPrompt(prompt)) return false;
  if (
    /\bmy\b/i.test(prompt) &&
    /\b(subscription|membership|plan)\b/i.test(prompt) &&
    /\b(usage|visits?|remaining|credits?)\b/i.test(prompt)
  ) {
    return true;
  }
  const hasHyUsageCue =
    /իմ/i.test(prompt) &&
    /պլան|բաժանորդագր|membership/i.test(prompt) &&
    /օգտագործ/i.test(prompt);
  const hasRuUsageCue =
    /мо(?:й|я|его|ей)/i.test(prompt) &&
    /план|подписк/i.test(prompt) &&
    /использован/i.test(prompt);
  return hasHyUsageCue || hasRuUsageCue;
}

export function isMyGiftCardsPrompt(prompt: string): boolean {
  return (
    /\bmy\b/i.test(prompt) &&
    /\b(gift\s*cards?|orders?)\b/i.test(prompt) &&
    !/\b(balance|redemption|track|cancel|modify)\b/i.test(prompt)
  );
}

export function isGiftCardBalancePrompt(prompt: string): boolean {
  // e2e-bug.231 — anonymous / by-code balance lookup is check_gift_card_balance.
  if (
    /\b(GCM-|GCB-|GCS-)\b/i.test(prompt) ||
    /\bby\s+code\b/i.test(prompt) ||
    /\bgift\s*card\s+code\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(balance|remaining|left)\b/i.test(prompt)
  );
}

export function isGiftCardRedemptionHistoryPrompt(prompt: string): boolean {
  // e2e-bug.77 — order codes like QATEST-REDEEMED-001 must not steal cancel asks.
  if (/\b(cancel|refund|return|void|modify|change)\b/i.test(prompt)) {
    return false;
  }
  return (
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(redemption|redeemed|used)\b/i.test(prompt)
  );
}

export function isRequestGiftCardCancelPrompt(prompt: string): boolean {
  // e2e-bug.77 — staff cancel_gift_card_order is surface-gated off customer/public;
  // polite "please cancel gift card order {code}" is customer self-service.
  if (
    hasDashboardCustomerReference(prompt) &&
    !/\bmy\b/i.test(prompt) &&
    !/\brequest\b/i.test(prompt) &&
    !/\bplease\b/i.test(prompt)
  ) {
    return false;
  }

  // Armenian/Cyrillic script alone implies self-scope here: this domain has no
  // dashboard-admin equivalent phrased in those scripts, and the earlier
  // hasDashboardCustomerReference bail-out already screens out admin-tone asks.
  const hasNonLatinScript = /[԰-֏Ѐ-ӿ]/.test(prompt);

  const selfScope =
    /\bmy\b/i.test(prompt) ||
    /\brequest\b/i.test(prompt) ||
    /\bplease\b/i.test(prompt) ||
    /\b(i\s+)?bought\b/i.test(prompt) ||
    (/\b(this|the)\b/i.test(prompt) && /\bregret\b/i.test(prompt)) ||
    hasNonLatinScript;

  const cancelIntent =
    /\b(cancel|refund|return|undo|void|stop)\b/i.test(prompt) ||
    /\b(regret|buyer'?s?\s+remorse)\b/i.test(prompt) ||
    /չեղարկ|վերադարձ/i.test(prompt) ||
    /отмен|верну/i.test(prompt);

  const giftTarget =
    /\b(gift\s*card|gift\s*card\s+order|gift\s*card\s+purchase)\b/i.test(
      prompt,
    ) ||
    (/\border\b/i.test(prompt) &&
      /\b(gift|purchase|bought|card)\b/i.test(prompt)) ||
    (/подарочн/i.test(prompt) && /карт/i.test(prompt));

  return selfScope && cancelIntent && giftTarget;
}

export function isRequestGiftCardModifyPrompt(prompt: string): boolean {
  if (
    /\b(change|modify|update|edit)\b/i.test(prompt) &&
    /\b(gift\s*card|order)\b/i.test(prompt) &&
    (/\bmy\b/i.test(prompt) || /\brequest\b/i.test(prompt))
  ) {
    return true;
  }
  const hasHyModifyCue =
    /փոխ|փոփոխ/i.test(prompt) &&
    /նվեր\s*քարտ|պատվեր/i.test(prompt) &&
    /իմ/i.test(prompt);
  const hasRuModifyCue =
    /измен/i.test(prompt) &&
    /подарочн|заказ/i.test(prompt) &&
    /мо(?:й|я|его|ей)/i.test(prompt);
  return hasHyModifyCue || hasRuModifyCue;
}

export function isTrackPhysicalGiftCardPrompt(prompt: string): boolean {
  return isTrackPhysicalGiftCardOrderCustomerPrompt(prompt);
}

export function isPrivacySelfServiceMutateCommand(prompt: string): boolean {
  if (
    /\b(how\s+(?:can|do)\s+i|what\s+are\s+my\s+data\s+rights|why\s+do\s+i)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /^(?:can|could)\s+i\b/i.test(prompt.trim()) ||
    (/\?\s*$/.test(prompt.trim()) &&
      /\b(how|what|why|can|could)\b/i.test(prompt))
  ) {
    return false;
  }
  return true;
}

export function isPrivacyExportPrompt(prompt: string): boolean {
  if (hasDashboardCustomerReference(prompt) && !/\bmy\b/i.test(prompt)) {
    return false;
  }
  if (isExportCustomerDataPrompt(prompt)) return false;

  const selfScope =
    /\bmy\b/i.test(prompt) ||
    /\bprivacy\b/i.test(prompt) ||
    /\bmy\s+(?:personal\s+)?/i.test(prompt);

  const exportIntent =
    /\b(export|download)\b/i.test(prompt) ||
    /\bdata\s+export\b/i.test(prompt) ||
    /\bgdpr\s+export\b/i.test(prompt) ||
    /\bget\s+my\s+data\s+export\b/i.test(prompt);

  const dataTarget = /\b(data|information|account|profile|personal)\b/i.test(
    prompt,
  );

  return selfScope && exportIntent && dataTarget;
}

export function isPrivacyDeletePrompt(prompt: string): boolean {
  if (hasDashboardCustomerReference(prompt) && !/\bmy\b/i.test(prompt)) {
    return false;
  }
  if (isDeleteCustomerDataPrompt(prompt)) return false;

  const selfScope = /\bmy\b/i.test(prompt) || /\bprivacy\b/i.test(prompt);

  const deleteIntent =
    /\b(delete|erase|remove|forget|anonymi[sz]e)\b/i.test(prompt) ||
    /\bright\s+to\s+be\s+forgotten\b/i.test(prompt) ||
    /\bgdpr\s+delete\b/i.test(prompt);

  const dataTarget = /\b(data|account|information|profile|personal)\b/i.test(
    prompt,
  );

  return (
    selfScope &&
    deleteIntent &&
    (dataTarget || /\bmy\s+account\b/i.test(prompt))
  );
}

export function isDiscoverPackagesPrompt(prompt: string): boolean {
  return (
    /\b(what|which|discover|available|can\s+i|do\s+you\s+have)\b/i.test(
      prompt,
    ) &&
    /\bpackages?\b/i.test(prompt) &&
    !/^\s*(list|show)\s+packages?\s*$/i.test(prompt) &&
    !/\bpackage\s+(visits?|bookings?|appointments?)\b/i.test(prompt) &&
    !/\b(customer|client|for)\s+\w+\s+packages?\b/i.test(prompt) &&
    !/\b(create|add|update|deactivate)\b/i.test(prompt)
  );
}

export function isDiscoverSubscriptionPlansPrompt(prompt: string): boolean {
  if (hasSubscriptionCheckoutCompareCue(prompt)) return false;
  if (
    /(ինչ|ի՞նչ|ցույց|ցուցակ)/i.test(prompt) &&
    /(բաժանորդագր|անդամակցությ)\S*\s*պլան/i.test(prompt)
  ) {
    return true;
  }
  if (
    /(какие|покажи|список|доступны)/i.test(prompt) &&
    /(план[а-я]*\s*подписк|абонемент)/i.test(prompt)
  ) {
    return true;
  }
  return (
    /\b(what|which|show|list|discover|available|membership)\b/i.test(prompt) &&
    /\b(subscription|membership)\s+plans?\b/i.test(prompt) &&
    !/\b(create|add|update|deactivate|customer|for)\b/i.test(prompt)
  );
}

export function isDiscoverGiftCardProductsPrompt(prompt: string): boolean {
  // e2e-bug.231 — named-code balance lookups are check_gift_card_balance.
  if (
    /\b(GCM-|GCB-|GCS-)\b/i.test(prompt) ||
    /\bby\s+code\b/i.test(prompt) ||
    /\bgift\s*card\s+code\b/i.test(prompt)
  ) {
    return false;
  }
  if (/\b(balance|remaining|left|value)\b/i.test(prompt)) return false;
  return (
    /\b(what|which|show|list|discover|available|buy)\b/i.test(prompt) &&
    /\b(gift\s*cards?|presets?|bundles?)\b/i.test(prompt) &&
    !/\bmy\b/i.test(prompt) &&
    !hasDashboardCustomerReference(prompt) &&
    !/\b(cancel|modify|track)\b/i.test(prompt)
  );
}

export function isCrmCompoundPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length < 20 || !CRM_VERB.test(trimmed)) return false;
  return (
    COMPOUND_SPLIT.test(trimmed) ||
    decomposeCrmCompoundPrompt(trimmed).length > 1
  );
}

export function extractCustomerNameFromPrompt(prompt: string): string | null {
  const forMatch = prompt.match(
    /\bfor\s+([A-Za-z][\w\s'-]{1,40}?)(?:\s+'s|\s+s|\s+subscription|\s+plan|\s+gift|\s+appointments?|\s+bookings?|$)/i,
  );
  if (forMatch) return forMatch[1].trim();
  const possessive = prompt.match(
    /\b(?!list\b|show\b|tag\b|export\b|delete\b)([A-Za-z][\w'-]{1,40}(?:\s+[A-Za-z][\w'-]{1,40})?)'s\s+(?:subscription|membership|plan|gift|appointments?|bookings?|no[\s-]?shows?)/i,
  );
  if (possessive) return possessive[1].trim();
  const tagAs = prompt.match(
    /\btag\s+([A-Za-z][\w'-]{1,40}(?:\s+[A-Za-z][\w'-]{1,40})?)\s+as\b/i,
  );
  if (tagAs) return tagAs[1].trim();
  const customerMatch = prompt.match(
    /\bcustomer\s+([A-Za-z][\w\s'-]{1,40}?)(?:\s+(?:bookings?|appointments?|subscriptions?|gift)|$)/i,
  );
  return customerMatch?.[1]?.trim() ?? null;
}

export function extractTagFromPrompt(prompt: string): string | null {
  const tag = prompt.match(
    /\b(?:tag|label|mark)\b.+\b(?:as\s+)?(vip|regular|persona|corporate|referral|at[\s-]?risk)\b/i,
  );
  return (
    tag?.[1]
      ?.toLowerCase()
      .replace(/[\s-]/g, '_')
      .replace('at_risk', 'at_risk') ?? null
  );
}

export function extractExtendMonths(prompt: string): number | undefined {
  const m = prompt.match(/(\d+)\s*(?:more\s+)?months?/i);
  return m ? parseInt(m[1], 10) : undefined;
}

export function extractGiftCardCode(prompt: string): string | null {
  const code = prompt.match(/\b([A-Z0-9]{6,12})\b/);
  return code?.[1] ?? null;
}

function isProviderMobileClientContextPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    /\b(add (?:a )?staff note|staff note|client note|save (?:a )?note|note for|summarize client|client snapshot)\b/i.test(
      lower,
    )
  ) {
    return true;
  }
  if (
    /\b(visit history|past visits?|previous visits?|recent completed|prior bookings?|last visit)\b/i.test(
      lower,
    ) &&
    /\b(client|customer|for)\b/i.test(lower)
  ) {
    return true;
  }
  return (
    /\bhistory\b/i.test(lower) &&
    /\b(this client|client|customer)\b/i.test(lower) &&
    !/\b(subscription|membership|plan)\b/i.test(lower)
  );
}

/** NL rescue when classifier returns unknown or a nearby action. */
export function rescueCustomerCrmIntent(
  prompt: string,
  action: string,
): { action: CustomerCrmIntent; rescueReason: string } | null {
  if (isCrmCompoundPrompt(prompt) && action !== 'compound_intent') {
    return null;
  }
  if (isProviderMobileClientContextPrompt(prompt)) return null;

  const updateProfileEarly = rescueUpdateMyProfileIntent(prompt, action);
  if (updateProfileEarly) return updateProfileEarly;

  // e2e-bug.76 — before my_profile ("account") / explain_why_sign_in steals.
  const myLocaleEarly = rescueMyLocaleIntent(prompt, action);
  if (myLocaleEarly) return myLocaleEarly;

  const claimGiftCardBalanceEarly = rescueClaimGiftCardBalanceIntent(
    prompt,
    action,
  );
  if (claimGiftCardBalanceEarly) return claimGiftCardBalanceEarly;

  // e2e-bug.138 — before isCustomerCrmIntent early-return so leaked
  // my_subscriptions on the dashboard can still be corrected.
  if (
    action !== 'list_subscription_plans' &&
    isListCustomerSubscriptionsPrompt(prompt) &&
    action !== 'list_customer_subscriptions'
  ) {
    return {
      action: 'list_customer_subscriptions',
      rescueReason: 'list_subscriptions',
    };
  }

  if (isCustomerCrmIntent(action)) return null;

  if (isPrivacySelfServiceMutateCommand(prompt)) {
    if (isPrivacyDeletePrompt(prompt))
      return { action: 'privacy_delete', rescueReason: 'privacy_delete' };
    if (isPrivacyExportPrompt(prompt))
      return { action: 'privacy_export', rescueReason: 'privacy_export' };
  }
  if (isRequestGiftCardModifyPrompt(prompt))
    return {
      action: 'request_gift_card_modify',
      rescueReason: 'gift_card_modify',
    };
  if (isRequestGiftCardCancelPrompt(prompt))
    return {
      action: 'request_gift_card_cancel',
      rescueReason: 'gift_card_cancel',
    };
  if (isTrackPhysicalGiftCardOrderCustomerPrompt(prompt))
    return {
      action: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
    };
  if (isGiftCardRedemptionHistoryPrompt(prompt))
    return {
      action: 'gift_card_redemption_history',
      rescueReason: 'gift_card_redemption',
    };
  // e2e-bug.231 — only protect real by-code lookups; wallet "my gift card balance"
  // misclassified as check_gift_card_balance must still remap to gift_card_balance.
  if (
    action === 'check_gift_card_balance' &&
    (/\b(GCM-|GCB-|GCS-)\b/i.test(prompt) ||
      /\bby\s+code\b/i.test(prompt) ||
      /\bgift\s*card\s+code\b/i.test(prompt))
  ) {
    return null;
  }
  if (isGiftCardBalancePrompt(prompt))
    return { action: 'gift_card_balance', rescueReason: 'gift_card_balance' };
  const explainSubscription = rescueExplainMySubscriptionIntent(prompt, action);
  if (explainSubscription) return explainSubscription;
  if (isSubscriptionUsagePrompt(prompt))
    return { action: 'subscription_usage', rescueReason: 'subscription_usage' };
  if (isMyGiftCardsPrompt(prompt))
    return { action: 'my_gift_cards', rescueReason: 'my_gift_cards' };
  // e2e-bug.75 — never clobber a correct mutate/read classification into a list.
  if (isMySubscriptionsPrompt(prompt)) {
    if (action === 'my_subscriptions' || isProtectedFromCrmListSteal(action)) {
      return null;
    }
    return { action: 'my_subscriptions', rescueReason: 'my_subscriptions' };
  }
  if (isMyAppointmentsPrompt(prompt)) {
    if (
      action === 'list_my_appointments' ||
      action === 'my_appointments' ||
      isProtectedFromCrmListSteal(action)
    ) {
      return null;
    }
    return { action: 'my_appointments', rescueReason: 'my_appointments' };
  }
  // e2e-bug.232 — never clobber a correct claim_referral_code into my_profile.
  if (action === 'claim_referral_code') return null;
  if (isMyProfilePrompt(prompt))
    return { action: 'my_profile', rescueReason: 'my_profile' };

  if (
    isDiscoverGiftCardProductsPrompt(prompt) &&
    action !== 'configure_gift_card_products' &&
    action !== 'check_gift_card_balance'
  ) {
    return {
      action: 'discover_gift_card_products',
      rescueReason: 'discover_gift_cards',
    };
  }
  if (
    isDiscoverSubscriptionPlansPrompt(prompt) &&
    action !== 'list_subscription_plans'
  ) {
    return {
      action: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    };
  }
  if (isDiscoverPackagesPrompt(prompt) && action !== 'list_packages') {
    return { action: 'discover_packages', rescueReason: 'discover_packages' };
  }

  if (isCustomerNoShowHistoryPrompt(prompt))
    return {
      action: 'customer_no_show_history',
      rescueReason: 'no_show_history',
    };
  if (isTagCustomerPrompt(prompt))
    return { action: 'tag_customer', rescueReason: 'tag_customer' };
  if (isSendReengagementPrompt(prompt))
    return {
      action: 'send_reengagement_message',
      rescueReason: 'reengagement',
    };
  if (isDeleteCustomerDataPrompt(prompt))
    return {
      action: 'delete_customer_data',
      rescueReason: 'delete_customer_data',
    };
  if (isExportCustomerDataPrompt(prompt))
    return {
      action: 'export_customer_data',
      rescueReason: 'export_customer_data',
    };
  if (isMergeCustomersPrompt(prompt))
    return { action: 'merge_customers', rescueReason: 'merge_customers' };
  if (isCancelSubscriptionAdminPrompt(prompt))
    return {
      action: 'cancel_subscription_admin',
      rescueReason: 'cancel_subscription',
    };
  if (isExtendSubscriptionPrompt(prompt))
    return {
      action: 'extend_subscription',
      rescueReason: 'extend_subscription',
    };
  if (isSubscriptionUsageHistoryPrompt(prompt))
    return {
      action: 'subscription_usage_history',
      rescueReason: 'usage_history',
    };
  if (isListCustomerGiftCardsPrompt(prompt))
    return {
      action: 'list_customer_gift_cards',
      rescueReason: 'list_gift_cards',
    };
  if (isListCustomerBookingsPrompt(prompt) && action !== 'lookup_customer') {
    return {
      action: 'list_customer_bookings',
      rescueReason: 'list_customer_bookings',
    };
  }

  return null;
}

function resolveSegmentCustomerName(
  segment: string,
  inheritedName: string | null,
): string | null {
  return (
    extractCustomerNameFromPrompt(segment) ??
    (/\b(her|his|their)\b/i.test(segment) ? inheritedName : null)
  );
}

function classifyCrmSegment(
  segment: string,
  inheritedCustomerName: string | null = null,
): CrmCompoundStep | null {
  const text = segment.trim();
  /* istanbul ignore if */
  if (!text) return null;

  const customerName = resolveSegmentCustomerName(text, inheritedCustomerName);
  const baseParams: Record<string, unknown> = customerName
    ? { customerName }
    : {};

  if (isListCustomerSubscriptionsPrompt(text)) {
    return {
      action: 'list_customer_subscriptions',
      params: baseParams,
      segment: text,
    };
  }
  if (isListCustomerGiftCardsPrompt(text)) {
    return {
      action: 'list_customer_gift_cards',
      params: baseParams,
      segment: text,
    };
  }
  if (isListCustomerBookingsPrompt(text)) {
    return {
      action: 'list_customer_bookings',
      params: baseParams,
      segment: text,
    };
  }
  if (isSubscriptionUsageHistoryPrompt(text)) {
    return {
      action: 'subscription_usage_history',
      params: baseParams,
      segment: text,
    };
  }
  if (isCustomerNoShowHistoryPrompt(text)) {
    return {
      action: 'customer_no_show_history',
      params: baseParams,
      segment: text,
    };
  }
  if (isTagCustomerPrompt(text)) {
    return {
      action: 'tag_customer',
      params: { ...baseParams, tag: extractTagFromPrompt(text) },
      segment: text,
    };
  }
  if (isExtendSubscriptionPrompt(text)) {
    return {
      action: 'extend_subscription',
      params: { ...baseParams, extendMonths: extractExtendMonths(text) },
      segment: text,
    };
  }
  if (isExportCustomerDataPrompt(text)) {
    return {
      action: 'export_customer_data',
      params: baseParams,
      segment: text,
    };
  }
  if (isMyAppointmentsPrompt(text)) {
    return { action: 'my_appointments', params: {}, segment: text };
  }
  if (isExplainMySubscriptionPrompt(text)) {
    return { action: 'explain_my_subscription', params: {}, segment: text };
  }
  if (isMySubscriptionsPrompt(text)) {
    return { action: 'my_subscriptions', params: {}, segment: text };
  }
  if (isMyGiftCardsPrompt(text)) {
    return { action: 'my_gift_cards', params: {}, segment: text };
  }
  if (isGiftCardBalancePrompt(text)) {
    return {
      action: 'gift_card_balance',
      params: { giftCardCode: extractGiftCardCode(text) },
      segment: text,
    };
  }
  if (isDiscoverPackagesPrompt(text)) {
    return { action: 'discover_packages', params: {}, segment: text };
  }
  if (isDiscoverSubscriptionPlansPrompt(text)) {
    return { action: 'discover_subscription_plans', params: {}, segment: text };
  }
  if (isDiscoverGiftCardProductsPrompt(text)) {
    return { action: 'discover_gift_card_products', params: {}, segment: text };
  }
  return null;
}

/** Deterministic multi-command split for CRM / account operations. */
export function decomposeCrmCompoundPrompt(prompt: string): CrmCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const segments = trimmed
    .split(COMPOUND_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length <= 1) {
    const single = classifyCrmSegment(trimmed);
    return single ? [single] : [];
  }

  const steps: CrmCompoundStep[] = [];
  let inheritedCustomerName: string | null =
    extractCustomerNameFromPrompt(trimmed);
  for (const segment of segments) {
    const step = classifyCrmSegment(segment, inheritedCustomerName);
    if (step) {
      steps.push(step);
      const name =
        (step.params.customerName as string | undefined) ??
        inheritedCustomerName;
      if (name) inheritedCustomerName = name;
    }
  }
  return steps;
}

/** e2e-bug.81 — verbalize counts/balances; public assistant drops `details.account`. */
export function buildMyGiftCardsSummary(account: {
  orders: Array<{ balance?: number | null }>;
  redeemed: unknown[];
}): string {
  const orderCount = account.orders.length;
  const redeemedCount = account.redeemed.length;
  if (orderCount === 0 && redeemedCount === 0) {
    return 'You have no gift cards.';
  }
  const totalBalance = account.orders.reduce(
    (sum, order) =>
      sum + (typeof order.balance === 'number' ? order.balance : 0),
    0,
  );
  let summary = `You have ${orderCount} gift card(s), ${redeemedCount} redeemed.`;
  if (orderCount > 0) {
    summary += ` Order balances total ${totalBalance}.`;
  }
  return summary;
}

export function buildMyGiftCardsNavigate(): {
  path: 'account';
  query: { tab: 'giftCards' };
} {
  return { path: 'account', query: { tab: 'giftCards' } };
}

/** e2e-bug.52 — my_appointments / list bookings must hand off to Account appointments. */
export function buildMyAppointmentsNavigate(): {
  path: 'account';
  query: { tab: 'bookings' };
} {
  return { path: 'account', query: { tab: 'bookings' } };
}
