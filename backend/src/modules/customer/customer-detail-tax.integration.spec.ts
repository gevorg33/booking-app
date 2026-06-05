import { readBookingListAmounts } from '../booking/booking-payment-summary.util.js';

describe('Sprint 36 — customer detail tax amounts', () => {
  it.each([
    {
      id: 'exclusive-tax',
      metadata: {
        pricing: {
          amountDue: 120,
          taxEnabled: true,
          taxAmount: 20,
          taxModel: 'exclusive',
        },
        amountPaid: 120,
      },
      expected: { amountPaid: 120, taxAmount: 20 },
    },
    {
      id: 'inclusive-tax',
      metadata: {
        pricing: {
          amountDue: 100,
          taxEnabled: true,
          taxAmount: 4.76,
          taxModel: 'inclusive',
        },
      },
      expected: { amountPaid: 100, taxAmount: 4.76 },
    },
    {
      id: 'stacked-tax',
      metadata: {
        pricing: {
          amountDue: 113,
          taxAmount: 13,
          taxRules: [
            { id: 'gst', name: 'GST', rate: 5, amount: 5 },
            { id: 'pst', name: 'PST', rate: 8, amount: 8 },
          ],
        },
      },
      expected: { amountPaid: 113, taxAmount: 13 },
    },
    {
      id: 'legacy-no-pricing',
      metadata: { amountPaid: 80 },
      expected: { amountPaid: 80, taxAmount: null },
    },
  ])('maps appointment amounts for $id', ({ metadata, expected }) => {
    expect(readBookingListAmounts(metadata)).toEqual(expected);
  });
});
