import type { CheckoutPaymentMethod } from './checkout-payment.util.js';
import {
  requiresOnlinePayment,
  resolveCheckoutAmountDue,
  showCashPaymentOption,
} from './checkout-payment.util.js';
import type { PublicBusinessProfile, PublicCheckoutQuote, PublicService } from './types.js';
import { getConsumerCopy } from './consumer-copy-catalog.js';
import { normalizeConsumerLocale } from './tenant-locale.js';

/** n99-3.3 — activation is first booking or deferred deep-link resume. */
export function isActivationBookingPath(input: {
  completedBookingCount: number;
  isDeferredResume?: boolean;
}): boolean {
  return input.completedBookingCount === 0 || Boolean(input.isDeferredResume);
}

export function isActivationSlotPrefilled(input: {
  isActivationPath: boolean;
  hasSlot: boolean;
  isDeferredResume: boolean;
  slotAutoSelected: boolean;
}): boolean {
  if (!input.isActivationPath || !input.hasSlot) return false;
  return input.isDeferredResume || input.slotAutoSelected;
}

export function resolveActivationPaymentMethod(input: {
  isActivationPath: boolean;
  cashAvailable: boolean;
  currentMethod: CheckoutPaymentMethod;
  paymentTiming?: 'pay_at_venue_default' | 'online_first';
}): CheckoutPaymentMethod {
  if (!input.isActivationPath || !input.cashAvailable) return input.currentMethod;
  if (input.paymentTiming === 'online_first') return input.currentMethod;
  return 'cash';
}

export function shouldPreferPayAtVenueForActivation(input: {
  isActivationPath: boolean;
  cashAvailable: boolean;
  paymentTiming?: 'pay_at_venue_default' | 'online_first';
}): boolean {
  if (input.paymentTiming === 'online_first') return false;
  return input.isActivationPath && input.cashAvailable;
}

export function shouldAutoRetryWithPayAtVenue(input: {
  isActivationPath: boolean;
  cashAvailable: boolean;
  checkoutFailed: boolean;
}): boolean {
  return input.isActivationPath && input.cashAvailable && input.checkoutFailed;
}

export function shouldShowPaymentHiccupFallback(input: {
  isActivationPath: boolean;
  cashAvailable: boolean;
  awaitingPaymentReturn: boolean;
  checkoutFailed: boolean;
}): boolean {
  if (!input.isActivationPath || !input.cashAvailable) return false;
  return input.awaitingPaymentReturn || input.checkoutFailed;
}

export function activationPaymentBlocksConfirm(input: {
  isActivationPath: boolean;
  profile: Pick<PublicBusinessProfile, 'acceptCashPayments'>;
  service: Pick<
    PublicService,
    'prepaymentMode' | 'onlinePaymentEnabled' | 'price' | 'depositAmount'
  >;
  quote: PublicCheckoutQuote | null | undefined;
  paymentMethod: CheckoutPaymentMethod;
}): boolean {
  const cashAvailable = showCashPaymentOption(input.profile, input.service, input.quote);
  if (input.isActivationPath && cashAvailable) return false;
  return requiresOnlinePayment(input.service, input.quote, input.paymentMethod);
}

export function resolveActivationPaymentAnalyticsProps(input: {
  bookingId?: string;
  serviceId?: string;
  paymentMethod: CheckoutPaymentMethod;
  fallbackReason?: 'checkout_failed' | 'payment_return';
}) {
  return {
    ...(input.bookingId ? { bookingId: input.bookingId } : {}),
    ...(input.serviceId ? { serviceId: input.serviceId } : {}),
    onboardingStep: input.fallbackReason ?? input.paymentMethod,
  };
}

export function buildActivationPaymentCopy(locale?: string | null): {
  optionalHint: string;
  hiccupMessage: string;
  payAtVenueFallbackAction: string;
  payAtVenueSelected: string;
} {
  const copy = getConsumerCopy(normalizeConsumerLocale(locale) ?? 'en');
  return {
    optionalHint: copy.activationPaymentOptionalHint,
    hiccupMessage: copy.activationPaymentHiccupMessage,
    payAtVenueFallbackAction: copy.activationPayAtVenueFallbackAction,
    payAtVenueSelected: copy.activationPayAtVenueSelected,
  };
}

export function resolveCheckoutAmountLabel(input: {
  quote: PublicCheckoutQuote | null | undefined;
  service: Pick<PublicService, 'price'>;
  paymentMethod: CheckoutPaymentMethod;
  isActivationPath: boolean;
}): 'confirm' | 'pay_online' | 'pay_at_visit' {
  const amountDue = resolveCheckoutAmountDue(input.quote, input.service);
  if (amountDue <= 0) return 'confirm';
  if (input.paymentMethod === 'cash' && input.isActivationPath) return 'pay_at_visit';
  if (requiresOnlinePayment(input.service, input.quote, input.paymentMethod)) return 'pay_online';
  return 'confirm';
}
