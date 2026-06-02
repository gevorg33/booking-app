export interface CheckoutAdjustment {
  type: 'promo' | 'gift_card' | 'loyalty';
  code?: string;
  label: string;
  amount: number;
  points?: number;
  promoCodeId?: string;
  giftCardId?: string;
}

export interface CheckoutServiceLineItem {
  serviceId: string;
  amount: number;
}

export interface GiftCardServiceRedemption {
  serviceId: string;
  units: number;
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
  /** Cart lines used to match service/bundle gift card credits. */
  serviceLineItems?: CheckoutServiceLineItem[];
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
  giftCardServiceRedemptions?: GiftCardServiceRedemption[];
  adjustments: CheckoutAdjustment[];
}
