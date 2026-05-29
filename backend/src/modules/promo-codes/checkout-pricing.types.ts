export interface CheckoutAdjustment {
  type: 'promo' | 'loyalty';
  code?: string;
  label: string;
  amount: number;
  points?: number;
  promoCodeId?: string;
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
  promoDiscount: number;
  loyaltyDiscount: number;
  totalDiscount: number;
  amountDue: number;
  currency: string;
  loyaltyPointsToRedeem: number;
  loyaltyPointsBalance: number | null;
  pointsToEarn: number;
  promoCodeId?: string;
  promoCode?: string;
  adjustments: CheckoutAdjustment[];
}
