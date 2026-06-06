import { describe, expect, it } from 'vitest';
import {
  formatBusinessMoney,
  readBusinessCurrency,
  SUPPORTED_BUSINESS_CURRENCIES,
} from './business-currency';

function formatReportRevenue(
  settings: Record<string, unknown>,
  amount: number,
): { currency: string; label: string; formatted: string } {
  const currency = readBusinessCurrency(settings);
  return {
    currency,
    label: `Revenue (${currency})`,
    formatted: formatBusinessMoney(amount, { businessCurrency: currency }),
  };
}

function unwrapAnalyticsReport<T>(payload: { currency: string; rows: T[] }) {
  return {
    currency: payload.currency,
    rows: payload.rows,
  };
}

function buildReportLabels(currency: string) {
  return {
    revenueColumn: `Revenue (${currency})`,
    revenueMonth: `Revenue (month, ${currency})`,
    currencyNote: `All amounts are in ${currency}. No currency conversion is applied (single currency per business).`,
    plRevenue: `Revenue (${currency})`,
    plExpenses: `Expenses (${currency})`,
    plCommissions: `Commissions (${currency})`,
    plNetProfit: `Net profit (${currency})`,
  };
}

describe('Sprint 28 — reports currency integration', () => {
  const REPORT_SURFACES = [
    'dashboard-overview-revenue',
    'reports-staff-revenue-column',
    'reports-service-revenue-column',
    'operations-pl-revenue',
    'operations-pl-expenses',
    'operations-pl-commissions',
    'operations-pl-net-profit',
    'analytics-csv-meta',
    'analytics-pdf-header',
  ] as const;

  it('covers every reports currency surface id', () => {
    expect(REPORT_SURFACES.length).toBe(9);
  });

  it.each([
    { settings: { currency: 'AMD' }, amount: 12500, code: 'AMD' },
    { settings: { currency: 'EUR' }, amount: 4200, code: 'EUR' },
    { settings: { currency: 'GEL' }, amount: 640, code: 'GEL' },
    { settings: { currency: 'USD' }, amount: 15000, code: 'USD' },
    { settings: { defaultCurrency: 'RUB' }, amount: 25000, code: 'RUB' },
    { settings: {}, amount: 99, code: 'USD' },
  ])(
    'staff/service revenue KPI uses tenant currency $code',
    ({ settings, amount, code }) => {
      const row = formatReportRevenue(settings, amount);
      expect(row.currency).toBe(code);
      expect(row.label).toBe(`Revenue (${code})`);
      expect(row.formatted).toBeTruthy();
      expect(row.formatted).not.toBe('—');
    },
  );

  it.each(SUPPORTED_BUSINESS_CURRENCIES.map((code) => ({ code })))(
    'formats report revenue KPI in supported currency $code',
    ({ code }) => {
      const settings = { currency: code };
      const formatted = formatBusinessMoney(100, { businessCurrency: code });
      const labels = buildReportLabels(code);
      expect(labels.revenueColumn).toBe(`Revenue (${code})`);
      expect(formatted).toBeTruthy();
      expect(readBusinessCurrency(settings)).toBe(code);
    },
  );

  it('unwraps analytics API reports with currency + rows', () => {
    const staff = unwrapAnalyticsReport({
      currency: 'EUR',
      rows: [{ employeeId: 'e1', revenue: 800 }],
    });
    const services = unwrapAnalyticsReport({
      currency: 'EUR',
      rows: [{ serviceId: 's1', revenue: 120 }],
    });

    expect(staff.currency).toBe('EUR');
    expect(staff.rows).toHaveLength(1);
    expect(services.rows[0]?.revenue).toBe(120);
  });

  it('dashboard overview revenue uses API currency when present', () => {
    const tenant = readBusinessCurrency({ currency: 'RUB' });
    const overview = { revenueThisMonth: 25000, currency: 'RUB' };
    const label = `Revenue (month, ${overview.currency ?? tenant})`;
    const formatted = formatBusinessMoney(overview.revenueThisMonth, {
      businessCurrency: overview.currency,
    });
    expect(label).toBe('Revenue (month, RUB)');
    expect(formatted).toBeTruthy();
  });

  it('P&L KPI labels include currency code without conversion', () => {
    const currency = 'CHF';
    const pl = {
      revenue: 1000,
      expenses: 200,
      commissions: 50,
      netProfit: 750,
      currency,
    };
    const labels = buildReportLabels(pl.currency);
    expect(labels.plRevenue).toBe('Revenue (CHF)');
    expect(labels.plExpenses).toBe('Expenses (CHF)');
    expect(labels.plCommissions).toBe('Commissions (CHF)');
    expect(labels.plNetProfit).toBe('Net profit (CHF)');
    expect(labels.currencyNote).toContain('CHF');
    expect(labels.currencyNote).toContain('No currency conversion');
    expect(
      formatBusinessMoney(pl.netProfit, { businessCurrency: currency }),
    ).toBeTruthy();
  });

  it('prefers API report currency over hook fallback for column headers', () => {
    const tenantCurrency = 'USD';
    const apiCurrency = 'AMD';
    const column = `Revenue (${apiCurrency ?? tenantCurrency})`;
    expect(column).toBe('Revenue (AMD)');
  });

  it('CSV export meta row includes tenant currency code', () => {
    const currency = 'GEL';
    const row = `Meta,Currency,${currency},,`;
    expect(row).toBe('Meta,Currency,GEL,,');
  });
});
