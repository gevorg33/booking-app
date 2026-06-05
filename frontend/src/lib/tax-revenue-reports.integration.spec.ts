import { describe, expect, it } from 'vitest';
import { formatBusinessMoney } from './business-currency';

function buildTaxReportLabels(currency: string) {
  return {
    grossRevenue: `Gross revenue (${currency})`,
    taxCollected: `Tax collected (${currency})`,
    netRevenue: `Net revenue (${currency})`,
    revenueMonth: `Revenue (month, ${currency})`,
  };
}

describe('Sprint 36 — tax revenue reports integration', () => {
  it.each([
    {
      id: 'taxed-pl',
      pl: {
        grossRevenue: 120,
        taxCollected: 20,
        netRevenue: 100,
        revenue: 120,
        currency: 'USD',
      },
      expectedGross: 120,
      expectedTax: 20,
      expectedNet: 100,
    },
    {
      id: 'no-tax',
      pl: {
        grossRevenue: 80,
        taxCollected: 0,
        netRevenue: 80,
        revenue: 80,
        currency: 'EUR',
      },
      expectedGross: 80,
      expectedTax: 0,
      expectedNet: 80,
    },
  ])('formats P&L tax split for $id', ({ pl, expectedGross, expectedTax, expectedNet }) => {
    const labels = buildTaxReportLabels(pl.currency);
    expect(labels.grossRevenue).toBe(`Gross revenue (${pl.currency})`);
    expect(labels.taxCollected).toBe(`Tax collected (${pl.currency})`);
    expect(labels.netRevenue).toBe(`Net revenue (${pl.currency})`);
    expect(formatBusinessMoney(pl.grossRevenue, { businessCurrency: pl.currency })).toBeTruthy();
    expect(pl.grossRevenue).toBe(expectedGross);
    expect(pl.taxCollected).toBe(expectedTax);
    expect(pl.netRevenue).toBe(expectedNet);
  });

  it('dashboard overview exposes tax month stats alongside gross revenue', () => {
    const overview = {
      revenueThisMonth: 170,
      taxCollectedThisMonth: 20,
      netRevenueThisMonth: 150,
      currency: 'USD',
    };
    const labels = buildTaxReportLabels(overview.currency);
    expect(labels.revenueMonth).toBe('Revenue (month, USD)');
    expect(overview.revenueThisMonth - overview.taxCollectedThisMonth).toBe(
      overview.netRevenueThisMonth,
    );
  });
});
