import { AnalyticsService } from './analytics.service.js';
import { DashboardService } from '../business/dashboard.service.js';
import {
  formatBusinessMoney,
  getBusinessDefaultCurrency,
  SUPPORTED_BUSINESS_CURRENCIES,
} from '../../common/utils/business-currency.util.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';

describe('Sprint 28 — reports currency pipeline integration', () => {
  const businessRepo = { findOne: jest.fn() };
  const bookingRepo = {
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const employeeRepo = {
    find: jest.fn(),
    count: jest.fn(),
  };
  const serviceRepo = { count: jest.fn() };
  const customerRepo = { count: jest.fn() };
  const slotRepo = { find: jest.fn() };
  const expenseRepo = { createQueryBuilder: jest.fn() };
  const commissionRepo = { find: jest.fn() };

  const analyticsService = new AnalyticsService(
    bookingRepo as never,
    businessRepo as never,
    employeeRepo as never,
    serviceRepo as never,
    expenseRepo as never,
    commissionRepo as never,
  );
  const dashboardService = new DashboardService(
    bookingRepo as never,
    businessRepo as never,
    employeeRepo as never,
    serviceRepo as never,
    customerRepo as never,
    slotRepo as never,
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
    employeeRepo.find.mockResolvedValue([
      { id: 'emp-1', name: 'Jane', isActive: true },
    ]);
    employeeRepo.count.mockResolvedValue(1);
    serviceRepo.count.mockResolvedValue(1);
    customerRepo.count.mockResolvedValue(1);
    bookingRepo.count.mockResolvedValue(0);
    slotRepo.find.mockResolvedValue([]);
    commissionRepo.find.mockResolvedValue([]);
    expenseRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
  });

  it.each(SUPPORTED_BUSINESS_CURRENCIES.map((code) => ({ code })))(
    'dashboard + analytics reports use business currency $code',
    async ({ code }) => {
      const settings = { currency: code };
      businessRepo.findOne.mockResolvedValue({ id: 'biz-1', settings });
      bookingRepo.find.mockResolvedValue([
        {
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          startTime: new Date('2026-06-01T10:00:00Z'),
          endTime: new Date('2026-06-01T11:00:00Z'),
          service: { price: 100 },
        },
      ]);
      bookingRepo.createQueryBuilder.mockReturnValue(
        queryBuilderMock([
          {
            employeeId: 'emp-1',
            status: BookingStatus.COMPLETED,
            paymentStatus: PaymentStatus.PAID,
            startTime: new Date('2026-05-10T10:00:00Z'),
            endTime: new Date('2026-05-10T11:00:00Z'),
            service: { price: 100 },
          },
        ]),
      );

      const overview = await dashboardService.getOverview('biz-1');
      const staff = await analyticsService.staffPerformance('biz-1', query);
      const pl = await analyticsService.profitAndLoss('biz-1', query);

      expect(getBusinessDefaultCurrency(settings)).toBe(code);
      expect(overview.currency).toBe(code);
      expect(staff.currency).toBe(code);
      expect(pl.currency).toBe(code);
      expect(
        formatBusinessMoney(overview.revenueThisMonth, settings),
      ).toBeTruthy();
    },
  );

  it('formats export PDF revenue with tenant symbol not hardcoded dollar', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'RUB' },
    });
    bookingRepo.createQueryBuilder.mockReturnValue(
      queryBuilderMock([
        {
          employeeId: 'emp-1',
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          startTime: new Date('2026-05-10T10:00:00Z'),
          endTime: new Date('2026-05-10T11:00:00Z'),
          service: { price: 2500 },
        },
      ]),
    );
    bookingRepo.find.mockResolvedValue([]);

    const html = await analyticsService.exportPdfHtml('biz-1', query);
    const formatted = formatBusinessMoney(2500, { currency: 'RUB' });

    expect(html).toContain('All amounts in RUB');
    expect(html).toContain(formatted);
    expect(html).not.toContain('Revenue: $');
  });
});
