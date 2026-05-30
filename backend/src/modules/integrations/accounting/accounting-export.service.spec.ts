import { AccountingExportService } from './accounting-export.service.js';

describe('AccountingExportService', () => {
  const service = new AccountingExportService();
  const rows = [
    {
      date: '2026-05-01',
      description: 'Haircut',
      amount: 50,
      currency: 'USD',
      type: 'income' as const,
      reference: 'book-1',
      customerName: 'Jane',
      employeeName: 'Alex',
    },
    {
      date: '2026-05-02',
      description: 'Supplies',
      amount: -20,
      currency: 'USD',
      type: 'expense' as const,
      reference: 'exp-1',
    },
  ];

  it('builds generic csv export', () => {
    const result = service.buildExport('csv', rows);
    expect(result.format).toBe('csv');
    expect(result.content).toContain('Haircut');
    expect(result.rowCount).toBe(2);
  });

  it('builds xero csv export', () => {
    const result = service.buildExport('xero', rows, { accountCode: '400' });
    expect(result.provider).toBe('xero');
    expect(result.content).toContain('400');
    expect(result.content).toContain('Jane');
  });

  it('builds quickbooks iif export', () => {
    const result = service.buildExport('quickbooks', rows, { incomeAccountName: 'Sales' });
    expect(result.format).toBe('iif');
    expect(result.content).toContain('Sales');
    expect(result.content).toContain('ENDTRNS');
  });

  it('escapes csv commas in descriptions', () => {
    const result = service.buildExport('csv', [
      { ...rows[0], description: 'Cut, color' },
    ]);
    expect(result.content).toContain('"Cut, color"');
  });

  it('defaults xero account code and quickbooks account name', () => {
    const xero = service.buildExport('xero', rows);
    expect(xero.content).toContain('200');
    const qb = service.buildExport('quickbooks', rows, {});
    expect(qb.content).toContain('Service Income');
  });
});
