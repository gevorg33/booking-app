import { Between } from 'typeorm';
import { BookingService } from './booking.service.js';

function createFindAllHarness() {
  const qb = {
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  qb.leftJoinAndSelect.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);

  const bookingRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    find: jest.fn().mockResolvedValue([]),
  };

  const service = new BookingService(
    bookingRepo as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  return { service, bookingRepo, qb };
}

describe('BookingService.findAll — calendar week range (vert-tour-1.10)', () => {
  const weekStart = '2026-06-09';
  const weekEnd = '2026-06-15';

  it('uses query builder with tour overlap SQL when startDate and endDate are provided', async () => {
    const { service, bookingRepo, qb } = createFindAllHarness();
    const expected = [{ id: 'tour-1' }];
    qb.getMany.mockResolvedValue(expected);

    const result = await service.findAll(
      'biz-1',
      undefined,
      'emp-1',
      false,
      weekStart,
      weekEnd,
    );

    expect(bookingRepo.createQueryBuilder).toHaveBeenCalledWith('booking');
    expect(bookingRepo.find).not.toHaveBeenCalled();
    expect(qb.leftJoinAndSelect).toHaveBeenCalledTimes(3);
    expect(qb.where).toHaveBeenCalledWith('booking.business_id = :businessId', {
      businessId: 'biz-1',
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'booking.hidden_from_calendar = false',
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'booking.employee_id = :employeeId',
      { employeeId: 'emp-1' },
    );

    const overlapCall = qb.andWhere.mock.calls.find(([sql]) =>
      String(sql).includes("metadata->>'tourStartDate'"),
    );
    expect(overlapCall?.[0]).toContain(
      'booking.start_time BETWEEN :weekStart AND :weekEnd',
    );
    expect(overlapCall?.[1]).toEqual({
      weekStart: new Date(`${weekStart}T00:00:00.000Z`),
      weekEnd: new Date(`${weekEnd}T23:59:59.999Z`),
      rangeStart: weekStart,
      rangeEnd: weekEnd,
    });
    expect(qb.orderBy).toHaveBeenCalledWith('booking.start_time', 'ASC');
    expect(result).toBe(expected);
  });

  it('includes hidden bookings when includeHidden is true', async () => {
    const { service, qb } = createFindAllHarness();

    await service.findAll(
      'biz-1',
      undefined,
      undefined,
      true,
      weekStart,
      weekEnd,
    );

    expect(
      qb.andWhere.mock.calls.some(([sql]) =>
        String(sql).includes('hidden_from_calendar'),
      ),
    ).toBe(false);
  });

  it('omits employee filter when employeeId is not provided', async () => {
    const { service, qb } = createFindAllHarness();

    await service.findAll(
      'biz-1',
      undefined,
      undefined,
      false,
      weekStart,
      weekEnd,
    );

    expect(
      qb.andWhere.mock.calls.some(([sql]) =>
        String(sql).includes('employee_id'),
      ),
    ).toBe(false);
  });

  it('falls back to repository find when only one range date is provided', async () => {
    const { service, bookingRepo } = createFindAllHarness();

    await service.findAll(
      'biz-1',
      undefined,
      'emp-1',
      false,
      weekStart,
      undefined,
    );

    expect(bookingRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(bookingRepo.find).toHaveBeenCalledWith({
      where: {
        businessId: 'biz-1',
        hiddenFromCalendar: false,
        employeeId: 'emp-1',
      },
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });
  });

  it('falls back to repository find when range dates are invalid', async () => {
    const { service, bookingRepo } = createFindAllHarness();

    await service.findAll(
      'biz-1',
      undefined,
      undefined,
      false,
      'not-a-date',
      weekEnd,
    );

    expect(bookingRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(bookingRepo.find).toHaveBeenCalled();
  });

  it('still supports single-day date filter via repository find', async () => {
    const { service, bookingRepo } = createFindAllHarness();
    const day = '2026-06-12';

    await service.findAll('biz-1', day, 'emp-2', false);

    expect(bookingRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(bookingRepo.find).toHaveBeenCalledWith({
      where: {
        businessId: 'biz-1',
        hiddenFromCalendar: false,
        employeeId: 'emp-2',
        startTime: Between(
          new Date(`${day}T00:00:00.000Z`),
          new Date(`${day}T23:59:59.999Z`),
        ),
      },
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });
  });
});
