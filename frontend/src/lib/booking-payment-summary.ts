import { formatServicePrice } from '@/lib/booking-types';

export interface BookingPaymentAdjustment {
  type: 'promo' | 'gift_card' | 'loyalty' | 'retail';
  label: string;
  code?: string;
  amount: number;
  points?: number;
}

export interface BookingTaxLine {
  id: string;
  name: string;
  rate: number;
  amount: number;
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
  taxEnabled?: boolean;
  taxName?: string | null;
  taxRate?: number | null;
  taxModel?: 'inclusive' | 'exclusive' | null;
  taxAmount?: number;
  netAmount?: number | null;
  taxLines?: BookingTaxLine[];
}

export function resolveBookingTaxDisplayLines(
  summary: Pick<
    BookingPaymentSummary,
    'taxEnabled' | 'taxAmount' | 'taxName' | 'taxRate' | 'taxLines'
  >,
): BookingTaxLine[] {
  const taxAmount = summary.taxAmount ?? 0;
  if (!summary.taxEnabled || taxAmount <= 0) return [];
  if (summary.taxLines && summary.taxLines.length > 0) {
    return summary.taxLines;
  }
  return [
    {
      id: 'aggregate',
      name: summary.taxName?.trim() || 'Tax',
      rate: summary.taxRate ?? 0,
      amount: taxAmount,
    },
  ];
}

export function formatBookingMoney(amount: number | null | undefined, currency: string): string {
  if (amount == null) return '—';
  return formatServicePrice(amount, currency) ?? `${amount} ${currency}`;
}
