import { resolveBookingPaymentSummary } from '../booking/booking-payment-summary.util.js';

describe('Sprint 28 — provider-mobile payment summary currency', () => {
  const retailLines = [
    { productName: 'Shampoo', quantity: 2, unitPrice: 18, lineTotal: 36 },
  ];

  it.each([
    {
      id: 'missing-service-amd-business',
      serviceCurrency: null,
      businessSettings: { currency: 'AMD' },
      expected: 'AMD',
    },
    {
      id: 'legacy-usd-on-eur-business',
      serviceCurrency: 'USD',
      businessSettings: { currency: 'EUR' },
      expected: 'USD',
    },
    {
      id: 'invalid-service-fallback-rub',
      serviceCurrency: 'NOTREAL',
      businessSettings: { currency: 'RUB' },
      expected: 'RUB',
    },
    {
      id: 'default-usd-without-settings',
      serviceCurrency: null,
      businessSettings: undefined,
      expected: 'USD',
    },
  ])(
    'resolves paymentSummary.currency for $id',
    ({ serviceCurrency, businessSettings, expected }) => {
      const summary = resolveBookingPaymentSummary(
        {
          metadata: { pricing: { subtotal: 80, amountDue: 64 } },
          service: { price: 80, currency: serviceCurrency },
        },
        retailLines,
        businessSettings,
      );

      expect(summary?.currency).toBe(expected);
      expect(summary?.retailTotal).toBe(36);
      expect(summary?.grandTotal).toBe(100);
      expect(summary?.cashPaid).toBe(64);
    },
  );

  it('returns POS retail lines in provider appointment detail payload shape', () => {
    const summary = resolveBookingPaymentSummary(
      {
        metadata: { pricing: { subtotal: 80, amountDue: 80 } },
        service: { price: 80, currency: null },
      },
      retailLines,
      { currency: 'GEL' },
    );

    expect(summary).toMatchObject({
      currency: 'GEL',
      retailTotal: 36,
      grandTotal: 116,
      cashPaid: 80,
    });
    expect(summary?.retailLines).toEqual(retailLines);
  });
});
