import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { DashboardService } from './dashboard.service.js';

describe('Sprint 28 — dashboard currency integration', () => {
  const bookingRepo = {
    count: jest.fn(),
    find: jest.fn(),
  };
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
    bookingRepo.count.mockResolvedValue(3);
    employeeRepo.count.mockResolvedValue(2);
    serviceRepo.count.mockResolvedValue(5);
    customerRepo.count.mockResolvedValue(10);
    slotRepo.find.mockResolvedValue([]);
    bookingRepo.find.mockResolvedValue([]);
  });

  it.each([
    { id: 'explicit-amd', settings: { currency: 'AMD' }, currency: 'AMD' },
    { id: 'legacy-eur', settings: { defaultCurrency: 'EUR' }, currency: 'EUR' },
    { id: 'usd-default', settings: {}, currency: 'USD' },
  ])(
    'overview exposes tenant currency for $id',
    async ({ settings, currency }) => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings,
      });
      bookingRepo.find.mockResolvedValue([
        {
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          startTime: new Date('2026-06-01T10:00:00Z'),
          endTime: new Date('2026-06-01T11:00:00Z'),
          service: { price: 100 },
        },
        {
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          startTime: new Date('2026-06-02T10:00:00Z'),
          endTime: new Date('2026-06-02T11:00:00Z'),
          service: { price: 50 },
        },
      ]);

      const overview = await service.getOverview('biz-1');

      expect(overview.currency).toBe(currency);
      expect(overview.revenueThisMonth).toBe(150);
    },
  );

  it('sums paid booking prices without cross-currency conversion', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'AMD' },
    });
    bookingRepo.find.mockResolvedValue([
      {
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        startTime: new Date('2026-06-01T10:00:00Z'),
        endTime: new Date('2026-06-01T11:00:00Z'),
        service: { price: 12000, currency: 'USD' },
      },
      {
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        startTime: new Date('2026-06-02T10:00:00Z'),
        endTime: new Date('2026-06-02T11:00:00Z'),
        service: { price: 8000, currency: null },
      },
    ]);

    const overview = await service.getOverview('biz-1');

    expect(overview.currency).toBe('AMD');
    expect(overview.revenueThisMonth).toBe(20000);
  });
});
