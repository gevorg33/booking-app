import {
  resolveBookingPaymentSummary,
  withBookingPaymentSummary,
} from './booking-payment-summary.util.js';

describe('resolveBookingPaymentSummary', () => {
  it('returns null when no checkout pricing was recorded', () => {
    expect(resolveBookingPaymentSummary({ metadata: {}, service: { price: 100 } })).toBeNull();
  });

  it('parses promo + loyalty + cash from pricing metadata', () => {
    const summary = resolveBookingPaymentSummary({
      metadata: {
        pricing: {
          servicePrice: 100,
          subtotal: 50,
          promoDiscount: 20,
          loyaltyDiscount: 30,
          totalDiscount: 50,
          amountDue: 0,
          loyaltyPointsRedeemed: 30,
          promoCode: 'SAVE20',
          adjustments: [
            { type: 'promo', code: 'SAVE20', label: 'Promo SAVE20', amount: 20 },
            { type: 'loyalty', label: 'Loyalty points', amount: 30, points: 30 },
          ],
        },
        amountPaid: 0,
        cashPaidEligible: 0,
      },
      service: { price: 100, currency: 'USD' },
    });

    expect(summary).toMatchObject({
      servicePrice: 100,
      subtotal: 50,
      promoDiscount: 20,
      loyaltyDiscount: 30,
      loyaltyPointsRedeemed: 30,
      promoCode: 'SAVE20',
      cashPaid: 0,
      totalDiscount: 50,
      hasDiscounts: true,
      currency: 'USD',
    });
    expect(summary?.adjustments).toHaveLength(2);
  });

  it('builds fallback adjustments when pricing has no adjustments array', () => {
    const summary = resolveBookingPaymentSummary({
      metadata: {
        pricing: {
          subtotal: 100,
          promoDiscount: 10,
          loyaltyDiscount: 25,
          amountDue: 65,
          promoCode: 'TENOFF',
          loyaltyPointsRedeemed: 25,
        },
      },
      service: { price: 100, currency: 'EUR' },
    });

    expect(summary?.adjustments).toEqual([
      { type: 'promo', label: 'Promo TENOFF', code: 'TENOFF', amount: 10 },
      { type: 'loyalty', label: 'Loyalty bonuses', amount: 25, points: 25 },
    ]);
    expect(summary?.cashPaid).toBe(65);
    expect(summary?.currency).toBe('EUR');
  });

  it('supports stripe-only prepayment metadata', () => {
    const summary = resolveBookingPaymentSummary({
      metadata: { prepaymentAmount: 50, amountPaid: 50 },
      service: { price: 100, currency: 'USD' },
    });

    expect(summary?.cashPaid).toBe(50);
    expect(summary?.hasDiscounts).toBe(false);
  });

  it('includes retail lines in grand total', () => {
    const summary = resolveBookingPaymentSummary(
      {
        metadata: { pricing: { subtotal: 80, amountDue: 80 } },
        service: { price: 80, currency: 'USD' },
      },
      [{ productName: 'Shampoo', quantity: 2, unitPrice: 18, lineTotal: 36 }],
    );

    expect(summary?.retailTotal).toBe(36);
    expect(summary?.grandTotal).toBe(116);
    expect(summary?.cashPaid).toBe(80);
  });

  it('returns summary with retail-only booking metadata', () => {
    const summary = resolveBookingPaymentSummary(
      { metadata: {}, service: { price: 0, currency: 'USD' } },
      [{ productName: 'Oil', quantity: 1, unitPrice: 12, lineTotal: 12 }],
    );
    expect(summary?.retailTotal).toBe(12);
    expect(summary?.grandTotal).toBe(12);
  });

  it('builds gift card fallback adjustments and derives cash paid from subtotal', () => {
    const withGiftCard = resolveBookingPaymentSummary({
      metadata: {
        pricing: {
          subtotal: 100,
          promoDiscount: 0,
          giftCardDiscount: 15,
          loyaltyDiscount: 0,
          giftCardCode: 'GIFT15',
        },
      },
      service: { price: 100, currency: 'USD' },
    });

    expect(withGiftCard?.cashPaid).toBe(85);
    expect(withGiftCard?.adjustments).toEqual([
      { type: 'gift_card', label: 'Gift card GIFT15', code: 'GIFT15', amount: 15 },
    ]);
  });

  it('parses structured adjustments including retail lines', () => {
    const summary = resolveBookingPaymentSummary({
      metadata: {
        pricing: {
          subtotal: 60,
          amountDue: 60,
          adjustments: [
            { type: 'retail', label: 'Shampoo', amount: 18 },
            { type: 'invalid', amount: 5 },
            { type: 'promo', amount: 0 },
          ],
        },
      },
      service: { price: 60, currency: 'USD' },
    });

    expect(summary?.adjustments).toEqual([
      { type: 'retail', label: 'Shampoo', amount: 18 },
    ]);
  });

  it('uses generic promo and gift card labels when codes are absent', () => {
    const summary = resolveBookingPaymentSummary({
      metadata: {
        pricing: {
          subtotal: 100,
          promoDiscount: 10,
          giftCardDiscount: 5,
          loyaltyDiscount: 0,
        },
      },
      service: { price: 100, currency: 'USD' },
    });

    expect(summary?.adjustments).toEqual([
      { type: 'promo', label: 'Promo discount', amount: 10 },
      { type: 'gift_card', label: 'Gift card', amount: 5 },
    ]);
  });
});

describe('withBookingPaymentSummary', () => {
  it('attaches paymentSummary to booking-like objects', () => {
    const result = withBookingPaymentSummary({
      id: 'b1',
      metadata: { pricing: { subtotal: 80, amountDue: 80 } },
      service: { price: 80 },
    });

    expect(result.id).toBe('b1');
    expect(result.paymentSummary?.subtotal).toBe(80);
  });
});
