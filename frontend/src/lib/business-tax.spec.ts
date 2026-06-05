import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BUSINESS_TAX_SETTINGS,
  DEFAULT_TAX_NAME,
  TAX_PRICING_MODELS,
  createEmptyTaxRule,
  businessTaxIsActive,
  formatAggregateTaxName,
  formatInclusiveTaxBadge,
  formatTaxLineLabel,
  getEffectiveTaxRate,
  hasStackedTaxRules,
  normalizeTaxPricingModel,
  normalizeTaxRatePercent,
  normalizeTaxRule,
  normalizeTaxRules,
  readBusinessTaxSettings,
  resolveCheckoutTaxDisplayLines,
  shouldShowInclusiveTaxBadge,
  sumTaxRuleRates,
} from './business-tax';

describe('business-tax', () => {
  it('exports supported tax pricing models', () => {
    expect(TAX_PRICING_MODELS).toEqual(['inclusive', 'exclusive']);
  });

  it.each([
    ['inclusive', 'inclusive'],
    [' EXCLUSIVE ', 'exclusive'],
    ['bad', null],
    [null, null],
    [undefined, null],
  ])('normalizeTaxPricingModel(%s) -> %s', (input, expected) => {
    expect(normalizeTaxPricingModel(input)).toBe(expected);
  });

  it('rejects non-string tax model values', () => {
    expect(normalizeTaxPricingModel(42 as never)).toBeNull();
  });

  it.each([
    [20, 20],
    [' 7.5 ', 7.5],
    [0, 0],
    [100, 100],
    [-1, null],
    [101, null],
    ['bad', null],
    [null, null],
    ['', null],
  ])('normalizeTaxRatePercent(%s) -> %s', (input, expected) => {
    expect(normalizeTaxRatePercent(input)).toBe(expected);
  });

  it('reads business tax settings with defaults', () => {
    expect(readBusinessTaxSettings(null)).toEqual(DEFAULT_BUSINESS_TAX_SETTINGS);
    expect(readBusinessTaxSettings({})).toEqual(DEFAULT_BUSINESS_TAX_SETTINGS);
    expect(
      readBusinessTaxSettings({
        tax: {
          enabled: true,
          name: 'GST',
          rate: 10,
          model: 'inclusive',
          taxNumber: 'REG-1',
        },
      }),
    ).toEqual({
      enabled: true,
      name: 'GST',
      rate: 10,
      model: 'inclusive',
      taxNumber: 'REG-1',
    });
    expect(
      readBusinessTaxSettings({
        tax: { enabled: 'yes', name: '  ', rate: 'bad', model: 'nope' },
      }),
    ).toEqual({
      enabled: false,
      name: DEFAULT_TAX_NAME,
      rate: 0,
      model: 'exclusive',
      taxNumber: '',
    });
    expect(
      readBusinessTaxSettings({
        tax: {
          enabled: true,
          name: 'Tax',
          rate: 13,
          model: 'exclusive',
          rules: [{ id: 'gst', name: 'GST', rate: 5 }],
        },
      }),
    ).toMatchObject({
      rules: [{ id: 'gst', name: 'GST', rate: 5 }],
    });
  });

  it('formats inclusive tax badge and checkout tax line label', () => {
    expect(formatInclusiveTaxBadge({ name: ' VAT ', rate: 20 })).toBe(
      'incl. 20% VAT',
    );
    expect(formatInclusiveTaxBadge({ name: '  ', rate: 7.5 })).toBe(
      'incl. 7.5% VAT',
    );
    expect(formatTaxLineLabel('GST', 5)).toBe('GST (5%)');
    expect(formatTaxLineLabel('  ', 7.25)).toBe('VAT (7.3%)');
    expect(formatTaxLineLabel('Sales Tax', 20)).toBe('Sales Tax (20%)');
  });

  it('supports stacked tax rule helpers', () => {
    const gst = { id: 'gst', name: 'GST', rate: 5 };
    const pst = { id: 'pst', name: 'PST', rate: 8 };
    expect(normalizeTaxRule({ name: 'GST', rate: 5 })).toEqual({
      id: 'rule-1',
      name: 'GST',
      rate: 5,
    });
    expect(normalizeTaxRule({ id: 'custom', rate: 5 })).toEqual({
      id: 'custom',
      name: DEFAULT_TAX_NAME,
      rate: 5,
    });
    expect(normalizeTaxRule(null)).toBeNull();
    expect(normalizeTaxRules([gst, { rate: 0 }])).toEqual([gst]);
    expect(sumTaxRuleRates([gst, pst])).toBe(13);
    expect(formatAggregateTaxName([gst, pst])).toBe('GST + PST');
    expect(formatAggregateTaxName([])).toBe(DEFAULT_TAX_NAME);
    expect(getEffectiveTaxRate({ rate: 0, rules: [gst, pst] })).toBe(13);
    expect(createEmptyTaxRule(1).name).toBe('State');
    expect(createEmptyTaxRule(2).name).toBe('Tax 3');
    expect(hasStackedTaxRules({})).toBe(false);
    expect(
      formatInclusiveTaxBadge({
        name: 'Tax',
        rate: 13,
        rules: [
          { name: 'GST', rate: 5 },
          { name: 'PST', rate: 8 },
        ],
      }),
    ).toBe('incl. 13% GST + PST');
    expect(
      resolveCheckoutTaxDisplayLines({
        taxEnabled: true,
        taxAmount: 13,
        taxName: 'GST + PST',
        taxRate: 13,
        taxRules: [
          { id: 'gst', name: 'GST', rate: 5, amount: 5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 8 },
        ],
      }),
    ).toHaveLength(2);
    expect(
      resolveCheckoutTaxDisplayLines({
        taxEnabled: true,
        taxAmount: 20,
        taxName: 'VAT',
        taxRate: 20,
      }),
    ).toEqual([{ id: 'aggregate', name: 'VAT', rate: 20, amount: 20 }]);
    expect(resolveCheckoutTaxDisplayLines({ taxEnabled: false })).toEqual([]);
    expect(
      resolveCheckoutTaxDisplayLines({ taxEnabled: true, taxAmount: 0 }),
    ).toEqual([]);
    expect(
      resolveCheckoutTaxDisplayLines({
        taxEnabled: true,
        taxAmount: 10,
        taxName: '  ',
        taxRate: null,
      }),
    ).toEqual([{ id: 'aggregate', name: DEFAULT_TAX_NAME, rate: 0, amount: 10 }]);
    expect(
      resolveCheckoutTaxDisplayLines({
        taxEnabled: true,
        taxAmount: 5,
        taxName: 'GST',
        taxRate: 5,
        taxRules: [{ id: 'gst', name: 'GST', rate: 5, amount: 5 }],
      }),
    ).toEqual([{ id: 'aggregate', name: 'GST', rate: 5, amount: 5 }]);
    expect(
      resolveCheckoutTaxDisplayLines({
        taxEnabled: true,
        taxAmount: 12,
        taxName: 'VAT',
        taxRate: 12,
        taxRules: undefined,
      }),
    ).toEqual([{ id: 'aggregate', name: 'VAT', rate: 12, amount: 12 }]);
    expect(createEmptyTaxRule(0).name).toBe('Federal');
    expect(
      hasStackedTaxRules({
        rules: [{ id: 'gst', name: 'GST', rate: 5 }],
      }),
    ).toBe(true);
    expect(
      businessTaxIsActive({
        enabled: true,
        name: 'Tax',
        rate: 13,
        model: 'exclusive',
        taxNumber: '',
        rules: [
          { id: 'gst', name: 'GST', rate: 5 },
          { id: 'pst', name: 'PST', rate: 8 },
        ],
      }),
    ).toBe(true);
    expect(
      shouldShowInclusiveTaxBadge({
        enabled: true,
        name: 'Tax',
        rate: 13,
        model: 'inclusive',
        rules: [
          { name: 'GST', rate: 5 },
          { name: 'PST', rate: 8 },
        ],
      }),
    ).toBe(true);
  });

  it.each([
    {
      tax: undefined,
      badge: false,
    },
    {
      tax: {
        enabled: true,
        name: 'VAT',
        rate: 20,
        model: 'exclusive' as const,
      },
      badge: false,
    },
    {
      tax: {
        enabled: false,
        name: 'VAT',
        rate: 20,
        model: 'inclusive' as const,
      },
      badge: false,
    },
    {
      tax: {
        enabled: true,
        name: 'VAT',
        rate: 20,
        model: 'inclusive' as const,
      },
      badge: true,
    },
    {
      tax: {
        enabled: true,
        name: 'VAT',
        rate: 0,
        model: 'inclusive' as const,
      },
      badge: false,
    },
  ])('shouldShowInclusiveTaxBadge for $tax -> $badge', ({ tax, badge }) => {
    expect(shouldShowInclusiveTaxBadge(tax)).toBe(badge);
  });
});
