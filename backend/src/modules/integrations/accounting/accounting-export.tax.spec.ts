import { AccountingExportService } from './accounting-export.service.js';

describe('AccountingExportService tax columns', () => {
  const service = new AccountingExportService();

  const taxedIncome = {
    date: '2026-06-01',
    description: 'Massage',
    amount: 120,
    currency: 'USD',
    type: 'income' as const,
    reference: 'book-tax',
    customerName: 'Alex',
    subtotal: 100,
    taxName: 'VAT',
    taxRate: 20,
    taxAmount: 20,
    total: 120,
  };

  const untaxedIncome = {
    date: '2026-06-02',
    description: 'Consult',
    amount: 80,
    currency: 'USD',
    type: 'income' as const,
    reference: 'book-plain',
    customerName: 'Sam',
  };

  it('builds quickbooks memo with tax breakdown for taxed rows', () => {
    const result = service.buildExport('quickbooks', [taxedIncome], {
      incomeAccountName: 'Sales',
    });
    expect(result.content).toContain('tax VAT 20% = 20.00');
    expect(result.content).toContain('Massage');
  });

  it('marks untaxed Xero rows as Tax Exempt and taxed rows as Tax on Sales', () => {
    const result = service.buildExport('xero', [taxedIncome, untaxedIncome], {
      accountCode: '400',
    });
    expect(result.content).toContain('Tax on Sales');
    expect(result.content).toContain('Tax Exempt');
    expect(result.content).toContain('incl. VAT 20.00');
  });

  it('escapes commas in taxed Xero descriptions', () => {
    const result = service.buildExport('xero', [
      {
        ...taxedIncome,
        description: 'Cut, color',
        taxName: 'VAT, special',
      },
    ]);
    expect(result.content).toContain('"Cut, color (incl. VAT, special 20.00)"');
  });

  it('uses generic tax label in quickbooks memo when tax name is missing', () => {
    const result = service.buildExport('quickbooks', [
      {
        ...taxedIncome,
        taxName: null,
      },
    ]);
    expect(result.content).toContain('tax Tax 20% = 20.00');
  });

  it('defaults walk-in contact and generic tax label in Xero export', () => {
    const result = service.buildExport('xero', [
      {
        ...taxedIncome,
        customerName: undefined,
        taxName: null,
        taxRate: null,
      },
    ]);
    expect(result.content).toContain('Walk-in');
    expect(result.content).toContain('incl. tax 20.00');
    expect(result.content).toMatch(/,,\d/);
  });

  it('omits quickbooks tax memo for non-income rows', () => {
    const result = service.buildExport('quickbooks', [
      {
        date: '2026-06-04',
        description: 'Staff commissions',
        amount: -30,
        currency: 'USD',
        type: 'commission',
        reference: 'comm-1',
      },
    ]);
    expect(result.content).not.toContain('tax ');
  });

  it('leaves tax columns empty for expense and commission rows in CSV', () => {
    const result = service.buildExport('csv', [
      taxedIncome,
      {
        date: '2026-06-03',
        description: 'Supplies',
        amount: -15,
        currency: 'USD',
        type: 'expense' as const,
        reference: 'exp-1',
      },
    ]);
    const lines = result.content.split('\n');
    expect(lines[0]).toContain('TaxAmount');
    expect(lines[2]).toMatch(/expense/);
    expect(lines[2]).toContain('-15.00');
  });
});
