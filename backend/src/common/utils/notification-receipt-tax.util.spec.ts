import { describe, expect, it } from '@jest/globals';
import {
  buildBookingPriceLines,
  resolveEmailFooterNote,
} from './notification-currency.util.js';

describe('notification receipt tax lines', () => {
  const businessSettings = {
    currency: 'USD',
    tax: {
      enabled: true,
      name: 'VAT',
      rate: 20,
      model: 'exclusive',
      taxNumber: 'GB123456789',
    },
  };

  it('builds exclusive tax breakdown lines for confirmation emails', () => {
    const lines = buildBookingPriceLines(
      {
        service: { price: 100, currency: 'USD' },
        metadata: {
          pricing: {
            subtotal: 100,
            amountDue: 120,
            taxEnabled: true,
            taxName: 'VAT',
            taxRate: 20,
            taxModel: 'exclusive',
            taxAmount: 20,
            netAmount: 100,
          },
        },
      },
      businessSettings,
      'en',
    );

    expect(lines.priceLineText).toContain('Subtotal:');
    expect(lines.priceLineText).toContain('VAT (20%): +');
    expect(lines.priceLineText).toContain('Total:');
    expect(lines.taxRegistrationFooter).toBe('Tax registration: GB123456789');
  });

  it('builds stacked tax lines and inclusive suffix', () => {
    const lines = buildBookingPriceLines(
      {
        service: { price: 100, currency: 'USD' },
        metadata: {
          pricing: {
            subtotal: 100,
            amountDue: 113,
            taxEnabled: true,
            taxModel: 'exclusive',
            taxAmount: 13,
            taxRules: [
              { id: 'gst', name: 'GST', rate: 5, amount: 5 },
              { id: 'pst', name: 'PST', rate: 8, amount: 8 },
            ],
          },
        },
      },
      businessSettings,
      'en',
    );

    expect(lines.priceLineText).toContain('GST (5%)');
    expect(lines.priceLineText).toContain('PST (8%)');
  });

  it('appends tax registration footer to base footer note', () => {
    expect(
      resolveEmailFooterNote('en', 'See you soon!', 'Tax registration: GB123'),
    ).toBe('See you soon!\n\nTax registration: GB123');
    expect(resolveEmailFooterNote('en', 'See you soon!')).toBe('See you soon!');
  });

  it.each([
    {
      id: 'inclusive-single',
      pricing: {
        subtotal: 95.24,
        amountDue: 100,
        taxEnabled: true,
        taxModel: 'inclusive',
        taxName: 'VAT',
        taxRate: 5,
        taxAmount: 4.76,
        netAmount: 95.24,
      },
      expectInclusive: true,
      expectPlus: false,
    },
    {
      id: 'exclusive-without-subtotal',
      pricing: {
        amountDue: 120,
        taxEnabled: true,
        taxModel: 'exclusive',
        taxName: 'VAT',
        taxRate: 20,
        taxAmount: 20,
      },
      expectInclusive: false,
      expectPlus: true,
    },
  ])('builds $id receipt lines', ({ pricing, expectInclusive, expectPlus }) => {
    const lines = buildBookingPriceLines(
      {
        service: { price: 100, currency: 'USD' },
        metadata: { pricing },
      },
      businessSettings,
      'en',
    );
    expect(lines.priceLineText).toContain('Total:');
    if (expectInclusive) {
      expect(lines.priceLineText).toContain('included');
    }
    if (expectPlus) {
      expect(lines.priceLineText).toContain('+');
    }
  });

  it('omits tax registration footer when business has no tax number', () => {
    const lines = buildBookingPriceLines(
      {
        service: { price: 100, currency: 'USD' },
        metadata: {
          pricing: {
            subtotal: 100,
            amountDue: 120,
            taxEnabled: true,
            taxAmount: 20,
            taxName: 'VAT',
            taxRate: 20,
            taxModel: 'exclusive',
          },
        },
      },
      {
        currency: 'USD',
        tax: { enabled: true, name: 'VAT', rate: 20, model: 'exclusive' },
      },
      'en',
    );
    expect(lines.taxRegistrationFooter).toBeUndefined();
  });

  it('formats decimal tax rates in receipt lines', () => {
    const lines = buildBookingPriceLines(
      {
        service: { price: 100, currency: 'USD' },
        metadata: {
          pricing: {
            subtotal: 100,
            amountDue: 107.5,
            taxEnabled: true,
            taxModel: 'exclusive',
            taxAmount: 7.5,
            taxName: 'GST',
            taxRate: 7.5,
          },
        },
      },
      businessSettings,
      'en',
    );
    expect(lines.priceLineText).toContain('GST (7.5%)');
  });

  it('builds tax receipt without subtotal when only net amount is stored', () => {
    const lines = buildBookingPriceLines(
      {
        service: { price: 100, currency: 'USD' },
        metadata: {
          pricing: {
            netAmount: 100,
            amountDue: 120,
            taxEnabled: true,
            taxModel: 'exclusive',
            taxAmount: 20,
            taxName: 'VAT',
            taxRate: 20,
          },
        },
      },
      businessSettings,
      'en',
    );
    expect(lines.priceLineText).toContain('Subtotal:');
    expect(lines.priceLineText).not.toContain('netAmount');
  });

  it('falls back to amountPaid for total when amountDue is absent', () => {
    const lines = buildBookingPriceLines(
      {
        service: { price: 100, currency: 'USD' },
        metadata: {
          amountPaid: 120,
          pricing: {
            taxEnabled: true,
            taxModel: 'exclusive',
            taxAmount: 20,
            taxName: 'VAT',
            taxRate: 20,
          },
        },
      },
      businessSettings,
      'en',
    );
    expect(lines.priceLineText).toContain('Total:');
    expect(lines.priceLineText).toMatch(/120/);
  });

  it('builds localized Armenian receipt tax lines', () => {
    const lines = buildBookingPriceLines(
      {
        service: { price: 100, currency: 'AMD' },
        metadata: {
          pricing: {
            subtotal: 100,
            amountDue: 120,
            taxEnabled: true,
            taxAmount: 20,
            taxName: 'VAT',
            taxRate: 20,
            taxModel: 'exclusive',
          },
        },
      },
      {
        currency: 'AMD',
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'exclusive',
          taxNumber: 'AM-1',
        },
      },
      'hy',
    );
    expect(lines.priceLineText).toContain('Ընդամենը');
    expect(lines.taxRegistrationFooter).toContain('AM-1');
  });
});
