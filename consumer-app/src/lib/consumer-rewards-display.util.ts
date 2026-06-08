/** adopt-4.6 — consumer rewards + offers display helpers. */

export interface PublicPromotion {
  code: string;
  description: string | null;
  discountLabel: string;
  expiresAt: string | null;
  minOrderAmount: number | null;
}

export interface PublicLoyaltySummary {
  pointsBalance: number;
  lifetimeEarned: number;
  pointsValue: number;
  earnPercentCashback: number;
  bonusDollarValue: number;
}

export interface PublicPromotionsPayload {
  promotions: PublicPromotion[];
}

export interface PublicCustomerRewardsPayload {
  loyaltyEnabled: boolean;
  loyalty: PublicLoyaltySummary | null;
  promotions: PublicPromotion[];
}

export function normalizePublicPromotionsPayload(
  raw: unknown,
): PublicPromotionsPayload {
  const body = raw as PublicPromotionsPayload;
  return {
    promotions: Array.isArray(body?.promotions) ? body.promotions : [],
  };
}

export function normalizePublicCustomerRewardsPayload(
  raw: unknown,
): PublicCustomerRewardsPayload {
  const body = raw as PublicCustomerRewardsPayload;
  return {
    loyaltyEnabled: Boolean(body?.loyaltyEnabled),
    loyalty: body?.loyalty ?? null,
    promotions: Array.isArray(body?.promotions) ? body.promotions : [],
  };
}

export function shouldShowConsumerRewardsSection(input: {
  authed: boolean;
  loyaltyEnabled: boolean;
  loyalty: PublicLoyaltySummary | null;
  promotions: PublicPromotion[];
}): boolean {
  if (input.promotions.length > 0) return true;
  if (!input.authed || !input.loyaltyEnabled || !input.loyalty) return false;
  return input.loyalty.pointsBalance > 0 || input.loyalty.earnPercentCashback > 0;
}

export function formatPromoMinimumOrder(
  minOrderAmount: number | null,
  formatMoney: (amount: number) => string,
): string | null {
  if (minOrderAmount == null || minOrderAmount <= 0) return null;
  return formatMoney(minOrderAmount);
}
