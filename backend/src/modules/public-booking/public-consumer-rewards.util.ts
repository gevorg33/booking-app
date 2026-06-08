/** adopt-4.6 — public loyalty + promo surfacing for consumer app. */

import { PromoDiscountType } from '../promo-codes/entities/promo-code.entity.js';

export interface PromoCodeLike {
  code: string;
  discountType: PromoDiscountType | string;
  discountValue: number | string;
  minOrderAmount?: number | string | null;
  maxUses?: number | null;
  usedCount?: number;
  expiresAt?: Date | string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface PublicPromotionView {
  code: string;
  description: string | null;
  discountLabel: string;
  expiresAt: string | null;
  minOrderAmount: number | null;
}

export interface PublicLoyaltySummaryView {
  pointsBalance: number;
  lifetimeEarned: number;
  pointsValue: number;
  earnPercentCashback: number;
  bonusDollarValue: number;
}

export function isPromoPubliclyActive(
  promo: PromoCodeLike,
  now: Date = new Date(),
): boolean {
  if (promo.isActive === false) return false;
  if (promo.expiresAt) {
    const expires = new Date(promo.expiresAt);
    if (expires.getTime() < now.getTime()) return false;
  }
  if (promo.maxUses != null && (promo.usedCount ?? 0) >= promo.maxUses) {
    return false;
  }
  return true;
}

export function filterPubliclyActivePromos<T extends PromoCodeLike>(
  promos: T[],
  now: Date = new Date(),
): T[] {
  return promos.filter((promo) => isPromoPubliclyActive(promo, now));
}

export function formatPublicPromoDiscountLabel(
  promo: PromoCodeLike,
  currency = 'USD',
): string {
  const value = Number(promo.discountValue);
  if (promo.discountType === PromoDiscountType.PERCENT) {
    return `${Math.round(value)}% off`;
  }
  return `${formatPromoCurrency(value, currency)} off`;
}

function formatPromoCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function toPublicPromotionView(
  promo: PromoCodeLike,
  currency = 'USD',
): PublicPromotionView {
  return {
    code: promo.code.trim().toUpperCase(),
    description: promo.description?.trim() || null,
    discountLabel: formatPublicPromoDiscountLabel(promo, currency),
    expiresAt: promo.expiresAt
      ? new Date(promo.expiresAt).toISOString()
      : null,
    minOrderAmount:
      promo.minOrderAmount != null ? Number(promo.minOrderAmount) : null,
  };
}

export function mapPublicPromotionViews(
  promos: PromoCodeLike[],
  currency = 'USD',
  now: Date = new Date(),
): PublicPromotionView[] {
  return filterPubliclyActivePromos(promos, now).map((promo) =>
    toPublicPromotionView(promo, currency),
  );
}
