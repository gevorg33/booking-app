import type { PublicBusinessProfile, PublicCheckoutQuote } from './types.js';
import { uniqueMultiServiceIds } from './multi-service-booking.js';

export type MultiCheckoutPaymentMethod = 'online' | 'cash';

const PENDING_KEY = 'consumer_pending_multi_checkout_payment';
// e2e checklist — return-flow reconciliation: without a TTL, an abandoned checkout's
// storage entry hijacks every future visit to the same multi-service checkout page
// (treats it as "returning from Stripe" and tries to confirm a payment session that's
// long dead), with no expiry ever clearing it. Stripe Checkout Sessions themselves
// default to a 24h lifetime, so anything older than that can never legitimately confirm.
const PENDING_MULTI_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface PendingMultiServiceCheckoutPayment {
  slug: string;
  sessionId: string;
  serviceIds: string[];
  updatedAt: string;
}

export function resolveMultiServiceAmountDue(
  quote: PublicCheckoutQuote | null | undefined,
  fallbackSubtotal: number,
): number {
  if (quote && Number.isFinite(quote.amountDue)) return quote.amountDue;
  return fallbackSubtotal;
}

export function multiServiceIdsKey(serviceIds: string[]): string {
  return [...uniqueMultiServiceIds(serviceIds)].sort().join(',');
}

export function multiServiceIdsMatch(left: string[], right: string[]): boolean {
  return multiServiceIdsKey(left) === multiServiceIdsKey(right);
}

export function showMultiServiceCashOption(
  profile: Pick<PublicBusinessProfile, 'acceptCashPayments' | 'onlinePaymentsEnabled'>,
  amountDue: number,
): boolean {
  return (
    profile.acceptCashPayments === true &&
    profile.onlinePaymentsEnabled === true &&
    amountDue > 0
  );
}

export function requiresMultiServiceOnlinePayment(
  profile: Pick<PublicBusinessProfile, 'onlinePaymentsEnabled'>,
  amountDue: number,
  paymentMethod: MultiCheckoutPaymentMethod,
): boolean {
  if (amountDue <= 0) return false;
  if (!profile.onlinePaymentsEnabled) return false;
  return paymentMethod !== 'cash';
}

export function savePendingMultiCheckoutPayment(
  pending: Omit<PendingMultiServiceCheckoutPayment, 'updatedAt' | 'serviceIds'> & {
    serviceIds: string[];
  },
): void {
  if (typeof localStorage === 'undefined') return;
  const next: PendingMultiServiceCheckoutPayment = {
    slug: pending.slug.trim().toLowerCase(),
    sessionId: pending.sessionId,
    serviceIds: uniqueMultiServiceIds(pending.serviceIds),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(PENDING_KEY, JSON.stringify(next));
}

function readPendingMultiCheckoutRaw(): PendingMultiServiceCheckoutPayment | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingMultiServiceCheckoutPayment;
  } catch {
    return null;
  }
}

/** Load pending multi checkout by slug (for Stripe return restore). */
export function loadPendingMultiCheckoutBySlug(
  slug: string,
): PendingMultiServiceCheckoutPayment | null {
  if (!slug.trim()) return null;
  const parsed = readPendingMultiCheckoutRaw();
  if (!parsed?.sessionId) return null;
  if (parsed.slug !== slug.trim().toLowerCase()) return null;
  if (!Array.isArray(parsed.serviceIds) || parsed.serviceIds.length < 2) return null;
  const age = Date.now() - Date.parse(parsed.updatedAt);
  if (!Number.isFinite(age) || age > PENDING_MULTI_MAX_AGE_MS) return null;
  return parsed;
}

export function loadPendingMultiCheckoutPayment(
  slug: string,
  serviceIds: string[],
): PendingMultiServiceCheckoutPayment | null {
  const parsed = loadPendingMultiCheckoutBySlug(slug);
  if (!parsed) return null;
  if (!multiServiceIdsMatch(parsed.serviceIds, serviceIds)) return null;
  return parsed;
}

export function clearPendingMultiCheckoutPayment(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(PENDING_KEY);
}
