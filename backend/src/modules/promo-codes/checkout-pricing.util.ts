import {
  calculateEarnPoints,
  maxRedeemablePoints,
  pointsToCurrency,
} from '../loyalty/loyalty-settings.util.js';
import { roundBonus } from '../loyalty/loyalty.constants.js';

export function roundMoney(value: number): number {
  return roundBonus(value);
}

/** Promo first, then loyalty — loyalty cannot exceed amount remaining after promo. */
export function computeAfterPromo(subtotal: number, promoDiscount: number): number {
  return roundMoney(Math.max(0, subtotal - promoDiscount));
}

export function resolveLoyaltyRedemption(
  requested: number | undefined | null,
  balance: number,
  afterPromo: number,
): number {
  const points = roundBonus(Number(requested) || 0);
  if (points <= 0 || afterPromo <= 0 || balance <= 0) return 0;
  return Math.min(points, maxRedeemablePoints(balance, afterPromo));
}

export function computeCheckoutTotals(input: {
  subtotal: number;
  promoDiscount: number;
  loyaltyPointsToRedeem: number;
}) {
  const afterPromo = computeAfterPromo(input.subtotal, input.promoDiscount);
  const loyaltyDiscount = pointsToCurrency(input.loyaltyPointsToRedeem);
  const amountDue = roundMoney(Math.max(0, afterPromo - loyaltyDiscount));
  const totalDiscount = roundMoney(input.promoDiscount + loyaltyDiscount);

  return {
    afterPromo,
    loyaltyDiscount,
    amountDue,
    totalDiscount,
  };
}

export function computePointsToEarn(amountDue: number, earnPercentCashback?: number): number {
  return calculateEarnPoints(amountDue, earnPercentCashback ?? 0);
}
