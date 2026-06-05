import { describe, expect, it } from '@jest/globals';
import {
  readBookingReceiptTaxSnapshot,
  resolveBookingAccountingTaxFields,
  resolveBookingNetRevenue,
  resolveBookingPaidGrossAmount,
  resolveBookingTaxCollected,
  sumBookingTaxRevenue,
} from './booking-receipt-tax.util.js';

describe('booking-receipt-tax.util', () => {
  const taxedBooking = {
    service: { price: 100 },
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
  };

  it('reads stacked tax lines from booking metadata', () => {
    const snapshot = readBookingReceiptTaxSnapshot({
      metadata: {
        pricing: {
          taxEnabled: true,
          taxAmount: 13,
          subtotal: 100,
          amountDue: 113,
          taxRules: [
            { id: 'gst', name: 'GST', rate: 5, amount: 5 },
            { id: 'pst', name: 'PST', rate: 8, amount: 8 },
          ],
        },
      },
    });

    expect(snapshot?.taxLines).toHaveLength(2);
    expect(snapshot?.grossAmount).toBe(113);
  });

  it('returns null when tax is disabled or zero', () => {
    expect(
      readBookingReceiptTaxSnapshot({
        metadata: { pricing: { taxEnabled: false, taxAmount: 20 } },
      }),
    ).toBeNull();
    expect(
      readBookingReceiptTaxSnapshot({
        metadata: { pricing: { taxEnabled: true, taxAmount: 0 } },
      }),
    ).toBeNull();
  });

  it('resolves gross, tax, and net revenue from metadata', () => {
    expect(resolveBookingPaidGrossAmount(taxedBooking)).toBe(120);
    expect(resolveBookingTaxCollected(taxedBooking)).toBe(20);
    expect(
      sumBookingTaxRevenue([
        taxedBooking,
        { service: { price: 50 }, metadata: { amountPaid: 50 } },
      ]),
    ).toEqual({
      grossRevenue: 170,
      taxCollected: 20,
      netRevenue: 150,
    });
  });

  it('maps accounting export tax columns from booking metadata', () => {
    expect(resolveBookingAccountingTaxFields(taxedBooking)).toEqual({
      subtotal: 100,
      taxRate: 20,
      taxAmount: 20,
      taxName: 'VAT',
      total: 120,
      amount: 120,
    });
  });

  it('falls back to service price when pricing metadata is absent', () => {
    expect(
      resolveBookingAccountingTaxFields({
        service: { price: 80 },
        metadata: {},
      }),
    ).toEqual({
      subtotal: 80,
      taxRate: null,
      taxAmount: 0,
      taxName: null,
      total: 80,
      amount: 80,
    });
  });

  it('returns zero accounting amounts when service and metadata are empty', () => {
    expect(resolveBookingAccountingTaxFields({ metadata: {} })).toEqual({
      subtotal: 0,
      taxRate: null,
      taxAmount: 0,
      taxName: null,
      total: 0,
      amount: 0,
    });
  });

  it('reads inclusive tax snapshot and resolves net revenue fallback', () => {
    const snapshot = readBookingReceiptTaxSnapshot({
      metadata: {
        pricing: {
          taxEnabled: true,
          taxAmount: 4.76,
          amountDue: 100,
          taxModel: 'inclusive',
          taxName: 'VAT',
          taxRate: 5,
        },
      },
    });
    expect(snapshot?.taxModel).toBe('inclusive');
    expect(
      resolveBookingNetRevenue({
        service: { price: 100 },
        metadata: { amountPaid: 100 },
      }),
    ).toBe(100);
  });

  it('skips invalid stacked rules and uses aggregate fallback', () => {
    expect(
      readBookingReceiptTaxSnapshot({
        metadata: {
          pricing: {
            taxEnabled: true,
            taxAmount: 13,
            taxName: 'Tax',
            taxRate: 13,
            taxRules: [null, { amount: 0 }],
          },
        },
      })?.taxLines,
    ).toEqual([{ id: 'aggregate', name: 'Tax', rate: 13, amount: 13 }]);
  });

  it('uses amountPaid and prepayment fallbacks for gross amount', () => {
    expect(
      resolveBookingPaidGrossAmount({
        service: { price: 50 },
        metadata: { prepaymentAmount: 75 },
      }),
    ).toBe(75);
  });

  it('normalizes partial stacked rule rows and blank aggregate tax names', () => {
    expect(
      readBookingReceiptTaxSnapshot({
        metadata: {
          pricing: {
            taxEnabled: true,
            taxAmount: 13,
            taxRules: [
              null,
              { amount: 5 },
              { id: '  pst  ', name: '  ', amount: 8, rate: 8 },
            ],
          },
        },
      })?.taxLines,
    ).toEqual([
      { id: 'rule-2', name: 'VAT', rate: 0, amount: 5 },
      { id: 'pst', name: 'VAT', rate: 8, amount: 8 },
    ]);

    expect(
      readBookingReceiptTaxSnapshot({
        metadata: {
          pricing: {
            taxEnabled: true,
            taxAmount: 10,
            taxName: '  ',
            taxRate: null,
          },
        },
      })?.taxLines,
    ).toEqual([{ id: 'aggregate', name: 'VAT', rate: 0, amount: 10 }]);
  });

  it('computes accounting fields from gross minus tax when subtotal is absent', () => {
    expect(
      resolveBookingAccountingTaxFields({
        service: { price: 100 },
        metadata: {
          pricing: {
            amountDue: 120,
            taxEnabled: true,
            taxName: 'VAT',
            taxRate: 20,
            taxAmount: 20,
          },
        },
      }),
    ).toMatchObject({
      subtotal: 100,
      taxAmount: 20,
      total: 120,
    });
  });

  it('returns null snapshot for invalid pricing payloads', () => {
    expect(
      readBookingReceiptTaxSnapshot({ metadata: { pricing: 'bad' } }),
    ).toBeNull();
    expect(readBookingReceiptTaxSnapshot({ metadata: null })).toBeNull();
  });

  it('returns zero gross when no amounts or service price exist', () => {
    expect(resolveBookingPaidGrossAmount({})).toBe(0);
    expect(resolveBookingPaidGrossAmount({ service: { price: 'bad' } })).toBe(
      0,
    );
  });

  it('returns zero tax when tax flag is disabled', () => {
    expect(
      resolveBookingTaxCollected({
        metadata: { pricing: { taxEnabled: false, taxAmount: 20 } },
      }),
    ).toBe(0);
  });

  it('prefers netAmount and subtotal for net revenue and accounting', () => {
    expect(
      resolveBookingNetRevenue({
        metadata: { pricing: { netAmount: 95.24, subtotal: 90 } },
        service: { price: 100 },
      }),
    ).toBe(95.24);

    expect(
      resolveBookingAccountingTaxFields({
        service: { price: 100 },
        metadata: {
          pricing: {
            subtotal: 90,
            netAmount: 88,
            amountDue: 108,
            taxEnabled: true,
            taxAmount: 18,
            taxName: 'VAT',
            taxRate: 20,
            taxModel: 'exclusive',
          },
        },
      }),
    ).toMatchObject({
      subtotal: 90,
      taxName: 'VAT',
      taxRate: 20,
    });
  });

  it('uses aggregate tax line for a single stacked rule entry', () => {
    expect(
      readBookingReceiptTaxSnapshot({
        metadata: {
          pricing: {
            taxEnabled: true,
            taxAmount: 5,
            taxName: 'GST',
            taxRate: 5,
            taxRules: [{ id: 'gst', name: 'GST', rate: 5, amount: 5 }],
          },
        },
      })?.taxLines,
    ).toEqual([{ id: 'aggregate', name: 'GST', rate: 5, amount: 5 }]);
  });

  it('uses netAmount for accounting subtotal when subtotal is absent', () => {
    expect(
      resolveBookingAccountingTaxFields({
        service: { price: 'bad' },
        metadata: {
          pricing: {
            netAmount: 88,
            amountDue: 100,
            taxEnabled: true,
            taxAmount: 12,
            taxName: 'VAT',
            taxRate: 12,
          },
        },
      }),
    ).toMatchObject({
      subtotal: 88,
      total: 100,
    });
  });

  it('treats invalid tax amount values as zero tax', () => {
    expect(
      readBookingReceiptTaxSnapshot({
        metadata: { pricing: { taxEnabled: true, taxAmount: 'bad' } },
      }),
    ).toBeNull();
    expect(
      resolveBookingTaxCollected({
        metadata: { pricing: { taxEnabled: true, taxAmount: null } },
      }),
    ).toBe(0);
  });

  it('assigns fallback stacked rule ids for non-string ids', () => {
    expect(
      readBookingReceiptTaxSnapshot({
        metadata: {
          pricing: {
            taxEnabled: true,
            taxAmount: 13,
            taxRules: [
              { id: 42, name: 'GST', rate: 5, amount: 5 },
              { id: 'pst', name: 'PST', rate: 8, amount: 8 },
            ],
          },
        },
      })?.taxLines?.[0]?.id,
    ).toBe('rule-1');
  });
});
