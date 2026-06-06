import { describe, expect, it } from 'vitest';
import {
  formatInclusiveTaxBadge,
  formatTaxLineLabel,
  readBusinessTaxSettings,
  resolveCheckoutTaxDisplayLines,
  shouldShowInclusiveTaxBadge,
} from './business-tax';
import type { PublicBusinessProfile } from './public-api';

const tenant = (
  tax?: PublicBusinessProfile['tax'],
): Pick<PublicBusinessProfile, 'tax'> => ({ tax });

function publicTaxFromSettings(settings: Record<string, unknown>) {
  const persisted = readBusinessTaxSettings(settings);
  if (!persisted.enabled || persisted.rate <= 0) return undefined;
  const stacked = persisted.rules ?? [];
  return {
    enabled: true,
    name:
      stacked.length > 0
        ? stacked.map((rule) => rule.name).join(' + ')
        : persisted.name,
    rate: persisted.rate,
    model: persisted.model,
    ...(stacked.length > 0
      ? { rules: stacked.map(({ name, rate }) => ({ name, rate })) }
      : {}),
  };
}

describe('Sprint 36 — business tax scenario matrix', () => {
  it.each([
    {
      id: 'exclusive-checkout',
      settings: {
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'exclusive',
          taxNumber: 'AM-1',
        },
      },
      badge: false,
      taxLine: 'VAT (20%)',
      quote: {
        subtotal: 100,
        taxAmount: 20,
        amountDue: 120,
        taxModel: 'exclusive' as const,
      },
    },
    {
      id: 'inclusive-checkout',
      settings: {
        tax: {
          enabled: true,
          name: 'GST',
          rate: 5,
          model: 'inclusive',
          taxNumber: '',
        },
      },
      badge: true,
      badgeText: 'incl. 5% GST',
      taxLine: 'GST (5%)',
      quote: {
        subtotal: 105,
        taxAmount: 5,
        amountDue: 105,
        taxModel: 'inclusive' as const,
      },
    },
    {
      id: 'exclusive-after-promo',
      settings: {
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'exclusive',
          taxNumber: '',
        },
      },
      badge: false,
      taxLine: 'VAT (20%)',
      quote: {
        subtotal: 80,
        taxAmount: 16,
        amountDue: 96,
        taxModel: 'exclusive' as const,
      },
    },
    {
      id: 'service-tax-exempt',
      settings: {
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'exclusive',
          taxNumber: '',
        },
      },
      badge: false,
      taxLine: 'VAT (20%)',
      quote: {
        subtotal: 100,
        taxAmount: 0,
        amountDue: 100,
        taxModel: 'exclusive' as const,
        serviceExempt: true,
      },
    },
    {
      id: 'inclusive-decimal-rate',
      settings: {
        tax: {
          enabled: true,
          name: 'Sales Tax',
          rate: 7.5,
          model: 'inclusive',
          taxNumber: '',
        },
      },
      badge: true,
      badgeText: 'incl. 7.5% Sales Tax',
      taxLine: 'Sales Tax (7.5%)',
      quote: {
        subtotal: 107.5,
        taxAmount: 7.5,
        amountDue: 107.5,
        taxModel: 'inclusive' as const,
      },
    },
    {
      id: 'disabled-tax',
      settings: {
        tax: {
          enabled: false,
          rate: 20,
          model: 'exclusive',
          name: 'VAT',
          taxNumber: '',
        },
      },
      badge: false,
      taxLine: 'VAT (20%)',
      quote: {
        subtotal: 100,
        taxAmount: 0,
        amountDue: 100,
        taxModel: 'exclusive' as const,
      },
    },
    {
      id: 'invalid-settings-fallback',
      settings: {
        tax: { enabled: 'yes', name: '  ', rate: 'bad', model: 'nope' },
      },
      badge: false,
      quote: {
        subtotal: 100,
        taxAmount: 0,
        amountDue: 100,
        taxModel: 'exclusive' as const,
      },
    },
    {
      id: 'stacked-exclusive-checkout',
      settings: {
        tax: {
          enabled: true,
          name: 'Tax',
          rate: 13,
          model: 'exclusive',
          rules: [
            { id: 'gst', name: 'GST', rate: 5 },
            { id: 'pst', name: 'PST', rate: 8 },
          ],
        },
      },
      badge: false,
      taxLine: 'Tax (13%)',
      quote: {
        subtotal: 100,
        taxAmount: 13,
        amountDue: 113,
        taxModel: 'exclusive' as const,
      },
    },
    {
      id: 'stacked-inclusive-checkout',
      settings: {
        tax: {
          enabled: true,
          name: 'Tax',
          rate: 13,
          model: 'inclusive',
          rules: [
            { id: 'gst', name: 'GST', rate: 5 },
            { id: 'pst', name: 'PST', rate: 8 },
          ],
        },
      },
      badge: true,
      badgeText: 'incl. 13% GST + PST',
      taxLine: 'Tax (13%)',
      quote: {
        subtotal: 113,
        taxAmount: 13,
        amountDue: 113,
        taxModel: 'inclusive' as const,
      },
    },
    {
      id: 'stacked-exclusive-after-promo',
      settings: {
        tax: {
          enabled: true,
          name: 'Tax',
          rate: 13,
          model: 'exclusive',
          rules: [
            { id: 'gst', name: 'GST', rate: 5 },
            { id: 'pst', name: 'PST', rate: 8 },
          ],
        },
      },
      badge: false,
      taxLine: 'Tax (13%)',
      quote: {
        subtotal: 80,
        taxAmount: 10.4,
        amountDue: 90.4,
        taxModel: 'exclusive' as const,
      },
    },
    {
      id: 'stacked-service-exempt',
      settings: {
        tax: {
          enabled: true,
          name: 'Tax',
          rate: 13,
          model: 'exclusive',
          rules: [
            { id: 'gst', name: 'GST', rate: 5 },
            { id: 'pst', name: 'PST', rate: 8 },
          ],
        },
      },
      badge: false,
      taxLine: 'Tax (13%)',
      quote: {
        subtotal: 100,
        taxAmount: 0,
        amountDue: 100,
        taxModel: 'exclusive' as const,
        serviceExempt: true,
      },
    },
  ])(
    'public booking tax display for $id',
    ({ settings, badge, badgeText, taxLine, quote }) => {
      const persisted = readBusinessTaxSettings(settings);
      const profile = tenant(publicTaxFromSettings(settings));

      expect(shouldShowInclusiveTaxBadge(profile.tax)).toBe(badge);
      if (badgeText) {
        expect(formatInclusiveTaxBadge(profile.tax!)).toBe(badgeText);
      }

      if (quote.taxAmount > 0 && !quote.serviceExempt) {
        expect(formatTaxLineLabel(persisted.name, persisted.rate)).toBe(
          taxLine,
        );
      }

      if (quote.taxModel === 'exclusive' && quote.taxAmount > 0) {
        expect(quote.amountDue).toBe(quote.subtotal + quote.taxAmount);
      } else if (quote.taxModel === 'inclusive' && quote.taxAmount > 0) {
        expect(quote.amountDue).toBe(quote.subtotal);
      } else {
        expect(quote.amountDue).toBe(quote.subtotal);
        expect(quote.taxAmount).toBe(0);
      }
    },
  );

  it('service list hides inclusive badge when tenant tax is absent', () => {
    expect(shouldShowInclusiveTaxBadge(tenant().tax)).toBe(false);
  });

  it('renders per-rule checkout tax lines for stacked quotes', () => {
    const lines = resolveCheckoutTaxDisplayLines({
      taxEnabled: true,
      taxAmount: 13,
      taxName: 'GST + PST',
      taxRate: 13,
      taxModel: 'exclusive',
      taxRules: [
        { id: 'gst', name: 'GST', rate: 5, amount: 5 },
        { id: 'pst', name: 'PST', rate: 8, amount: 8 },
      ],
    });

    expect(lines).toHaveLength(2);
    expect(formatTaxLineLabel(lines[0]!.name, lines[0]!.rate)).toBe('GST (5%)');
    expect(formatTaxLineLabel(lines[1]!.name, lines[1]!.rate)).toBe('PST (8%)');
    expect(lines.reduce((sum, line) => sum + line.amount, 0)).toBe(13);
  });

  it('exclusive model never shows inclusive badge even when tax is enabled', () => {
    const profile = tenant({
      enabled: true,
      name: 'VAT',
      rate: 20,
      model: 'exclusive',
    });
    expect(shouldShowInclusiveTaxBadge(profile.tax)).toBe(false);
  });
});
