import {
  calculateEarnPoints,
  maxRedeemablePoints,
  pointsToCurrency,
} from '../loyalty/loyalty-settings.util.js';
import { roundBonus } from '../loyalty/loyalty.constants.js';

export function roundMoney(value: number): number {
  return roundBonus(value);
}

export function isGiftCardCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return normalized.startsWith('GC-') || /^GC[MSB]-/.test(normalized);
}

/** Promo first, then gift card, then loyalty. */
export function computeAfterPromo(subtotal: number, promoDiscount: number): number {
  return roundMoney(Math.max(0, subtotal - promoDiscount));
}

export function computeAfterGiftCard(afterPromo: number, giftCardDiscount: number): number {
  return roundMoney(Math.max(0, afterPromo - giftCardDiscount));
}

export function resolveGiftCardRedemption(balance: number, amountDue: number): number {
  const due = roundMoney(Math.max(0, amountDue));
  if (due <= 0 || balance <= 0) return 0;
  return roundMoney(Math.min(balance, due));
}

export function resolveLoyaltyRedemption(
  requested: number | undefined | null,
  balance: number,
  amountDue: number,
): number {
  const points = roundBonus(Number(requested) || 0);
  if (points <= 0 || amountDue <= 0 || balance <= 0) return 0;
  return Math.min(points, maxRedeemablePoints(balance, amountDue));
}

export function computeCheckoutTotals(input: {
  subtotal: number;
  promoDiscount: number;
  giftCardDiscount: number;
  loyaltyPointsToRedeem: number;
}) {
  const afterPromo = computeAfterPromo(input.subtotal, input.promoDiscount);
  const giftCardDiscount = roundMoney(input.giftCardDiscount);
  const afterGiftCard = computeAfterGiftCard(afterPromo, giftCardDiscount);
  const loyaltyDiscount = pointsToCurrency(input.loyaltyPointsToRedeem);
  const amountDue = roundMoney(Math.max(0, afterGiftCard - loyaltyDiscount));
  const totalDiscount = roundMoney(
    input.promoDiscount + giftCardDiscount + loyaltyDiscount,
  );

  return {
    afterPromo,
    afterGiftCard,
    giftCardDiscount,
    loyaltyDiscount,
    amountDue,
    totalDiscount,
  };
}

export function computePointsToEarn(amountDue: number, earnPercentCashback?: number): number {
  return calculateEarnPoints(amountDue, earnPercentCashback ?? 0);
}
