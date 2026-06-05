import { AnalyticsService } from './analytics.service.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';

describe('Sprint 36 — analytics tax revenue integration', () => {
  const bookingRepo = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };
  const businessRepo = { findOne: jest.fn() };
  const employeeRepo = { find: jest.fn() };
  const serviceRepo = { find: jest.fn() };
  const expenseRepo = { createQueryBuilder: jest.fn() };
  const commissionRepo = { find: jest.fn() };

  const service = new AnalyticsService(
    bookingRepo as never,
    businessRepo as never,
    employeeRepo as never,
    serviceRepo as never,
    expenseRepo as never,
    commissionRepo as never,
  );

  const taxedBooking = {
    id: 'b1',
    employeeId: 'e1',
    serviceId: 's1',
    status: BookingStatus.COMPLETED,
    paymentStatus: PaymentStatus.PAID,
    startTime: new Date('2026-06-01T10:00:00Z'),
    endTime: new Date('2026-06-01T11:00:00Z'),
    service: { id: 's1', name: 'Massage', price: 100, currency: 'USD' },
    metadata: {
      pricing: {
        subtotal: 100,
        amountDue: 120,
        taxEnabled: true,
        taxAmount: 20,
        netAmount: 100,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'USD' },
    });
    employeeRepo.find.mockResolvedValue([
      { id: 'e1', name: 'Sam', isActive: true },
    ]);
    commissionRepo.find.mockResolvedValue([]);
    expenseRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
    bookingRepo.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([taxedBooking]),
    });
    bookingRepo.find.mockResolvedValue([taxedBooking]);
  });

  it('splits gross revenue, tax collected, and net revenue in P&L report', async () => {
    const pl = await service.profitAndLoss('biz-1', {
      from: '2026-06-01',
      to: '2026-06-30',
    });

    expect(pl).toMatchObject({
      grossRevenue: 120,
      taxCollected: 20,
      netRevenue: 100,
      revenue: 120,
    });
  });

  it('uses tax-inclusive gross in staff and service performance reports', async () => {
    const staff = await service.staffPerformance('biz-1', {
      from: '2026-06-01',
      to: '2026-06-30',
    });
    const services = await service.servicePopularity('biz-1', {
      from: '2026-06-01',
      to: '2026-06-30',
    });

    expect(staff.rows[0]?.revenue).toBe(120);
    expect(services.rows[0]?.revenue).toBe(120);
  });

  it('includes tax revenue rows in CSV and PDF exports', async () => {
    const csv = await service.exportCsv('biz-1', {
      from: '2026-06-01',
      to: '2026-06-30',
    });
    const pdf = await service.exportPdfHtml('biz-1', {
      from: '2026-06-01',
      to: '2026-06-30',
    });

    expect(csv).toContain('P&L,Gross Revenue,120');
    expect(csv).toContain('P&L,Tax Collected,20');
    expect(csv).toContain('P&L,Net Revenue,100');
    expect(pdf).toContain('Gross revenue:');
    expect(pdf).toContain('Tax collected:');
    expect(pdf).toContain('Net revenue:');
  });
});
