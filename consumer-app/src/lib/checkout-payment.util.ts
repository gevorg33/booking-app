import type { PublicBusinessProfile, PublicCheckoutQuote, PublicService } from './types.js';

export type CheckoutPaymentMethod = 'online' | 'cash';

const PENDING_PAYMENT_KEY = 'consumer_pending_checkout_payment';
// e2e checklist — return-flow reconciliation: without a TTL, an abandoned checkout's
// storage entry hijacks every future visit to the same service's book page (treats it
// as "returning from Stripe" and tries to confirm a payment session that's long dead),
// with no expiry ever clearing it. Stripe Checkout Sessions themselves default to a
// 24h lifetime, so anything older than that can never legitimately be confirmed anyway.
const PENDING_PAYMENT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface PendingCheckoutPayment {
  slug: string;
  sessionId: string;
  serviceId: string;
  startTime: string;
  updatedAt: string;
}

export function prepaymentDue(service: Pick<PublicService, 'onlinePaymentEnabled' | 'prepaymentMode' | 'price' | 'depositAmount'>): number {
  if (!service.onlinePaymentEnabled) return 0;
  if (service.prepaymentMode === 'full') return service.price;
  if (service.depositAmount != null && service.depositAmount > 0) {
    return Math.min(service.depositAmount, service.price);
  }
  if (service.prepaymentMode === 'deposit') {
    // Nudge exact-half ties (e.g. $19.99 -> $9.995) off the IEEE-754 floor
    // so Math.round doesn't silently undercharge by a cent.
    return Math.round(service.price * 50 + 1e-9) / 100;
  }
  return 0;
}

export function resolveCheckoutAmountDue(
  quote: PublicCheckoutQuote | null | undefined,
  service: Pick<PublicService, 'price'>,
): number {
  if (quote && Number.isFinite(quote.amountDue)) return quote.amountDue;
  return service.price;
}

export function showCashPaymentOption(
  profile: Pick<PublicBusinessProfile, 'acceptCashPayments'>,
  service: Pick<
    PublicService,
    'prepaymentMode' | 'onlinePaymentEnabled' | 'price' | 'depositAmount'
  >,
  quote: PublicCheckoutQuote | null | undefined,
): boolean {
  const amountDue = resolveCheckoutAmountDue(quote, service);
  const dueNow = prepaymentDue(service);
  return profile.acceptCashPayments === true && amountDue > 0 && dueNow <= 0;
}

export function requiresOnlinePayment(
  service: Pick<
    PublicService,
    'prepaymentMode' | 'onlinePaymentEnabled' | 'price' | 'depositAmount'
  >,
  quote: PublicCheckoutQuote | null | undefined,
  paymentMethod: CheckoutPaymentMethod,
): boolean {
  const amountDue = resolveCheckoutAmountDue(quote, service);
  const dueNow = prepaymentDue(service);
  if (amountDue <= 0) return false;
  if (paymentMethod === 'cash') return false;
  return dueNow > 0;
}

export function savePendingCheckoutPayment(
  pending: Omit<PendingCheckoutPayment, 'updatedAt'>,
): void {
  if (typeof localStorage === 'undefined') return;
  const next: PendingCheckoutPayment = {
    ...pending,
    slug: pending.slug.trim().toLowerCase(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(next));
}

export function loadPendingCheckoutPayment(slug: string): PendingCheckoutPayment | null {
  if (typeof localStorage === 'undefined' || !slug.trim()) return null;
  try {
    const raw = localStorage.getItem(PENDING_PAYMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingCheckoutPayment;
    if (parsed.slug !== slug.trim().toLowerCase()) return null;
    if (!parsed.sessionId || !parsed.serviceId || !parsed.startTime) return null;
    const age = Date.now() - Date.parse(parsed.updatedAt);
    if (!Number.isFinite(age) || age > PENDING_PAYMENT_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingCheckoutPayment(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(PENDING_PAYMENT_KEY);
}
