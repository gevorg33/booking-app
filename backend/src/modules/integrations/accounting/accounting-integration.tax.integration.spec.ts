import { AccountingExportService } from './accounting-export.service.js';
import { AccountingIntegrationService } from './accounting-integration.service.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../../booking/entities/booking.entity.js';

describe('Sprint 36 — accounting export tax integration', () => {
  const businessRepo = { findOne: jest.fn(), save: jest.fn() };
  const bookingRepo = { find: jest.fn() };
  const expenseRepo = { createQueryBuilder: jest.fn() };
  const commissionRepo = { find: jest.fn() };
  const customerSubscriptionRepo = { find: jest.fn() };
  const exportService = new AccountingExportService();

  const service = new AccountingIntegrationService(
    businessRepo as never,
    bookingRepo as never,
    expenseRepo as never,
    commissionRepo as never,
    customerSubscriptionRepo as never,
    exportService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        currency: 'USD',
        integrations: { accounting: { enabled: true, provider: 'csv' } },
      },
    });
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b-tax',
        startTime: new Date('2026-06-01T10:00:00Z'),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        service: { name: 'Massage', price: 100, currency: 'USD' },
        customer: { name: 'Alex' },
        employee: { name: 'Sam' },
        metadata: {
          pricing: {
            subtotal: 100,
            amountDue: 120,
            taxEnabled: true,
            taxName: 'VAT',
            taxRate: 20,
            taxAmount: 20,
            netAmount: 100,
          },
        },
      },
    ]);
    expenseRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
    commissionRepo.find.mockResolvedValue([]);
    customerSubscriptionRepo.find.mockResolvedValue([]);
  });

  it('includes tax columns in generic CSV export rows', async () => {
    const result = await service.generateExport('biz-1');
    expect(result.content).toContain(
      'Subtotal,TaxName,TaxRate,TaxAmount,Total',
    );
    expect(result.content).toContain('Massage');
    expect(result.content).toContain('VAT');
    expect(result.content).toContain('20.00');
    expect(result.content).toContain('120.00');
  });

  it('marks taxed Xero rows as Tax on Sales', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        integrations: { accounting: { enabled: true, provider: 'xero' } },
      },
    });
    const result = await service.generateExport('biz-1');
    expect(result.content).toContain('Tax on Sales');
    expect(result.content).toContain('VAT');
  });

  it('exports quickbooks rows with tax memo from booking metadata', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        integrations: {
          accounting: {
            enabled: true,
            provider: 'quickbooks',
            incomeAccountName: 'Sales',
          },
        },
      },
    });
    const result = await service.generateExport('biz-1');
    expect(result.provider).toBe('quickbooks');
    expect(result.content).toContain('tax VAT 20% = 20.00');
    expect(result.content).toContain('120.00');
  });

  it('falls back to service price when booking has no tax metadata', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b-plain',
        startTime: new Date('2026-06-02T10:00:00Z'),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        service: { name: 'Consult', price: 80, currency: 'USD' },
        customer: { name: 'Sam' },
        employee: { name: 'Alex' },
        metadata: {},
      },
    ]);
    const result = await service.generateExport('biz-1');
    expect(result.content).toContain('80.00');
    expect(result.content).not.toContain('Tax on Sales');
  });

  it('exports stacked tax totals from amountDue metadata', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b-stack',
        startTime: new Date('2026-06-03T10:00:00Z'),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        service: { name: 'Spa', price: 100, currency: 'USD' },
        customer: { name: 'Lee' },
        employee: { name: 'Sam' },
        metadata: {
          pricing: {
            subtotal: 100,
            amountDue: 113,
            taxEnabled: true,
            taxName: 'GST + PST',
            taxRate: 13,
            taxAmount: 13,
            taxRules: [
              { id: 'gst', name: 'GST', rate: 5, amount: 5 },
              { id: 'pst', name: 'PST', rate: 8, amount: 8 },
            ],
          },
        },
      },
    ]);
    const result = await service.generateExport('biz-1');
    expect(result.content).toContain('113.00');
    expect(result.content).toContain('13.00');
  });
});
