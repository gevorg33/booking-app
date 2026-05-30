import { roundBonus } from './loyalty.constants.js';

export interface BookingAmountSource {
  metadata?: Record<string, unknown> | null;
  servicePrice?: number | null;
}

function readPricing(metadata: Record<string, unknown>): Record<string, unknown> | null {
  const pricing = metadata.pricing;
  return pricing && typeof pricing === 'object' ? (pricing as Record<string, unknown>) : null;
}

/** True when this booking redeemed loyalty bonuses at checkout. */
export function wasLoyaltyRedeemedOnBooking(metadata?: Record<string, unknown> | null): boolean {
  const meta = metadata ?? {};
  const pricing = readPricing(meta);
  const loyaltyDiscount = Number(pricing?.loyaltyDiscount ?? meta.loyaltyDiscount ?? 0);
  const loyaltyRedeemed = Number(
    pricing?.loyaltyPointsRedeemed ??
      pricing?.loyaltyPointsToRedeem ??
      meta.loyaltyPointsRedeemed ??
      0,
  );
  return loyaltyDiscount > 0 || loyaltyRedeemed > 0;
}

/**
 * Cash/card (or other eligible) amount that may earn loyalty cashback.
 * Excludes any portion covered by redeemed loyalty bonuses.
 */
export function resolveEligibleCashPaidForEarn(source: BookingAmountSource): number {
  const metadata = source.metadata ?? {};
  const pricing = readPricing(metadata);

  const cashCandidates = [
    metadata.cashPaidEligible,
    metadata.amountPaid,
    pricing?.amountDue,
    metadata.prepaymentAmount,
  ];

  for (const value of cashCandidates) {
    if (value === null || value === undefined || value === '') continue;
    const amount = Number(value);
    if (Number.isFinite(amount) && amount >= 0) {
      return roundBonus(amount);
    }
  }

  // Loyalty covered part or all of the bill — never fall back to full service price.
  if (wasLoyaltyRedeemedOnBooking(metadata)) {
    return 0;
  }

  const servicePrice = Number(source.servicePrice);
  if (Number.isFinite(servicePrice) && servicePrice > 0) {
    return roundBonus(servicePrice);
  }

  return 0;
}

/** @alias resolveEligibleCashPaidForEarn */
export const resolveAmountPaid = resolveEligibleCashPaidForEarn;
