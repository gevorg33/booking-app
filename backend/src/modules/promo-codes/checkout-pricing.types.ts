export interface CheckoutAdjustment {
  type: 'promo' | 'gift_card' | 'loyalty';
  code?: string;
  label: string;
  amount: number;
  points?: number;
  promoCodeId?: string;
  giftCardId?: string;
}

export interface CheckoutPricingInput {
  businessId: string;
  servicePrice: number;
  prepaymentAmount: number;
  currency: string;
  promoCode?: string;
  loyaltyPointsToRedeem?: number;
  customerId?: string;
  earnPercentCashback?: number;
}

export interface CheckoutPricingResult {
  servicePrice: number;
  subtotal: number;
  afterPromo: number;
  afterGiftCard: number;
  promoDiscount: number;
  giftCardDiscount: number;
  loyaltyDiscount: number;
  totalDiscount: number;
  amountDue: number;
  currency: string;
  loyaltyPointsToRedeem: number;
  loyaltyPointsBalance: number | null;
  pointsToEarn: number;
  promoCodeId?: string;
  promoCode?: string;
  giftCardId?: string;
  giftCardCode?: string;
  adjustments: CheckoutAdjustment[];
}
