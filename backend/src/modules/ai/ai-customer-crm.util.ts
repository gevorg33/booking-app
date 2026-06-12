export const DASHBOARD_CRM_MUTATE_INTENTS = [
  'extend_subscription',
  'cancel_subscription_admin',
  'merge_customers',
  'export_customer_data',
  'delete_customer_data',
  'send_reengagement_message',
  'tag_customer',
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
  'privacy_export',
  'privacy_delete',
] as const;

export const CUSTOMER_ACCOUNT_READ_INTENTS = [
  'my_profile',
  'my_appointments',
  'my_subscriptions',
  'subscription_usage',
  'my_gift_cards',
  'gift_card_balance',
  'gift_card_redemption_history',
  'track_physical_gift_card_order',
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

export function isListCustomerSubscriptionsPrompt(prompt: string): boolean {
  return (
    /\b(list|show)\b/i.test(prompt) &&
    hasDashboardCustomerReference(prompt) &&
    /\b(subscription|membership|plan)s?\b/i.test(prompt) &&
    !isMyAccountPrompt(prompt)
  );
}

export function isSubscriptionUsageHistoryPrompt(prompt: string): boolean {
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
  return (
    /\bmy\b/i.test(prompt) && /\b(profile|account|details)\b/i.test(prompt)
  );
}

export function isMyAppointmentsPrompt(prompt: string): boolean {
  return (
    /\bmy\b/i.test(prompt) &&
    /\b(appointments?|bookings?|visits?|schedule)\b/i.test(prompt) &&
    !/\b(subscription|gift)\b/i.test(prompt)
  );
}

export function isMySubscriptionsPrompt(prompt: string): boolean {
  return (
    /\bmy\b/i.test(prompt) &&
    /\b(subscription|membership|plan)s?\b/i.test(prompt) &&
    !/\busage\b/i.test(prompt)
  );
}

export function isSubscriptionUsagePrompt(prompt: string): boolean {
  return (
    /\bmy\b/i.test(prompt) &&
    /\b(subscription|membership|plan)\b/i.test(prompt) &&
    /\b(usage|visits?|remaining|credits?)\b/i.test(prompt)
  );
}

export function isMyGiftCardsPrompt(prompt: string): boolean {
  return (
    /\bmy\b/i.test(prompt) &&
    /\b(gift\s*cards?|orders?)\b/i.test(prompt) &&
    !/\b(balance|redemption|track|cancel|modify)\b/i.test(prompt)
  );
}

export function isGiftCardBalancePrompt(prompt: string): boolean {
  return (
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(balance|remaining|left)\b/i.test(prompt)
  );
}

export function isGiftCardRedemptionHistoryPrompt(prompt: string): boolean {
  return (
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(redemption|redeemed|used)\b/i.test(prompt)
  );
}

export function isRequestGiftCardCancelPrompt(prompt: string): boolean {
  return (
    /\b(cancel|refund)\b/i.test(prompt) &&
    /\b(gift\s*card|order)\b/i.test(prompt) &&
    (/\bmy\b/i.test(prompt) || /\brequest\b/i.test(prompt))
  );
}

export function isRequestGiftCardModifyPrompt(prompt: string): boolean {
  return (
    /\b(change|modify|update|edit)\b/i.test(prompt) &&
    /\b(gift\s*card|order)\b/i.test(prompt) &&
    (/\bmy\b/i.test(prompt) || /\brequest\b/i.test(prompt))
  );
}

export function isTrackPhysicalGiftCardPrompt(prompt: string): boolean {
  return (
    /\b(track|where|status|shipment|shipping|delivery)\b/i.test(prompt) &&
    /\b(gift\s*card|physical|order)\b/i.test(prompt)
  );
}

export function isPrivacyExportPrompt(prompt: string): boolean {
  return (
    (/\bmy\b/i.test(prompt) || /\bprivacy\b/i.test(prompt)) &&
    /\b(export|download)\b/i.test(prompt) &&
    /\b(data|information)\b/i.test(prompt)
  );
}

export function isPrivacyDeletePrompt(prompt: string): boolean {
  return (
    (/\bmy\b/i.test(prompt) || /\bprivacy\b/i.test(prompt)) &&
    /\b(delete|erase|remove)\b/i.test(prompt) &&
    /\b(data|account|information)\b/i.test(prompt)
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
  return (
    /\b(what|which|show|list|discover|available|membership)\b/i.test(prompt) &&
    /\b(subscription|membership)\s+plans?\b/i.test(prompt) &&
    !/\b(create|add|update|deactivate|customer|for)\b/i.test(prompt)
  );
}

export function isDiscoverGiftCardProductsPrompt(prompt: string): boolean {
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
  if (isCustomerCrmIntent(action)) return null;
  if (isCrmCompoundPrompt(prompt) && action !== 'compound_intent') {
    return null;
  }
  if (isProviderMobileClientContextPrompt(prompt)) return null;

  if (isPrivacyDeletePrompt(prompt))
    return { action: 'privacy_delete', rescueReason: 'privacy_delete' };
  if (isPrivacyExportPrompt(prompt))
    return { action: 'privacy_export', rescueReason: 'privacy_export' };
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
  if (isTrackPhysicalGiftCardPrompt(prompt))
    return {
      action: 'track_physical_gift_card_order',
      rescueReason: 'track_gift_card',
    };
  if (isGiftCardRedemptionHistoryPrompt(prompt))
    return {
      action: 'gift_card_redemption_history',
      rescueReason: 'gift_card_redemption',
    };
  if (isGiftCardBalancePrompt(prompt))
    return { action: 'gift_card_balance', rescueReason: 'gift_card_balance' };
  if (isSubscriptionUsagePrompt(prompt))
    return { action: 'subscription_usage', rescueReason: 'subscription_usage' };
  if (isMyGiftCardsPrompt(prompt))
    return { action: 'my_gift_cards', rescueReason: 'my_gift_cards' };
  if (isMySubscriptionsPrompt(prompt))
    return { action: 'my_subscriptions', rescueReason: 'my_subscriptions' };
  if (isMyAppointmentsPrompt(prompt)) {
    if (action === 'list_my_appointments') return null;
    return { action: 'my_appointments', rescueReason: 'my_appointments' };
  }
  if (isMyProfilePrompt(prompt))
    return { action: 'my_profile', rescueReason: 'my_profile' };

  if (
    isDiscoverGiftCardProductsPrompt(prompt) &&
    action !== 'configure_gift_card_products'
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
  if (
    isListCustomerSubscriptionsPrompt(prompt) &&
    action !== 'list_subscription_plans'
  ) {
    return {
      action: 'list_customer_subscriptions',
      rescueReason: 'list_subscriptions',
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
