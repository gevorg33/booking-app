import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { DashboardService } from './dashboard.service.js';

describe('Sprint 36 — dashboard tax revenue integration', () => {
  const bookingRepo = { count: jest.fn(), find: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const employeeRepo = { count: jest.fn() };
  const serviceRepo = { count: jest.fn() };
  const customerRepo = { count: jest.fn() };
  const slotRepo = { find: jest.fn() };

  const service = new DashboardService(
    bookingRepo as never,
    businessRepo as never,
    employeeRepo as never,
    serviceRepo as never,
    customerRepo as never,
    slotRepo as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.count.mockResolvedValue(1);
    employeeRepo.count.mockResolvedValue(1);
    serviceRepo.count.mockResolvedValue(1);
    customerRepo.count.mockResolvedValue(1);
    slotRepo.find.mockResolvedValue([]);
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'USD' },
    });
  });

  it('splits gross, tax collected, and net revenue for paid bookings', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        startTime: new Date('2026-06-01T10:00:00Z'),
        endTime: new Date('2026-06-01T11:00:00Z'),
        service: { price: 100, currency: 'USD' },
        metadata: {
          pricing: {
            subtotal: 100,
            amountDue: 120,
            taxEnabled: true,
            taxAmount: 20,
            netAmount: 100,
          },
        },
      },
      {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        startTime: new Date('2026-06-02T10:00:00Z'),
        endTime: new Date('2026-06-02T11:00:00Z'),
        service: { price: 50, currency: 'USD' },
        metadata: { amountPaid: 50 },
      },
    ]);

    const overview = await service.getOverview('biz-1');

    expect(overview).toMatchObject({
      revenueThisMonth: 170,
      taxCollectedThisMonth: 20,
      netRevenueThisMonth: 150,
      currency: 'USD',
    });
  });

  it('returns zero tax totals when bookings have no tax metadata', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        startTime: new Date('2026-06-01T10:00:00Z'),
        endTime: new Date('2026-06-01T11:00:00Z'),
        service: { price: 80, currency: 'USD' },
        metadata: {},
      },
    ]);

    const overview = await service.getOverview('biz-1');

    expect(overview.taxCollectedThisMonth).toBe(0);
    expect(overview.netRevenueThisMonth).toBe(80);
    expect(overview.revenueThisMonth).toBe(80);
  });
});
