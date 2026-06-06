import { describe, expect, it, vi } from 'vitest';

vi.mock('./booking-types', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./booking-types')>();
  return {
    ...actual,
    formatServicePrice: vi.fn((price?: number | string | null, currency = 'USD') => {
      if (currency === 'FALLBACK') return null;
      return actual.formatServicePrice(price, currency);
    }),
  };
});

import {
  formatBookingMoney,
  resolveBookingTaxDisplayLines,
} from './booking-payment-summary';

describe('booking-payment-summary tax display', () => {
  it.each([
    {
      id: 'stacked-lines',
      summary: {
        taxEnabled: true,
        taxAmount: 13,
        taxLines: [
          { id: 'gst', name: 'GST', rate: 5, amount: 5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 8 },
        ],
      },
      expected: [
        { id: 'gst', name: 'GST', rate: 5, amount: 5 },
        { id: 'pst', name: 'PST', rate: 8, amount: 8 },
      ],
    },
    {
      id: 'aggregate-fallback',
      summary: {
        taxEnabled: true,
        taxAmount: 20,
        taxName: 'VAT',
        taxRate: 20,
      },
      expected: [{ id: 'aggregate', name: 'VAT', rate: 20, amount: 20 }],
    },
    {
      id: 'empty-tax-name',
      summary: {
        taxEnabled: true,
        taxAmount: 10,
        taxName: '  ',
        taxRate: null,
      },
      expected: [{ id: 'aggregate', name: 'Tax', rate: 0, amount: 10 }],
    },
    {
      id: 'tax-disabled',
      summary: { taxEnabled: false, taxAmount: 20 },
      expected: [],
    },
    {
      id: 'zero-tax',
      summary: { taxEnabled: true, taxAmount: 0 },
      expected: [],
    },
    {
      id: 'missing-tax-enabled',
      summary: { taxAmount: 5 },
      expected: [],
    },
  ])('resolveBookingTaxDisplayLines — $id', ({ summary, expected }) => {
    expect(resolveBookingTaxDisplayLines(summary)).toEqual(expected);
  });

  it('returns empty lines when tax amount is missing', () => {
    expect(
      resolveBookingTaxDisplayLines({
        taxEnabled: true,
        taxName: 'VAT',
        taxRate: 20,
      }),
    ).toEqual([]);
  });

  it('uses aggregate line when taxLines array is empty', () => {
    expect(
      resolveBookingTaxDisplayLines({
        taxEnabled: true,
        taxAmount: 15,
        taxName: 'VAT',
        taxRate: 15,
        taxLines: [],
      }),
    ).toEqual([{ id: 'aggregate', name: 'VAT', rate: 15, amount: 15 }]);
  });

  it('prefers explicit taxLines over aggregate fields', () => {
    expect(
      resolveBookingTaxDisplayLines({
        taxEnabled: true,
        taxAmount: 13,
        taxName: 'VAT',
        taxRate: 13,
        taxLines: [{ id: 'gst', name: 'GST', rate: 5, amount: 5 }],
      }),
    ).toEqual([{ id: 'gst', name: 'GST', rate: 5, amount: 5 }]);
  });
});

describe('formatBookingMoney', () => {
  it('returns em dash for null and undefined', () => {
    expect(formatBookingMoney(null, 'USD')).toBe('—');
    expect(formatBookingMoney(undefined, 'USD')).toBe('—');
  });

  it('formats numeric amounts with currency', () => {
    expect(formatBookingMoney(120, 'USD')).toMatch(/\$|USD|120/);
  });

  it('falls back to raw amount when currency formatting is unavailable', () => {
    expect(formatBookingMoney(99, 'FALLBACK')).toBe('99 FALLBACK');
  });
});
