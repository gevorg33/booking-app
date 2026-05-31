import { formatServicePrice } from '@/lib/booking-types';

export interface BookingPaymentAdjustment {
  type: 'promo' | 'gift_card' | 'loyalty' | 'retail';
  label: string;
  code?: string;
  amount: number;
  points?: number;
}

export interface BookingPaymentSummary {
  currency: string;
  servicePrice: number | null;
  subtotal: number | null;
  promoDiscount: number;
  giftCardDiscount?: number;
  loyaltyDiscount: number;
  loyaltyPointsRedeemed: number;
  promoCode: string | null;
  cashPaid: number;
  retailTotal?: number;
  grandTotal?: number;
  totalDiscount: number;
  hasDiscounts: boolean;
  adjustments: BookingPaymentAdjustment[];
}

export function formatBookingMoney(amount: number | null | undefined, currency: string): string {
  if (amount == null) return '—';
  return formatServicePrice(amount, currency) ?? `${amount} ${currency}`;
}
