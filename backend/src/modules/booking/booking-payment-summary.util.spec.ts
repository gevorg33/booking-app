import {
  readBookingListAmounts,
  recordTaxInclusivePaymentAmount,
  resolveBookingPaymentSummary,
  withBookingPaymentSummary,
} from './booking-payment-summary.util.js';

describe('resolveBookingPaymentSummary', () => {
  it('returns null when no checkout pricing was recorded', () => {
    expect(
      resolveBookingPaymentSummary({ metadata: {}, service: { price: 100 } }),
    ).toBeNull();
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
            {
              type: 'promo',
              code: 'SAVE20',
              label: 'Promo SAVE20',
              amount: 20,
            },
            {
              type: 'loyalty',
              label: 'Loyalty points',
              amount: 30,
              points: 30,
            },
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
      {
        type: 'gift_card',
        label: 'Gift card GIFT15',
        code: 'GIFT15',
        amount: 15,
      },
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

  it('ignores invalid pricing adjustments and non-numeric amounts', () => {
    const summary = resolveBookingPaymentSummary({
      metadata: {
        pricing: {
          subtotal: 90,
          amountDue: 90,
          adjustments: [
            null,
            { type: 'gift_card', amount: 'bad' },
            { type: 'loyalty', amount: 10, label: 'Points' },
            { type: 'gift_card', amount: 8 },
          ],
        },
      },
      service: { price: 90, currency: 'USD' },
    });

    expect(summary?.adjustments).toEqual([
      { type: 'loyalty', label: 'Points', amount: 10 },
      { type: 'gift_card', label: 'Gift card', amount: 8 },
    ]);
  });

  it('derives cash paid from amountPaid and cashPaidEligible fallbacks', () => {
    const fromAmountPaid = resolveBookingPaymentSummary({
      metadata: { amountPaid: 42 },
      service: { price: 100, currency: 'USD' },
    });
    const fromCashEligible = resolveBookingPaymentSummary({
      metadata: { cashPaidEligible: 55, pricing: {} },
      service: { price: 100, currency: 'USD' },
    });

    expect(fromAmountPaid?.cashPaid).toBe(42);
    expect(fromCashEligible?.cashPaid).toBe(55);
  });

  it('omits loyalty points in fallback when none were redeemed', () => {
    const summary = resolveBookingPaymentSummary({
      metadata: {
        pricing: {
          subtotal: 100,
          loyaltyDiscount: 20,
          promoDiscount: 0,
          giftCardDiscount: 0,
        },
      },
      service: { price: 100, currency: 'USD' },
    });

    expect(summary?.adjustments).toEqual([
      { type: 'loyalty', label: 'Loyalty bonuses', amount: 20 },
    ]);
  });

  it('handles null metadata on booking source', () => {
    expect(
      resolveBookingPaymentSummary(
        { metadata: null, service: { price: 100 } },
        [],
      ),
    ).toBeNull();
  });

  it.each([
    {
      id: 'missing-service',
      serviceCurrency: null,
      settings: { currency: 'AMD' },
      expected: 'AMD',
    },
    {
      id: 'invalid-service',
      serviceCurrency: 'BOGUS',
      settings: { currency: 'GEL' },
      expected: 'GEL',
    },
    {
      id: 'legacy-usd-preserved',
      serviceCurrency: 'USD',
      settings: { currency: 'EUR' },
      expected: 'USD',
    },
  ])(
    'uses business default currency when service currency is $id',
    ({ serviceCurrency, settings, expected }) => {
      const summary = resolveBookingPaymentSummary(
        {
          metadata: { pricing: { subtotal: 50, amountDue: 50 } },
          service: { price: 50, currency: serviceCurrency },
        },
        [],
        settings,
      );

      expect(summary?.currency).toBe(expected);
    },
  );

  it('combines business currency with retail POS grand total', () => {
    const summary = resolveBookingPaymentSummary(
      {
        metadata: { pricing: { subtotal: 80, amountDue: 64 } },
        service: { price: 80, currency: null },
      },
      [{ productName: 'Oil', quantity: 1, unitPrice: 36, lineTotal: 36 }],
      { currency: 'CHF' },
    );

    expect(summary).toMatchObject({
      currency: 'CHF',
      retailTotal: 36,
      grandTotal: 100,
      cashPaid: 64,
    });
  });

  it('parses stacked tax lines from pricing metadata', () => {
    const summary = resolveBookingPaymentSummary({
      metadata: {
        pricing: {
          servicePrice: 100,
          subtotal: 100,
          amountDue: 113,
          taxEnabled: true,
          taxName: 'GST + PST',
          taxRate: 13,
          taxModel: 'exclusive',
          taxAmount: 13,
          netAmount: 100,
          taxRules: [
            { id: 'gst', name: 'GST', rate: 5, amount: 5 },
            { id: 'pst', name: 'PST', rate: 8, amount: 8 },
          ],
        },
        amountPaid: 113,
      },
      service: { price: 100, currency: 'USD' },
    });

    expect(summary).toMatchObject({
      taxEnabled: true,
      taxAmount: 13,
      grandTotal: 113,
      taxLines: [
        { id: 'gst', name: 'GST', rate: 5, amount: 5 },
        { id: 'pst', name: 'PST', rate: 8, amount: 8 },
      ],
    });
  });

  it.each([
    {
      id: 'exclusive-single',
      pricing: {
        amountDue: 120,
        taxEnabled: true,
        taxName: 'VAT',
        taxRate: 20,
        taxModel: 'exclusive',
        taxAmount: 20,
        netAmount: 100,
      },
      expected: {
        taxEnabled: true,
        taxAmount: 20,
        taxModel: 'exclusive',
        taxLines: [{ id: 'aggregate', name: 'VAT', rate: 20, amount: 20 }],
        hasDiscounts: true,
      },
    },
    {
      id: 'inclusive-single',
      pricing: {
        amountDue: 120,
        taxEnabled: true,
        taxName: 'GST',
        taxRate: 5,
        taxModel: 'inclusive',
        taxAmount: 5.71,
        netAmount: 114.29,
      },
      expected: {
        taxModel: 'inclusive',
        taxLines: [{ id: 'aggregate', name: 'GST', rate: 5, amount: 5.71 }],
      },
    },
    {
      id: 'tax-disabled',
      pricing: {
        amountDue: 100,
        taxEnabled: false,
        taxAmount: 0,
      },
      expected: {
        hasDiscounts: false,
      },
    },
    {
      id: 'zero-tax-amount',
      pricing: {
        amountDue: 100,
        taxEnabled: true,
        taxAmount: 0,
      },
      expected: {
        hasDiscounts: false,
      },
    },
  ])('parses $id tax metadata', ({ pricing, expected }) => {
    const summary = resolveBookingPaymentSummary({
      metadata: { pricing },
      service: { price: 100, currency: 'USD' },
    });
    expect(summary).toMatchObject(expected);
  });

  it('normalizes stacked tax rule ids and names when fields are partial', () => {
    const summary = resolveBookingPaymentSummary({
      metadata: {
        pricing: {
          amountDue: 113,
          taxEnabled: true,
          taxAmount: 13,
          taxRules: [
            null,
            { amount: 5 },
            { id: '  pst  ', name: '  ', amount: 8, rate: 8 },
          ],
        },
      },
      service: { price: 100, currency: 'USD' },
    });

    expect(summary?.taxLines).toEqual([
      { id: 'rule-2', name: 'VAT', rate: 0, amount: 5 },
      { id: 'pst', name: 'VAT', rate: 8, amount: 8 },
    ]);
  });

  it('falls back to aggregate tax line when stacked rules are invalid', () => {
    const summary = resolveBookingPaymentSummary({
      metadata: {
        pricing: {
          amountDue: 113,
          taxEnabled: true,
          taxName: 'Tax',
          taxRate: 13,
          taxAmount: 13,
          taxRules: [{ bad: true }, { amount: 0 }],
        },
      },
      service: { price: 100, currency: 'USD' },
    });

    expect(summary?.taxLines).toEqual([
      { id: 'aggregate', name: 'Tax', rate: 13, amount: 13 },
    ]);
  });

  it('uses single stacked rule as aggregate line', () => {
    const summary = resolveBookingPaymentSummary({
      metadata: {
        pricing: {
          amountDue: 105,
          taxEnabled: true,
          taxAmount: 5,
          taxRules: [{ id: 'gst', name: 'GST', rate: 5, amount: 5 }],
        },
      },
      service: { price: 100, currency: 'USD' },
    });

    expect(summary?.taxLines).toEqual([
      { id: 'aggregate', name: 'VAT', rate: 0, amount: 5 },
    ]);
  });
});

describe('readBookingListAmounts', () => {
  it.each([
    {
      id: 'pricing-amount-due',
      metadata: { pricing: { amountDue: 120, taxAmount: 20 } },
      expected: { amountPaid: 120, taxAmount: 20 },
    },
    {
      id: 'fallback-amount-paid',
      metadata: { amountPaid: 80 },
      expected: { amountPaid: 80, taxAmount: null },
    },
    {
      id: 'null-metadata',
      metadata: null,
      expected: { amountPaid: null, taxAmount: null },
    },
  ])('reads list amounts for $id', ({ metadata, expected }) => {
    expect(readBookingListAmounts(metadata)).toEqual(expected);
  });
});

describe('recordTaxInclusivePaymentAmount', () => {
  it('stores tax-inclusive amount paid from pricing metadata', () => {
    expect(
      recordTaxInclusivePaymentAmount({
        pricing: { amountDue: 120, taxAmount: 20 },
      }),
    ).toMatchObject({
      amountPaid: 120,
      cashPaidEligible: 120,
    });
  });

  it('leaves metadata unchanged when pricing amount due is missing', () => {
    expect(
      recordTaxInclusivePaymentAmount({ source: 'dashboard_booking' }),
    ).toEqual({ source: 'dashboard_booking' });
  });

  it('handles null and undefined metadata', () => {
    expect(recordTaxInclusivePaymentAmount(null)).toEqual({});
    expect(recordTaxInclusivePaymentAmount(undefined)).toEqual({});
  });

  it('records zero amount due for fully discounted tax-inclusive bookings', () => {
    expect(
      recordTaxInclusivePaymentAmount({
        pricing: { amountDue: 0, taxAmount: 0 },
      }),
    ).toMatchObject({
      amountPaid: 0,
      cashPaidEligible: 0,
    });
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

  it('passes business settings through to payment summary currency', () => {
    const result = withBookingPaymentSummary(
      {
        id: 'b2',
        metadata: { pricing: { subtotal: 60, amountDue: 60 } },
        service: { price: 60, currency: null },
      },
      [],
      { currency: 'UAH' },
    );

    expect(result.paymentSummary?.currency).toBe('UAH');
  });
});
