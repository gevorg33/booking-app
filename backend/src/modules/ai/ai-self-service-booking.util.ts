import { hasDashboardCustomerReference } from './ai-customer-crm.util.js';
import {
  enrichParamsWithSharedEntities,
  propagateSharedEntityParamsAcrossSteps,
} from './ai-command-entity-params.util.js';

export const SELF_SERVICE_BOOKING_MUTATE_INTENTS = [
  'book_package',
  'book_multi_service',
  'select_subscription_plan',
  'use_subscription_credit',
  'cancel_my_booking',
  'reschedule_my_booking',
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
  'list_my_appointments',
  'get_manage_link',
  'explain_cancel_policy',
  'show_cart_total_duration',
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

function isDashboardCustomerBookingPrompt(prompt: string): boolean {
  return (
    /\bfor\s+(?:customer|client)\b/i.test(prompt) ||
    /\bfor\s+(?!me\b)[A-Za-z]/i.test(prompt) ||
    (hasDashboardCustomerReference(prompt) &&
      /\b(customer|client)\b/i.test(prompt))
  );
}

export function isSelfServiceCustomerPrompt(prompt: string): boolean {
  if (/\bfor\s+me\b/i.test(prompt)) return true;
  return !isDashboardCustomerBookingPrompt(prompt);
}

export function isBookPackagePrompt(prompt: string): boolean {
  return (
    isSelfServiceCustomerPrompt(prompt) &&
    /\b(book|reserve|schedule)\b/i.test(prompt) &&
    (/\bpackage\b/i.test(prompt) || /\bspa\s+day\b/i.test(prompt)) &&
    !/\b(create|configure|update|deactivate)\b/i.test(prompt)
  );
}

export function isBookMultiServicePrompt(prompt: string): boolean {
  return (
    isSelfServiceCustomerPrompt(prompt) &&
    !/\bwith\s+[A-Z][a-z]/i.test(prompt) &&
    /\b(book|reserve|schedule)\b/i.test(prompt) &&
    (/\bmulti[\s-]?service\b/i.test(prompt) ||
      /\bmultiple\s+services?\b/i.test(prompt) ||
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
    /\bpackage\s+availability\b/i.test(prompt)
  );
}

export function isCheckMultiServiceAvailabilityPrompt(prompt: string): boolean {
  if (
    /\bmulti[\s-]?service\s+block\b/i.test(prompt) ||
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
    /\bmulti[\s-]?service\s+availability\b/i.test(prompt)
  );
}

export function isSelectSubscriptionPlanPrompt(prompt: string): boolean {
  return (
    /\b(select|choose|pick|sign\s+up\s+for|subscribe\s+to)\b/i.test(prompt) &&
    /\b(subscription|membership|plan)\b/i.test(prompt) &&
    !/\b(discover|list|show\s+all)\b/i.test(prompt)
  );
}

export function isUseSubscriptionCreditPrompt(prompt: string): boolean {
  return (
    /\b(use|apply|redeem)\b/i.test(prompt) &&
    /\b(subscription|membership|credit|visit)\b/i.test(prompt) &&
    !/\b(create|assign|extend|cancel)\b/i.test(prompt)
  );
}

export function isCancelMyBookingPrompt(prompt: string): boolean {
  return (
    /\b(cancel)\b/i.test(prompt) &&
    /\b(my|this)\b/i.test(prompt) &&
    /\b(booking|appointment)\b/i.test(prompt) &&
    !/\bpackage\s+visit\b/i.test(prompt) &&
    !/\bspa\s+day\b/i.test(prompt) &&
    !hasDashboardCustomerReference(prompt)
  );
}

export function isRescheduleMyBookingPrompt(prompt: string): boolean {
  return (
    /\b(reschedule|move|change)\b/i.test(prompt) &&
    /\b(my|this)\b/i.test(prompt) &&
    /\b(booking|appointment)\b/i.test(prompt) &&
    !/\bpackage\s+visit\b/i.test(prompt) &&
    !/\bspa\s+day\b/i.test(prompt) &&
    !hasDashboardCustomerReference(prompt)
  );
}

export function isCancelPackageVisitSelfPrompt(prompt: string): boolean {
  return (
    /\b(cancel)\b/i.test(prompt) &&
    /\b(my|this)\b/i.test(prompt) &&
    (/\bpackage\s+visit\b/i.test(prompt) ||
      /\bspa\s+day\b/i.test(prompt) ||
      /\bpackage\s+appointment\b/i.test(prompt)) &&
    !hasDashboardCustomerReference(prompt)
  );
}

export function isReschedulePackageVisitSelfPrompt(prompt: string): boolean {
  return (
    /\b(reschedule|move|change)\b/i.test(prompt) &&
    /\b(my|this)\b/i.test(prompt) &&
    (/\bpackage\s+visit\b/i.test(prompt) ||
      /\bspa\s+day\b/i.test(prompt) ||
      /\bpackage\s+appointment\b/i.test(prompt)) &&
    !hasDashboardCustomerReference(prompt)
  );
}

export function isListMyAppointmentsPrompt(prompt: string): boolean {
  return (
    /\bmy\b/i.test(prompt) &&
    /\blist\b/i.test(prompt) &&
    /\b(upcoming\s+)?appointments?\b/i.test(prompt) &&
    !/\b(subscription|gift|package\s+visit)\b/i.test(prompt) &&
    !hasDashboardCustomerReference(prompt)
  );
}

export function isGetManageLinkPrompt(prompt: string): boolean {
  return (
    /\b(manage\s+link|booking\s+link|reschedule\s+link|cancel\s+link|self[\s-]?service\s+link)\b/i.test(
      prompt,
    ) ||
    (/\b(get|send|show)\b/i.test(prompt) &&
      /\b(manage|link)\b/i.test(prompt) &&
      /\b(booking|appointment)\b/i.test(prompt))
  );
}

export function isExplainCancelPolicyPrompt(prompt: string): boolean {
  return (
    /\b(explain|what\s+is|tell\s+me|describe)\b/i.test(prompt) &&
    /\b(cancel(?:lation)?|reschedule|self[\s-]?service)\b/i.test(prompt) &&
    /\b(policy|rules?|window|notice)\b/i.test(prompt)
  );
}

export function isBookWithCashPrompt(prompt: string): boolean {
  return (
    isSelfServiceCustomerPrompt(prompt) &&
    /\b(book|reserve|schedule)\b/i.test(prompt) &&
    /\b(cash|pay\s+cash|cash\s+at\s+visit|pay\s+at\s+(?:the\s+)?venue)\b/i.test(
      prompt,
    ) &&
    !/\bwalk[\s-]?in\b/i.test(prompt)
  );
}

export function isBookWithGiftCardPrompt(prompt: string): boolean {
  return (
    /\b(book|reserve|schedule|checkout|pay)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    !/\b(buy|purchase|balance|apply\s+code)\b/i.test(prompt)
  );
}

export function isChangeProviderOnReschedulePrompt(prompt: string): boolean {
  return (
    /\b(change|switch|different)\b/i.test(prompt) &&
    /\b(provider|specialist|stylist|therapist|employee)\b/i.test(prompt) &&
    /\b(reschedule|when\s+i\s+reschedule|on\s+reschedule)\b/i.test(prompt)
  );
}

export function isAddServicesToCartPrompt(prompt: string): boolean {
  if (/\b(category|catalog|linked\s+services?|translations?)\b/i.test(prompt))
    return false;
  return (
    /\b(add|include|put)\b/i.test(prompt) &&
    (/\b(cart|basket|visit)\b/i.test(prompt) ||
      /\bservices?\b/i.test(prompt)) &&
    !/\b(remove|delete|clear)\b/i.test(prompt)
  );
}

export function isRemoveServiceFromCartPrompt(prompt: string): boolean {
  return (
    /\b(remove|delete|drop|take\s+out)\b/i.test(prompt) &&
    (/\b(cart|basket|visit)\b/i.test(prompt) || /\bservice\b/i.test(prompt))
  );
}

export function isShowCartTotalDurationPrompt(prompt: string): boolean {
  return (
    (/\b(show|what\s+is|how\s+long|total)\b/i.test(prompt) &&
      (/\b(cart|basket|visit)\b/i.test(prompt) ||
        /\bselected\s+services?\b/i.test(prompt)) &&
      /\b(duration|time|minutes?|long)\b/i.test(prompt)) ||
    /\bcart\s+total\s+duration\b/i.test(prompt)
  );
}

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
  return [...new Set(names.filter(Boolean))];
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

/** NL rescue when classifier returns unknown or a nearby action. */
export function rescueSelfServiceBookingIntent(
  prompt: string,
  action: string,
): { action: SelfServiceBookingIntent; rescueReason: string } | null {
  if (isSelfServiceBookingIntent(action)) return null;
  if (isCustomerBookingCompoundPrompt(prompt)) return null;

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
    return { action: 'book_with_gift_card', rescueReason: 'book_gift_card' };
  }
  if (isBookWithCashPrompt(prompt)) {
    return { action: 'book_with_cash', rescueReason: 'book_cash' };
  }
  if (isExplainCancelPolicyPrompt(prompt)) {
    return { action: 'explain_cancel_policy', rescueReason: 'cancel_policy' };
  }
  if (isGetManageLinkPrompt(prompt)) {
    return { action: 'get_manage_link', rescueReason: 'manage_link' };
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
  if (isCancelMyBookingPrompt(prompt)) {
    return { action: 'cancel_my_booking', rescueReason: 'cancel_my' };
  }
  if (isUseSubscriptionCreditPrompt(prompt)) {
    return {
      action: 'use_subscription_credit',
      rescueReason: 'subscription_credit',
    };
  }
  if (isSelectSubscriptionPlanPrompt(prompt)) {
    return { action: 'select_subscription_plan', rescueReason: 'select_plan' };
  }
  if (isCheckMultiServiceAvailabilityPrompt(prompt)) {
    return {
      action: 'check_multi_service_availability',
      rescueReason: 'multi_availability',
    };
  }
  if (isCheckPackageAvailabilityPrompt(prompt)) {
    return {
      action: 'check_package_availability',
      rescueReason: 'package_availability',
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
  if (isGetManageLinkPrompt(text)) {
    return { action: 'get_manage_link', params: base, segment: text };
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
  if (isUseSubscriptionCreditPrompt(text)) {
    return { action: 'use_subscription_credit', params: base, segment: text };
  }
  if (isSelectSubscriptionPlanPrompt(text)) {
    return { action: 'select_subscription_plan', params: base, segment: text };
  }
  if (isCheckMultiServiceAvailabilityPrompt(text)) {
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
    ? propagateSharedEntityParamsAcrossSteps(steps)
    : steps;
}
