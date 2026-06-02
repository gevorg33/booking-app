import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountingIntegrationService } from './accounting-integration.service.js';
import { AccountingExportService } from './accounting-export.service.js';
import { BookingStatus, PaymentStatus } from '../../booking/entities/booking.entity.js';

describe('AccountingIntegrationService', () => {
  const businessRepo = { findOne: jest.fn(), save: jest.fn() };
  const bookingRepo = { find: jest.fn() };
  const expenseRepo = { createQueryBuilder: jest.fn() };
  const commissionRepo = { find: jest.fn() };
  const customerSubscriptionRepo = { find: jest.fn() };
  const exportService = { buildExport: jest.fn() };

  const service = new AccountingIntegrationService(
    businessRepo as any,
    bookingRepo as any,
    expenseRepo as any,
    commissionRepo as any,
    customerSubscriptionRepo as any,
    exportService as unknown as AccountingExportService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.save.mockImplementation(async (b: unknown) => b);
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { integrations: { accounting: { enabled: true } } },
    });
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b1',
        employeeId: 'e1',
        serviceId: 's1',
        startTime: new Date('2026-05-01T10:00:00Z'),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        service: { name: 'Cut', price: 50, currency: 'USD' },
        customer: { name: 'Jane' },
        employee: { name: 'Alex' },
      },
    ]);
    expenseRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        { id: 'exp-1', expenseDate: '2026-05-02', description: 'Supplies', category: 'supplies', amount: 10, currency: 'USD' },
      ]),
    });
    commissionRepo.find.mockResolvedValue([]);
    customerSubscriptionRepo.find.mockResolvedValue([]);
    exportService.buildExport.mockReturnValue({
      provider: 'csv',
      format: 'csv',
      filename: 'export.csv',
      content: 'csv',
      rowCount: 1,
      generatedAt: new Date().toISOString(),
    });
  });

  it('returns default accounting settings when business has no settings object', async () => {
    businessRepo.findOne.mockResolvedValue({ id: 'biz-1' });
    const view = await service.getPublicSettings('biz-1');
    expect(view.enabled).toBe(false);
    expect(view.provider).toBe('csv');
  });

  it('returns default accounting settings', async () => {
    const view = await service.getPublicSettings('biz-1');
    expect(view.provider).toBe('csv');
    expect(view.includeCommissions).toBe(true);
  });

  it('updates accounting settings', async () => {
    const view = await service.updateSettings('biz-1', {
      enabled: true,
      provider: 'xero',
      accountCode: '400',
      includeExpenses: false,
    });
    expect(view.enabled).toBe(true);
    expect(view.provider).toBe('xero');
    expect(view.includeExpenses).toBe(false);
  });

  it('clears optional accounting fields when blank strings are sent', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        integrations: {
          accounting: {
            enabled: true,
            incomeAccountName: 'Sales',
            accountCode: '400',
          },
        },
      },
    });
    const view = await service.updateSettings('biz-1', {
      incomeAccountName: '   ',
      accountCode: ' ',
    });
    expect(view.incomeAccountName).toBeUndefined();
    expect(view.accountCode).toBeUndefined();
  });

  it('throws when business missing on export', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(service.generateExport('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when accounting integration is disabled', async () => {
    businessRepo.findOne.mockResolvedValue({ id: 'biz-1', settings: {} });
    await expect(service.generateExport('biz-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('includes subscription purchases as income rows', async () => {
    customerSubscriptionRepo.find.mockResolvedValue([
      {
        id: 'sub-1',
        createdAt: new Date('2026-05-03T12:00:00Z'),
        pricePaid: 199,
        currency: 'USD',
        plan: { name: '6-month plan' },
        customer: { name: 'Sam' },
      },
    ]);
    await service.generateExport('biz-1', '2026-05-01', '2026-05-31');
    expect(exportService.buildExport).toHaveBeenCalledWith(
      'csv',
      expect.arrayContaining([
        expect.objectContaining({
          type: 'income',
          incomeSubType: 'subscription',
          amount: 199,
          reference: 'sub-1',
          customerName: 'Sam',
        }),
      ]),
      expect.any(Object),
    );
  });

  it('generates export via export service', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { integrations: { accounting: { enabled: true } } },
    });
    const result = await service.generateExport('biz-1', '2026-05-01', '2026-05-31');
    expect(exportService.buildExport).toHaveBeenCalledWith(
      'csv',
      expect.arrayContaining([
        expect.objectContaining({ type: 'income', amount: 50 }),
        expect.objectContaining({ type: 'expense' }),
      ]),
      expect.any(Object),
    );
    expect(result.content).toBe('csv');
  });

  it('includes commission row when rules exist', async () => {
    commissionRepo.find.mockResolvedValue([
      { employeeId: 'e1', serviceId: 's1', type: 'percent', value: 10, isActive: true },
    ]);
    await service.generateExport('biz-1');
    expect(exportService.buildExport).toHaveBeenCalledWith(
      'csv',
      expect.arrayContaining([expect.objectContaining({ type: 'commission', amount: -5 })]),
      expect.any(Object),
    );
  });

  it('supports flat commission rules and skips bookings without service', async () => {
    commissionRepo.find.mockResolvedValue([
      { employeeId: 'e1', type: 'flat', value: 15, isActive: true },
    ]);
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b1',
        employeeId: 'e1',
        serviceId: 's1',
        startTime: new Date('2026-05-01T10:00:00Z'),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        service: null,
        customer: { name: 'Jane' },
        employee: { name: 'Alex' },
      },
      {
        id: 'b2',
        employeeId: 'e1',
        serviceId: 's1',
        startTime: new Date('2026-05-02T10:00:00Z'),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        service: { name: 'Cut', price: 50, currency: 'USD' },
        customer: { name: 'Jane' },
        employee: { name: 'Alex' },
      },
    ]);
    await service.generateExport('biz-1');
    expect(exportService.buildExport).toHaveBeenCalledWith(
      'csv',
      expect.arrayContaining([expect.objectContaining({ type: 'commission', amount: -15 })]),
      expect.any(Object),
    );
  });

  it('updates only commission and expense flags when provided', async () => {
    await service.updateSettings('biz-1', { includeCommissions: false });
    await service.updateSettings('biz-1', { includeExpenses: false });
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('skips commission block when includeCommissions is false', async () => {
    commissionRepo.find.mockResolvedValue([
      { employeeId: 'e1', serviceId: 's1', type: 'percent', value: 50, isActive: true },
    ]);
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        integrations: {
          accounting: { enabled: true, includeCommissions: false, includeExpenses: false },
        },
      },
    });
    await service.generateExport('biz-1');
    expect(commissionRepo.find).not.toHaveBeenCalled();
  });

  it('skips expense query when includeExpenses is false', async () => {
    expenseRepo.createQueryBuilder.mockClear();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        integrations: {
          accounting: { enabled: true, includeExpenses: false, includeCommissions: false },
        },
      },
    });
    await service.generateExport('biz-1');
    expect(expenseRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('omits expenses and commissions when disabled in settings', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        integrations: {
          accounting: { enabled: true, includeExpenses: false, includeCommissions: false },
        },
      },
    });
    await service.generateExport('biz-1');
    const rows = exportService.buildExport.mock.calls[0][1] as { type: string }[];
    expect(rows.every((r) => r.type === 'income')).toBe(true);
  });

  it('uses configured provider from settings', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { integrations: { accounting: { enabled: true, provider: 'quickbooks' } } },
    });
    await service.generateExport('biz-1');
    expect(exportService.buildExport).toHaveBeenCalledWith(
      'quickbooks',
      expect.any(Array),
      expect.any(Object),
    );
  });

  it('matches commission rules by specificity', async () => {
    commissionRepo.find.mockResolvedValue([
      { employeeId: 'e1', serviceId: 's1', type: 'percent', value: 20, isActive: true },
      { employeeId: 'e1', type: 'percent', value: 10, isActive: true },
      { serviceId: 's1', type: 'percent', value: 5, isActive: true },
      { type: 'percent', value: 1, isActive: true },
    ]);
    await service.generateExport('biz-1');
    expect(exportService.buildExport).toHaveBeenCalledWith(
      'csv',
      expect.arrayContaining([expect.objectContaining({ type: 'commission', amount: -10 })]),
      expect.any(Object),
    );
  });

  it('matches service-only commission rules and skips bookings without rules', async () => {
    commissionRepo.find.mockResolvedValue([
      { serviceId: 's1', type: 'percent', value: 5, isActive: true },
    ]);
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b1',
        employeeId: 'e1',
        serviceId: 's1',
        startTime: new Date('2026-05-01T10:00:00Z'),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        service: { name: 'Cut', price: 100, currency: 'USD' },
        customer: { name: 'Jane' },
        employee: { name: 'Alex' },
      },
      {
        id: 'b2',
        employeeId: 'e2',
        serviceId: 's2',
        startTime: new Date('2026-05-02T10:00:00Z'),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        service: { name: 'Color', price: 80, currency: 'USD' },
        customer: { name: 'Sam' },
        employee: { name: 'Blake' },
      },
    ]);
    await service.generateExport('biz-1');
    expect(exportService.buildExport).toHaveBeenCalledWith(
      'csv',
      expect.arrayContaining([expect.objectContaining({ type: 'commission', amount: -5 })]),
      expect.any(Object),
    );
  });

  it('skips income rows when booking has no service', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b1',
        employeeId: 'e1',
        serviceId: 's1',
        startTime: new Date('2026-05-01T10:00:00Z'),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        service: null,
        customer: { name: 'Jane' },
        employee: { name: 'Alex' },
      },
    ]);
    await service.generateExport('biz-1');
    const rows = exportService.buildExport.mock.calls[0][1] as { type: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe('expense');
  });

  it('returns full settings view when configured', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        integrations: {
          accounting: {
            enabled: true,
            provider: 'xero',
            accountCode: '300',
            incomeAccountName: 'Sales',
            includeCommissions: false,
            includeExpenses: true,
          },
        },
      },
    });
    const view = await service.getPublicSettings('biz-1');
    expect(view.accountCode).toBe('300');
    expect(view.includeCommissions).toBe(false);
  });

  it('throws when business missing on update', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(service.updateSettings('x', { enabled: true })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws when business missing on getPublicSettings', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(service.getPublicSettings('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('skips subscription rows with zero or invalid pricePaid', async () => {
    customerSubscriptionRepo.find.mockResolvedValue([
      {
        id: 'sub-free',
        createdAt: new Date('2026-05-04T12:00:00Z'),
        pricePaid: 0,
        currency: 'USD',
        plan: { name: 'Trial' },
        customer: { name: 'Pat' },
      },
      {
        id: 'sub-bad',
        createdAt: new Date('2026-05-05T12:00:00Z'),
        pricePaid: Number.NaN,
        currency: 'USD',
        plan: null,
        customer: { name: 'Pat' },
      },
    ]);
    await service.generateExport('biz-1', '2026-05-01', '2026-05-31');
    const rows = exportService.buildExport.mock.calls[0][1] as { reference: string }[];
    expect(rows.some((r) => r.reference === 'sub-free')).toBe(false);
    expect(rows.some((r) => r.reference === 'sub-bad')).toBe(false);
  });

  it('merges accounting settings when integrations object already exists', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        integrations: { webhooks: { enabled: true }, accounting: { enabled: false } },
      },
    });
    const view = await service.updateSettings('biz-1', { enabled: true, provider: 'xero' });
    expect(view.enabled).toBe(true);
    expect(view.provider).toBe('xero');
    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          integrations: expect.objectContaining({
            webhooks: { enabled: true },
            accounting: expect.objectContaining({ enabled: true, provider: 'xero' }),
          }),
        }),
      }),
    );
  });

  it('uses default currency and expense category fallbacks', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b1',
        startTime: new Date('2026-05-01T10:00:00Z'),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        service: { name: 'Cut', price: 40, currency: null },
        customer: { name: 'Jane' },
        employee: { name: 'Alex' },
      },
    ]);
    customerSubscriptionRepo.find.mockResolvedValue([
      {
        id: 'sub-1',
        createdAt: new Date('2026-05-02T10:00:00Z'),
        pricePaid: 50,
        currency: null,
        plan: null,
        customer: { name: 'Sam' },
      },
    ]);
    expenseRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'exp-1',
          expenseDate: '2026-05-03',
          description: null,
          category: 'supplies',
          amount: 12,
          currency: null,
        },
      ]),
    });
    await service.generateExport('biz-1');
    const rows = exportService.buildExport.mock.calls[0][1] as {
      currency: string;
      description: string;
      incomeSubType?: string;
    }[];
    expect(rows.find((r) => r.incomeSubType === 'service')?.currency).toBe('USD');
    expect(rows.find((r) => r.incomeSubType === 'subscription')?.currency).toBe('USD');
    expect(rows.find((r) => r.description === 'supplies' && r.currency === 'USD')).toBeDefined();
  });

  it('omits commission row when computed total is zero', async () => {
    commissionRepo.find.mockResolvedValue([
      { employeeId: 'e9', serviceId: 's9', type: 'percent', value: 0, isActive: true },
    ]);
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b1',
        employeeId: 'e9',
        serviceId: 's9',
        startTime: new Date('2026-05-01T10:00:00Z'),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        service: { name: 'Cut', price: 50, currency: 'USD' },
        customer: { name: 'Jane' },
        employee: { name: 'Alex' },
      },
    ]);
    await service.generateExport('biz-1');
    const rows = exportService.buildExport.mock.calls[0][1] as { type: string }[];
    expect(rows.some((r) => r.type === 'commission')).toBe(false);
  });

  it('sorts subscription and booking income by date', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b-late',
        startTime: new Date('2026-05-10T10:00:00Z'),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        service: { name: 'Late cut', price: 30, currency: 'USD' },
        customer: { name: 'A' },
        employee: { name: 'B' },
      },
    ]);
    customerSubscriptionRepo.find.mockResolvedValue([
      {
        id: 'sub-early',
        createdAt: new Date('2026-05-02T10:00:00Z'),
        pricePaid: 100,
        currency: 'USD',
        plan: null,
        customer: { name: 'Sam' },
      },
    ]);
    await service.generateExport('biz-1');
    const rows = exportService.buildExport.mock.calls[0][1] as { date: string; reference: string }[];
    expect(rows[0].reference).toBe('sub-early');
    expect(rows[1].reference).toBe('b-late');
  });
});
