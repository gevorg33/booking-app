import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TAX_NAME,
  formatInclusiveTaxBadge,
  formatTaxLineLabel,
  resolveCheckoutTaxDisplayLines,
  shouldShowInclusiveTaxBadge,
} from './business-tax.js';

describe('consumer business-tax', () => {
  it('shows inclusive badge when tax model is inclusive', () => {
    expect(
      shouldShowInclusiveTaxBadge({
        enabled: true,
        name: 'VAT',
        rate: 20,
        model: 'inclusive',
      }),
    ).toBe(true);
    expect(
      formatInclusiveTaxBadge({
        enabled: true,
        name: 'VAT',
        rate: 20,
        model: 'inclusive',
      }),
    ).toBe('incl. 20% VAT');
  });

  it('hides inclusive badge for exclusive or disabled tax', () => {
    expect(
      shouldShowInclusiveTaxBadge({
        enabled: true,
        name: 'VAT',
        rate: 20,
        model: 'exclusive',
      }),
    ).toBe(false);
    expect(shouldShowInclusiveTaxBadge(null)).toBe(false);
  });

  it('resolves stacked checkout tax display lines', () => {
    expect(
      resolveCheckoutTaxDisplayLines({
        taxEnabled: true,
        taxAmount: 13,
        taxRules: [
          { id: 'gst', name: 'GST', rate: 5, amount: 5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 8 },
        ],
      }),
    ).toHaveLength(2);
  });

  it('falls back to aggregate line for single-rule quotes', () => {
    expect(
      resolveCheckoutTaxDisplayLines({
        taxEnabled: true,
        taxAmount: 20,
        taxName: 'VAT',
        taxRate: 20,
        taxRules: [{ id: 'vat', name: 'VAT', rate: 20, amount: 20 }],
      }),
    ).toEqual([{ id: 'aggregate', name: 'VAT', rate: 20, amount: 20 }]);
  });

  it('formats tax line labels with default name', () => {
    expect(formatTaxLineLabel('GST', 5)).toBe('GST (5%)');
    expect(formatTaxLineLabel('  ', 10)).toBe(`${DEFAULT_TAX_NAME} (10%)`);
  });

  it('formats stacked inclusive badge labels', () => {
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

  it('falls back to default tax name when rule names are blank', () => {
    expect(
      formatInclusiveTaxBadge({
        name: '  ',
        rate: 5.5,
        rules: [{ name: '  ', rate: 5.5 }],
      }),
    ).toBe(`incl. 5.5% ${DEFAULT_TAX_NAME}`);
  });

  it('treats missing tax amount as zero', () => {
    expect(
      resolveCheckoutTaxDisplayLines({
        taxEnabled: true,
        taxName: 'VAT',
        taxRate: 20,
      }),
    ).toEqual([]);
  });

  it('resolves aggregate lines with missing tax name and rate', () => {
    expect(
      resolveCheckoutTaxDisplayLines({
        taxEnabled: true,
        taxAmount: 12,
        taxName: '  ',
        taxRate: null,
      }),
    ).toEqual([{ id: 'aggregate', name: DEFAULT_TAX_NAME, rate: 0, amount: 12 }]);
  });
});
