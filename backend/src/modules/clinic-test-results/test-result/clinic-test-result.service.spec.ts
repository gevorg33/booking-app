import { ForbiddenException } from '@nestjs/common';
import { ClinicTestResultService } from './clinic-test-result.service.js';

describe('ClinicTestResultService', () => {
  const resultRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({
      ...v,
      id: v.id ?? 'result-1',
      createdAt: new Date(),
    })),
    createQueryBuilder: jest.fn(),
  };
  const resultHistoryRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
  };
  const measurementRepo = { find: jest.fn() };
  const orderRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const businessRepo = {
    findOne: jest.fn(),
  };
  const clinicLabPhiService = {
    encryptStatusHistoryNoteForStorage: jest.fn(async (_b, note) => note),
    decryptTestResultForStaff: jest.fn(async (_b, result) => result),
    decryptMeasurementForStaff: jest.fn(async (_b, measurement) => measurement),
    encryptMeasurementForStorage: jest.fn(
      async (_b, measurement) => measurement,
    ),
    auditMeasurementPhiWrite: jest.fn(async () => undefined),
  };
  const testTypeRepo = {
    find: jest.fn(async () => [
      {
        id: 'type-wbc',
        code: 'WBC',
        title: 'White blood cell count',
        isActive: true,
      },
    ]),
  };
  const clinicTestResultStatusService = {
    transitionResultStatus: jest.fn(async (_input) => ({
      id: 'result-1',
      status: 'Completed',
    })),
  };

  const service = new ClinicTestResultService(
    resultRepo as any,
    resultHistoryRepo as any,
    measurementRepo as any,
    orderRepo as any,
    businessRepo as any,
    testTypeRepo as any,
    clinicLabPhiService as any,
    clinicTestResultStatusService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    });
  });

  it('creates a result when missing for an order', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'booking-1',
      employeeId: 'emp-1',
      items: [{ testTypeId: 'type-1' }],
    });
    resultRepo.findOne.mockResolvedValue(null);

    const result = await service.ensureResultForOrder('order-1');

    expect(result?.status).toBe('NotReceived');
    expect(resultHistoryRepo.save).toHaveBeenCalled();
  });

  it('returns existing result for an order', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      businessId: 'biz-1',
      items: [],
    });
    resultRepo.findOne.mockResolvedValue({ id: 'result-existing' });

    await expect(service.ensureResultForOrder('order-1')).resolves.toEqual({
      id: 'result-existing',
    });
    expect(resultRepo.save).not.toHaveBeenCalled();
  });

  it('lists entry view results with default statuses', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'result-1',
          status: 'Pending',
          orderId: 'order-1',
          bookingId: 'booking-1',
          measurementFlag: null,
          completedAt: null,
          reviewedAt: null,
          releasedAt: null,
          createdAt: new Date('2026-06-01T10:00:00.000Z'),
          testType: { title: 'CBC' },
          order: {
            status: 'AwaitingResults',
            displayNames: 'CBC panel',
            booking: {
              startTime: new Date('2026-06-01T12:00:00.000Z'),
              customer: { name: 'Jane Doe' },
              employee: { name: 'Dr Smith' },
            },
            items: [
              { testType: { service: { category: { name: 'Laboratory' } } } },
            ],
          },
        },
      ]),
    };
    resultRepo.createQueryBuilder.mockReturnValue(qb);
    orderRepo.createQueryBuilder.mockReturnValue({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    const rows = await service.listResultQueue('biz-1', { view: 'entry' });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'result.status IN (:...statuses)',
      { statuses: ['NotReceived', 'Pending', 'WaitingCompletion'] },
    );
    expect(rows).toEqual([
      expect.objectContaining({
        id: 'result-1',
        customerName: 'Jane Doe',
        department: 'Laboratory',
      }),
    ]);
  });

  it('lists booking results with PHI when access is provided', async () => {
    orderRepo.createQueryBuilder.mockReturnValue({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
    resultRepo.find.mockResolvedValue([
      {
        id: 'result-1',
        businessId: 'biz-1',
        bookingId: 'booking-1',
        orderId: 'order-1',
        customerId: 'cust-1',
        status: 'Completed',
        testTypeId: 'type-1',
        measurementFlag: 'Normal',
        comment: 'phi:v1:abc',
        completedAt: new Date('2026-06-02T10:00:00.000Z'),
        reviewedAt: null,
        releasedAt: null,
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
        testType: { title: 'CBC' },
        order: { displayNames: 'CBC' },
      },
    ]);
    clinicLabPhiService.decryptTestResultForStaff.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      comment: 'Within range',
    });

    const rows = await service.listResultsForBooking('biz-1', 'booking-1', {
      ctx: {
        userId: 'user-1',
        membershipRole: 'manager',
        employeeId: 'emp-1',
      },
      bookingAccess: { employeeId: 'emp-1', linkedEmployeeIds: [] },
    });

    expect(rows[0]?.comment).toBe('Within range');
    expect(clinicLabPhiService.decryptTestResultForStaff).toHaveBeenCalled();
  });

  it('lists booking results', async () => {
    orderRepo.createQueryBuilder.mockReturnValue({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
    resultRepo.find.mockResolvedValue([
      {
        id: 'result-1',
        businessId: 'biz-1',
        bookingId: 'booking-1',
        orderId: 'order-1',
        customerId: 'cust-1',
        status: 'Completed',
        testTypeId: 'type-1',
        measurementFlag: 'Normal',
        completedAt: new Date('2026-06-02T10:00:00.000Z'),
        reviewedAt: null,
        releasedAt: null,
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
        testType: { title: 'CBC' },
        order: { displayNames: 'CBC' },
      },
    ]);

    const rows = await service.listResultsForBooking('biz-1', 'booking-1');

    expect(rows).toEqual([
      expect.objectContaining({
        id: 'result-1',
        testName: 'CBC',
        measurementFlag: 'Normal',
      }),
    ]);
  });

  it('lists review view results with default statuses', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    resultRepo.createQueryBuilder.mockReturnValue(qb);
    orderRepo.createQueryBuilder.mockReturnValue({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    await service.listResultQueue('biz-1', { view: 'review' });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'result.status IN (:...statuses)',
      { statuses: ['Completed'] },
    );
  });

  it('applies queue filters for release view and booking window', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    resultRepo.createQueryBuilder.mockReturnValue(qb);
    orderRepo.createQueryBuilder.mockReturnValue({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 'order-2' }]),
    });

    await service.listResultQueue('biz-1', {
      view: 'release',
      from: '2026-06-01',
      to: '2026-06-07',
      department: 'Laboratory',
      employeeId: 'emp-1',
    });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'result.status IN (:...statuses)',
      { statuses: ['Reviewed', 'AutomaticallyReviewed'] },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'booking.employeeId = :employeeId',
      {
        employeeId: 'emp-1',
      },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('booking.startTime >= :from', {
      from: '2026-06-01',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('booking.startTime <= :to', {
      to: '2026-06-07',
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'LOWER(category.name) = LOWER(:department)',
      {
        department: 'Laboratory',
      },
    );
  });

  it('backfills missing results for in-flight orders', async () => {
    orderRepo.createQueryBuilder.mockReturnValueOnce({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 'order-2' }]),
    });
    orderRepo.findOne.mockResolvedValue({
      id: 'order-2',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'booking-2',
      employeeId: null,
      items: [],
    });
    resultRepo.findOne.mockResolvedValue(null);
    resultRepo.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    await service.listResultQueue('biz-1', { view: 'entry' });

    expect(resultRepo.save).toHaveBeenCalled();
  });

  it('blocks non-clinic tenants', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });

    await expect(service.listResultQueue('biz-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
