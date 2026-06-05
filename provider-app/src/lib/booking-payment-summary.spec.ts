import { describe, expect, it } from 'vitest';
import {
  formatBookingMoney,
  formatTaxLineLabel,
  resolveBookingTaxDisplayLines,
} from './booking-payment-summary';

describe('resolveBookingTaxDisplayLines (provider app)', () => {
  it.each([
    {
      id: 'stacked',
      summary: {
        taxEnabled: true,
        taxAmount: 13,
        taxLines: [
          { id: 'gst', name: 'GST', rate: 5, amount: 5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 8 },
        ],
      },
      expectedLength: 2,
    },
    {
      id: 'aggregate',
      summary: {
        taxEnabled: true,
        taxAmount: 20,
        taxName: 'VAT',
        taxRate: 20,
      },
      expectedLength: 1,
      name: 'VAT',
    },
    {
      id: 'disabled',
      summary: { taxEnabled: false, taxAmount: 20 },
      expectedLength: 0,
    },
    {
      id: 'zero',
      summary: { taxEnabled: true, taxAmount: 0 },
      expectedLength: 0,
    },
  ])('$id tax lines', ({ summary, expectedLength, name }) => {
    const lines = resolveBookingTaxDisplayLines(summary);
    expect(lines).toHaveLength(expectedLength);
    if (name) expect(lines[0]?.name).toBe(name);
  });

  it('falls back to Tax label when tax name is blank', () => {
    expect(
      resolveBookingTaxDisplayLines({
        taxEnabled: true,
        taxAmount: 10,
        taxName: '  ',
        taxRate: 10,
      }),
    ).toEqual([{ id: 'aggregate', name: 'Tax', rate: 10, amount: 10 }]);
  });

  it('defaults tax rate to zero when absent', () => {
    expect(
      resolveBookingTaxDisplayLines({
        taxEnabled: true,
        taxAmount: 10,
        taxName: 'GST',
        taxRate: null,
      }),
    ).toEqual([{ id: 'aggregate', name: 'GST', rate: 0, amount: 10 }]);
  });
});

describe('formatTaxLineLabel (provider app)', () => {
  it('formats integer and decimal rates', () => {
    expect(formatTaxLineLabel('GST', 5)).toBe('GST (5%)');
    expect(formatTaxLineLabel('  ', 7.5)).toBe('Tax (7.5%)');
  });
});

describe('formatBookingMoney (provider app)', () => {
  it('returns em dash for null and undefined amounts', () => {
    expect(formatBookingMoney(null, 'USD')).toBe('—');
    expect(formatBookingMoney(undefined, 'USD')).toBe('—');
  });

  it('formats with summary currency when present', () => {
    expect(formatBookingMoney(25, 'EUR')).toMatch(/€|EUR/);
  });

  it('falls back to business currency when summary currency is empty', () => {
    expect(formatBookingMoney(25, '', 'AMD')).toMatch(/֏|AMD/);
  });

  it('delegates to formatProviderMoney with business fallback', () => {
    expect(formatBookingMoney(10, null as unknown as string, 'GBP')).toMatch(/£|GBP/);
  });
});
