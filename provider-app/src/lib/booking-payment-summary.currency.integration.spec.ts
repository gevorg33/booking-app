import { describe, expect, it } from 'vitest';
import {
  formatBookingMoney,
  type BookingPaymentSummary,
} from './booking-payment-summary';

function sampleSummary(overrides: Partial<BookingPaymentSummary> = {}): BookingPaymentSummary {
  return {
    currency: 'USD',
    servicePrice: 100,
    subtotal: 100,
    promoDiscount: 0,
    giftCardDiscount: 0,
    loyaltyDiscount: 0,
    loyaltyPointsRedeemed: 0,
    promoCode: null,
    cashPaid: 64,
    retailTotal: 36,
    grandTotal: 100,
    totalDiscount: 0,
    hasDiscounts: true,
    adjustments: [],
    ...overrides,
  };
}

describe('booking-payment-summary currency (provider app)', () => {
  it('formats payment lines with business currency fallback when summary currency missing', () => {
    expect(formatBookingMoney(64, null as unknown as string, 'EUR')).toContain('€');
    expect(formatBookingMoney(36, '', 'EUR')).toContain('€');
  });

  it('returns dash for null amounts', () => {
    expect(formatBookingMoney(null, 'AMD', 'AMD')).toBe('—');
  });

  it('uses summary currency when valid even without business override', () => {
    expect(formatBookingMoney(50, 'AMD', 'USD')).toMatch(/֏|AMD/);
  });

  it('covers POS grand total display path with resolved business currency', () => {
    const summary = sampleSummary({ currency: 'EUR' });
    expect(formatBookingMoney(summary.grandTotal, summary.currency, 'EUR')).toMatch(/€|EUR/);
  });
});
