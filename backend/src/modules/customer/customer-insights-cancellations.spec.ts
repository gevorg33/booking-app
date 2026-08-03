import { BookingStatus } from '../booking/entities/booking.entity.js';
import { CustomerService } from './customer.service.js';

describe('CustomerService.getCustomerInsights totalCancellations (e2e-bug.155)', () => {
  function buildService(enrichedStats: Array<{
    cancelled: number;
    noShows: number;
    completed?: number;
  }>) {
    const customers = enrichedStats.map((_, i) => ({
      id: `c${i + 1}`,
      name: `Customer ${i + 1}`,
      isActive: true,
      businessId: 'biz-1',
    }));

    const customerRepo = {
      find: jest.fn(async () => customers),
    };
    const bookingRepo = {
      createQueryBuilder: jest.fn(() => {
        const statusRows = enrichedStats.flatMap((s, i) => {
          const rows: Array<{
            customerId: string;
            status: string;
            count: string;
            lastStart: string;
          }> = [];
          if (s.cancelled > 0) {
            rows.push({
              customerId: `c${i + 1}`,
              status: BookingStatus.CANCELLED,
              count: String(s.cancelled),
              lastStart: '2026-07-01T10:00:00.000Z',
            });
          }
          if (s.noShows > 0) {
            rows.push({
              customerId: `c${i + 1}`,
              status: BookingStatus.NO_SHOW,
              count: String(s.noShows),
              lastStart: '2026-07-01T10:00:00.000Z',
            });
          }
          if (s.completed) {
            rows.push({
              customerId: `c${i + 1}`,
              status: BookingStatus.COMPLETED,
              count: String(s.completed),
              lastStart: '2026-07-01T10:00:00.000Z',
            });
          }
          return rows;
        });

        return {
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          addGroupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          innerJoin: jest.fn().mockReturnThis(),
          getRawMany: jest
            .fn()
            .mockResolvedValueOnce(statusRows)
            .mockResolvedValueOnce([]),
        };
      }),
    };

    return new CustomerService(
      customerRepo as any,
      bookingRepo as any,
      { emit: jest.fn() } as any,
    );
  }

  it('aggregates totalCancellations alongside totalNoShows', async () => {
    const service = buildService([
      { cancelled: 10, noShows: 1 },
      { cancelled: 5, noShows: 0 },
      { cancelled: 0, noShows: 2 },
    ]);

    const result = await service.getCustomerInsights('biz-1', 'overview', 5);

    expect(result.summary.totalCustomers).toBe(3);
    expect(result.summary.totalNoShows).toBe(3);
    expect(result.summary.totalCancellations).toBe(15);
    expect(result.summary).not.toMatchObject({
      totalCancellations: undefined,
    });
  });

  it('most_cancellations ranking still works and summary includes total', async () => {
    const service = buildService([
      { cancelled: 8, noShows: 0 },
      { cancelled: 3, noShows: 0 },
    ]);

    const result = await service.getCustomerInsights(
      'biz-1',
      'most_cancellations',
      5,
    );

    expect(result.summary.totalCancellations).toBe(11);
    expect(result.rows[0]?.name).toBe('Customer 1');
    expect(result.rows[0]?.stats.byStatus[BookingStatus.CANCELLED]).toBe(8);
  });
});

describe('CustomerService.getCustomerInsights retention rate (e2e-bug.137)', () => {
  function buildService(
    completedCounts: number[],
  ) {
    const customers = completedCounts.map((_, i) => ({
      id: `c${i + 1}`,
      name: `Customer ${i + 1}`,
      isActive: true,
      businessId: 'biz-1',
    }));

    const customerRepo = {
      find: jest.fn(async () => customers),
    };
    const bookingRepo = {
      createQueryBuilder: jest.fn(() => {
        const statusRows = completedCounts.flatMap((count, i) =>
          count > 0
            ? [
                {
                  customerId: `c${i + 1}`,
                  status: BookingStatus.COMPLETED,
                  count: String(count),
                  lastStart: '2026-07-01T10:00:00.000Z',
                },
              ]
            : [],
        );
        return {
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          addGroupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          innerJoin: jest.fn().mockReturnThis(),
          getRawMany: jest
            .fn()
            .mockResolvedValueOnce(statusRows)
            .mockResolvedValueOnce([]),
        };
      }),
    };

    return new CustomerService(
      customerRepo as any,
      bookingRepo as any,
      { emit: jest.fn() } as any,
    );
  }

  it('computes retention rate from repeat-visit counts', async () => {
    // 4 customers with 1+ completed visit; 2 of them (counts 2, 3) came back.
    const service = buildService([1, 2, 3, 0]);
    const result = await service.getCustomerInsights('biz-1', 'retention', 5);

    expect(result.summary.customersWithCompletedVisitCount).toBe(3);
    expect(result.summary.returningCustomerCount).toBe(2);
    expect(result.summary.retentionRatePercent).toBe(67);
    expect(result.rows).toEqual([]);
  });

  it('returns null retention rate when nobody has a completed visit', async () => {
    const service = buildService([0, 0]);
    const result = await service.getCustomerInsights('biz-1', 'retention', 5);

    expect(result.summary.customersWithCompletedVisitCount).toBe(0);
    expect(result.summary.returningCustomerCount).toBe(0);
    expect(result.summary.retentionRatePercent).toBeNull();
  });

  it('reports 100% when every visited customer returned', async () => {
    const service = buildService([2, 3, 5]);
    const result = await service.getCustomerInsights('biz-1', 'retention', 5);

    expect(result.summary.retentionRatePercent).toBe(100);
  });
});
