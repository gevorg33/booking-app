import { AnalyticsService } from './analytics.service.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { SUPPORTED_BUSINESS_CURRENCIES } from '../../common/utils/business-currency.util.js';

describe('Sprint 28 — analytics currency integration', () => {
  const bookingRepo = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const businessRepo = {
    findOne: jest.fn(),
  };
  const employeeRepo = { find: jest.fn() };
  const serviceRepo = { find: jest.fn() };
  const expenseRepo = {
    createQueryBuilder: jest.fn(),
  };
  const commissionRepo = { find: jest.fn() };

  const service = new AnalyticsService(
    bookingRepo as never,
    businessRepo as never,
    employeeRepo as never,
    serviceRepo as never,
    expenseRepo as never,
    commissionRepo as never,
  );

  const query = { from: '2026-05-01', to: '2026-05-31' };

  function queryBuilderMock(bookings: unknown[]) {
    return {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(bookings),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'AMD' },
    });
    employeeRepo.find.mockResolvedValue([
      { id: 'emp-1', name: 'Jane', isActive: true },
    ]);
    commissionRepo.find.mockResolvedValue([]);
    expenseRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
  });

  it('returns business currency on staff performance report', async () => {
    bookingRepo.createQueryBuilder.mockReturnValue(
      queryBuilderMock([
        {
          employeeId: 'emp-1',
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          startTime: new Date('2026-05-10T10:00:00Z'),
          endTime: new Date('2026-05-10T11:00:00Z'),
          service: { price: 12000 },
        },
      ]),
    );

    const report = await service.staffPerformance('biz-1', query);

    expect(report.currency).toBe('AMD');
    expect(report.rows[0]?.revenue).toBe(12000);
  });

  it('returns business currency on service popularity report', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'EUR' },
    });
    bookingRepo.find.mockResolvedValue([
      {
        serviceId: 'svc-1',
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        service: { name: 'Facial', price: 80 },
      },
    ]);

    const report = await service.servicePopularity('biz-1', query);

    expect(report.currency).toBe('EUR');
    expect(report.rows[0]?.revenue).toBe(80);
  });

  it('includes currency on P&L without cross-currency conversion', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'GEL' },
    });
    bookingRepo.createQueryBuilder
      .mockReturnValueOnce(
        queryBuilderMock([
          {
            employeeId: 'emp-1',
            status: BookingStatus.COMPLETED,
            paymentStatus: PaymentStatus.PAID,
            startTime: new Date('2026-05-10T10:00:00Z'),
            endTime: new Date('2026-05-10T11:00:00Z'),
            service: { price: 150 },
          },
        ]),
      )
      .mockReturnValueOnce(queryBuilderMock([]));
    expenseRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ amount: 40 }]),
    });

    const pl = await service.profitAndLoss('biz-1', query);

    expect(pl.currency).toBe('GEL');
    expect(pl.revenue).toBe(150);
    expect(pl.expenses).toBe(40);
    expect(pl.netProfit).toBe(110);
  });

  it('formats CSV export with currency meta row', async () => {
    bookingRepo.createQueryBuilder.mockReturnValue(queryBuilderMock([]));
    bookingRepo.find.mockResolvedValue([]);

    const csv = await service.exportCsv('biz-1', query);

    expect(csv).toContain('Meta,Currency,AMD');
    expect(csv).not.toContain('$');
  });

  it('formats PDF export with tenant currency instead of hardcoded USD', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'EUR' },
    });
    bookingRepo.createQueryBuilder.mockReturnValue(
      queryBuilderMock([
        {
          employeeId: 'emp-1',
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          startTime: new Date('2026-05-10T10:00:00Z'),
          endTime: new Date('2026-05-10T11:00:00Z'),
          service: { price: 60 },
        },
      ]),
    );
    bookingRepo.find.mockResolvedValue([]);

    const html = await service.exportPdfHtml('biz-1', query);

    expect(html).toContain('All amounts in EUR');
    expect(html).toContain('Revenue (EUR)');
    expect(html).not.toMatch(/Revenue: \$|revenue \$/i);
  });

  it.each(SUPPORTED_BUSINESS_CURRENCIES.map((code) => ({ code })))(
    'staff report currency matches tenant default $code',
    async ({ code }) => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { currency: code },
      });
      bookingRepo.createQueryBuilder.mockReturnValue(queryBuilderMock([]));

      const report = await service.staffPerformance('biz-1', query);

      expect(report.currency).toBe(code);
      expect(report.rows).toHaveLength(1);
      expect(report.rows[0]?.revenue).toBe(0);
    },
  );

  it('uses defaultCurrency when currency field is absent', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { defaultCurrency: 'CHF' },
    });
    bookingRepo.createQueryBuilder.mockReturnValue(queryBuilderMock([]));

    const pl = await service.profitAndLoss('biz-1', query);

    expect(pl.currency).toBe('CHF');
  });

  it('aggregates revenue as raw numeric sum without FX conversion', async () => {
    bookingRepo.createQueryBuilder.mockReturnValue(
      queryBuilderMock([
        {
          employeeId: 'emp-1',
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          startTime: new Date('2026-05-10T10:00:00Z'),
          endTime: new Date('2026-05-10T11:00:00Z'),
          service: { price: 45, currency: 'USD' },
        },
        {
          employeeId: 'emp-1',
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          startTime: new Date('2026-05-11T10:00:00Z'),
          endTime: new Date('2026-05-11T11:00:00Z'),
          service: { price: 55, currency: 'EUR' },
        },
      ]),
    );

    const report = await service.staffPerformance('biz-1', query);

    expect(report.currency).toBe('AMD');
    expect(report.rows[0]?.revenue).toBe(100);
  });

  it('throws when business is missing for currency resolution', async () => {
    businessRepo.findOne.mockResolvedValue(null);

    await expect(service.staffPerformance('biz-1', query)).rejects.toThrow(
      'Business not found',
    );
  });
});
