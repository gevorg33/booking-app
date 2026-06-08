import { rescueCustomerAdopt6GrowthIntent } from './ai-adopt-6-growth-loops.fixtures.js';
import {
  CUSTOMER_ACCOUNT_MUTATE_INTENTS,
  CUSTOMER_ACCOUNT_READ_INTENTS,
  DISCOVERY_INTENTS,
  rescueCustomerCrmIntent,
} from './ai-customer-crm.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';
import { CUSTOMER_PAYMENTS_INTENTS, rescuePaymentsIntent } from './ai-payments.util.js';
import { rescueReviewsIntent } from './ai-reviews.util.js';
import { rescueListCapabilitiesIntent } from './ai-role-capability-listing.util.js';
import {
  isCancelMyBookingPrompt,
  isRescheduleMyBookingPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';

export type CustomerPublicSelfServiceSurface = 'customer' | 'public';

const PUBLIC_ACCOUNT_CRM_INTENTS = new Set<string>([
  ...CUSTOMER_ACCOUNT_READ_INTENTS,
  ...CUSTOMER_ACCOUNT_MUTATE_INTENTS,
  ...DISCOVERY_INTENTS,
]);

const PUBLIC_PAYMENTS_INTENTS = new Set<string>([
  'buy_gift_card',
  'buy_gift_card_physical',
  'check_gift_card_balance',
  'apply_gift_card_code',
]);

export function isPublicManageBookingHelpPrompt(prompt: string): boolean {
  return (
    /\b(manage|help)\b/i.test(prompt) &&
    /\b(my|this)\b/i.test(prompt) &&
    /\b(booking|appointment|visit)\b/i.test(prompt)
  );
}

export function isPublicAccountCrmIntent(action: string): boolean {
  return PUBLIC_ACCOUNT_CRM_INTENTS.has(action);
}

export function isPublicPaymentsIntent(action: string): boolean {
  return PUBLIC_PAYMENTS_INTENTS.has(action);
}

/** parity-2.3 — deterministic rescue for customer/public self-service prompts. */
export function rescueCustomerPublicSelfServiceIntent(
  prompt: string,
  action: string,
  surface: CustomerPublicSelfServiceSurface,
): { action: string; rescueReason: string } | null {
  const listCapabilities = rescueListCapabilitiesIntent(prompt, action);
  if (listCapabilities) {
    return {
      action: listCapabilities.action,
      rescueReason: 'role_capability_discovery',
    };
  }

  if (surface === 'customer') {
    return (
      rescueSelfServiceBookingIntent(prompt, action) ??
      rescuePaymentsIntent(prompt, action) ??
      rescueMarketingGrowthIntent(prompt, action) ??
      rescueCustomerAdopt6GrowthIntent(prompt, action) ??
      rescueCustomerCrmIntent(prompt, action)
    );
  }

  if (
    (isCancelMyBookingPrompt(prompt) ||
      isRescheduleMyBookingPrompt(prompt) ||
      isPublicManageBookingHelpPrompt(prompt)) &&
    action !== 'booking_help'
  ) {
    return { action: 'booking_help', rescueReason: 'public_manage_booking' };
  }

  const review = rescueReviewsIntent(prompt, action);
  if (review) return review;

  const payments = rescuePaymentsIntent(prompt, action);
  if (payments && isPublicPaymentsIntent(payments.action)) {
    return payments;
  }

  const loyalty = rescueMarketingGrowthIntent(prompt, action);
  if (loyalty?.action === 'loyalty_points_balance') {
    return loyalty;
  }

  const crm = rescueCustomerCrmIntent(prompt, action);
  if (crm && isPublicAccountCrmIntent(crm.action)) {
    return crm;
  }

  return null;
}

export const PUBLIC_SELF_SERVICE_HANDLER_ACTIONS = [
  'buy_gift_card',
  'buy_gift_card_physical',
  'my_profile',
  'my_appointments',
  'my_subscriptions',
  'subscription_usage',
  'my_gift_cards',
  'gift_card_balance',
  'discover_packages',
  'discover_subscription_plans',
  'discover_gift_card_products',
  'loyalty_points_balance',
] as const;

export function isPublicSelfServiceHandlerAction(
  action: string,
): action is (typeof PUBLIC_SELF_SERVICE_HANDLER_ACTIONS)[number] {
  return (PUBLIC_SELF_SERVICE_HANDLER_ACTIONS as readonly string[]).includes(
    action,
  );
}

export function listCustomerSelfServicePaymentIntents(): readonly string[] {
  return CUSTOMER_PAYMENTS_INTENTS;
}
