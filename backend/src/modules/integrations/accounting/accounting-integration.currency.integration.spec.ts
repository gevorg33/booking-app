import { AccountingIntegrationService } from './accounting-integration.service.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../../booking/entities/booking.entity.js';

describe('Sprint 28 — accounting export currency integration', () => {
  const businessRepo = { findOne: jest.fn() };
  const bookingRepo = { find: jest.fn() };
  const customerSubscriptionRepo = { find: jest.fn() };
  const commissionRepo = { find: jest.fn() };
  const expenseRepo = { createQueryBuilder: jest.fn() };
  const exportService = { buildExport: jest.fn() };

  const service = new AccountingIntegrationService(
    businessRepo as never,
    bookingRepo as never,
    expenseRepo as never,
    commissionRepo as never,
    customerSubscriptionRepo as never,
    exportService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    commissionRepo.find.mockResolvedValue([]);
    expenseRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
    exportService.buildExport.mockReturnValue({ rows: [] });
  });

  it.each([
    {
      id: 'business-amd-fallback',
      businessCurrency: 'AMD',
      serviceCurrency: null,
      subscriptionCurrency: null,
      expected: 'AMD',
    },
    {
      id: 'service-eur-preserved',
      businessCurrency: 'AMD',
      serviceCurrency: 'EUR',
      subscriptionCurrency: 'EUR',
      expected: 'EUR',
    },
    {
      id: 'invalid-row-fallback',
      businessCurrency: 'GEL',
      serviceCurrency: 'INVALID',
      subscriptionCurrency: 'BAD',
      expected: 'GEL',
    },
  ])(
    'export rows resolve currency for $id',
    async ({
      businessCurrency,
      serviceCurrency,
      subscriptionCurrency,
      expected,
    }) => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          currency: businessCurrency,
          integrations: { accounting: { enabled: true } },
        },
      });
      bookingRepo.find.mockResolvedValue([
        {
          id: 'b1',
          employeeId: 'e1',
          serviceId: 's1',
          startTime: new Date('2026-05-01T10:00:00Z'),
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          service: { name: 'Cut', price: 100, currency: serviceCurrency },
          customer: { name: 'Jane' },
          employee: { name: 'Alex' },
        },
      ]);
      customerSubscriptionRepo.find.mockResolvedValue([
        {
          id: 'sub-1',
          createdAt: new Date('2026-05-02T10:00:00Z'),
          pricePaid: 50,
          currency: subscriptionCurrency,
          plan: { name: 'Plan' },
          customer: { name: 'Sam' },
        },
      ]);

      await service.generateExport('biz-1');

      const rows = exportService.buildExport.mock.calls[0][1] as Array<{
        currency: string;
        incomeSubType?: string;
      }>;
      expect(rows.find((r) => r.incomeSubType === 'service')?.currency).toBe(
        expected,
      );
      expect(
        rows.find((r) => r.incomeSubType === 'subscription')?.currency,
      ).toBe(expected);
    },
  );
});
