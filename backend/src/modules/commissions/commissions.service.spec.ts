import { CommissionsService } from './commissions.service.js';
import { BookingStatus, PaymentStatus } from '../booking/entities/booking.entity.js';

describe('CommissionsService', () => {
  const ruleRepo = { find: jest.fn(), save: jest.fn(), update: jest.fn(), create: jest.fn() };
  const bookingRepo = { createQueryBuilder: jest.fn() };

  const service = new CommissionsService(ruleRepo as any, bookingRepo as any);

  beforeEach(() => {
    jest.clearAllMocks();
    ruleRepo.find.mockResolvedValue([
      { employeeId: 'e1', serviceId: 's1', type: 'percent', value: 10, isActive: true },
    ]);
    bookingRepo.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'b1',
          employeeId: 'e1',
          serviceId: 's1',
          startTime: new Date('2026-05-01T10:00:00Z'),
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          service: { name: 'Cut', price: 40 },
          employee: { name: 'Alex' },
        },
      ]),
    });
  });

  it('exports payout CSV with commission rows', async () => {
    const result = await service.exportPayoutCsv('biz-1', '2026-05-01', '2026-05-31');
    expect(result.rowCount).toBe(1);
    expect(result.content).toContain('employeeName');
    expect(result.content).toContain('Alex');
    expect(result.content).toContain('4.00');
    expect(result.filename).toContain('commission-payout');
  });

  it('lists active commission rules', async () => {
    ruleRepo.find.mockResolvedValue([{ id: 'r1' }]);
    await expect(service.list('biz-1')).resolves.toEqual([{ id: 'r1' }]);
  });

  it('creates commission rule with defaults', async () => {
    ruleRepo.create.mockImplementation((v) => v);
    ruleRepo.save.mockImplementation(async (v) => ({ id: 'r-new', ...v }));
    const created = await service.create('biz-1', { value: 12 });
    expect(created.type).toBe('percent');
    expect(created.value).toBe(12);
  });

  it('creates commission rule with employee and service scope', async () => {
    ruleRepo.create.mockImplementation((v) => v);
    ruleRepo.save.mockImplementation(async (v) => v);
    await service.create('biz-1', { employeeId: 'e1', serviceId: 's1', type: 'flat', value: 8 });
    expect(ruleRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: 'e1', serviceId: 's1', type: 'flat', value: 8 }),
    );
  });

  it('soft-deletes commission rule', async () => {
    await service.remove('r1', 'biz-1');
    expect(ruleRepo.update).toHaveBeenCalledWith({ id: 'r1', businessId: 'biz-1' }, { isActive: false });
  });

  it('filters payout export by location', async () => {
    const andWhere = jest.fn().mockReturnThis();
    bookingRepo.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere,
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
    await service.exportPayoutCsv('biz-1', '2026-05-01', '2026-05-31', 'loc-1');
    expect(andWhere).toHaveBeenCalledWith('b.location_id = :locationId', { locationId: 'loc-1' });
  });
});
