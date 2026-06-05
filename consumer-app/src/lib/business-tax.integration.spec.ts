import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TAX_NAME,
  formatInclusiveTaxBadge,
  formatTaxLineLabel,
  resolveCheckoutTaxDisplayLines,
  shouldShowInclusiveTaxBadge,
} from './business-tax.js';

describe('consumer business-tax integration', () => {
  it.each([
    {
      id: 'disabled',
      tax: { enabled: false, name: 'VAT', rate: 20, model: 'inclusive' as const },
      show: false,
    },
    {
      id: 'exclusive',
      tax: { enabled: true, name: 'VAT', rate: 20, model: 'exclusive' as const },
      show: false,
    },
    {
      id: 'inclusive-zero-rate',
      tax: { enabled: true, name: 'VAT', rate: 0, model: 'inclusive' as const },
      show: false,
    },
    {
      id: 'inclusive-stacked',
      tax: {
        enabled: true,
        name: 'Tax',
        rate: 0,
        model: 'inclusive' as const,
        rules: [
          { name: 'GST', rate: 5 },
          { name: 'PST', rate: 8 },
        ],
      },
      show: true,
    },
  ])('shouldShowInclusiveTaxBadge — $id', ({ tax, show }) => {
    expect(shouldShowInclusiveTaxBadge(tax)).toBe(show);
  });

  it('formats inclusive badge for single and stacked rules', () => {
    expect(
      formatInclusiveTaxBadge({ name: 'VAT', rate: 20, rules: undefined }),
    ).toBe('incl. 20% VAT');
    expect(
      formatInclusiveTaxBadge({
        name: 'Tax',
        rate: 0,
        rules: [
          { name: 'GST', rate: 5 },
          { name: 'PST', rate: 8 },
        ],
      }),
    ).toBe('incl. 13% GST + PST');
  });

  it('formats tax line labels with integer and decimal rates', () => {
    expect(formatTaxLineLabel('GST', 5)).toBe('GST (5%)');
    expect(formatTaxLineLabel('  ', 7.5)).toBe(`${DEFAULT_TAX_NAME} (7.5%)`);
  });

  it.each([
    {
      id: 'stacked',
      quote: {
        taxEnabled: true,
        taxAmount: 13,
        taxRules: [
          { id: 'gst', name: 'GST', rate: 5, amount: 5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 8 },
        ],
      },
      length: 2,
    },
    {
      id: 'single-rule-aggregate',
      quote: {
        taxEnabled: true,
        taxAmount: 5,
        taxName: 'GST',
        taxRate: 5,
        taxRules: [{ id: 'gst', name: 'GST', rate: 5, amount: 5 }],
      },
      length: 1,
      aggregate: true,
    },
    {
      id: 'no-rules-aggregate',
      quote: {
        taxEnabled: true,
        taxAmount: 20,
        taxName: 'VAT',
        taxRate: 20,
      },
      length: 1,
      aggregate: true,
    },
    {
      id: 'disabled',
      quote: { taxEnabled: false, taxAmount: 20 },
      length: 0,
    },
    {
      id: 'zero-amount',
      quote: { taxEnabled: true, taxAmount: 0 },
      length: 0,
    },
  ])('resolveCheckoutTaxDisplayLines — $id', ({ quote, length, aggregate }) => {
    const lines = resolveCheckoutTaxDisplayLines(quote);
    expect(lines).toHaveLength(length);
    if (aggregate) {
      expect(lines[0]?.id).toBe('aggregate');
    }
  });
});
