import { ClinicTaskAutoService } from './clinic-task-auto.service.js';

describe('ClinicTaskAutoService (integration)', () => {
  const taskRepo = {
    createQueryBuilder: jest.fn<unknown, unknown[]>(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      id: 'task-auto-1',
      ...value,
      createdAt: new Date('2026-06-23T10:00:00.000Z'),
      updatedAt: new Date('2026-06-23T10:00:00.000Z'),
    })),
  };
  const resultRepo = {
    findOne: jest.fn<Promise<unknown>, unknown[]>(),
    find: jest.fn(async () => []),
  };
  const specimenRepo = {
    findOne: jest.fn<Promise<unknown>, unknown[]>(),
    createQueryBuilder: jest.fn<unknown, unknown[]>(),
  };
  const orderRepo = {
    findOne: jest.fn<Promise<unknown>, unknown[]>(),
    createQueryBuilder: jest.fn<unknown, unknown[]>(),
  };
  const serviceRepo = {
    findOne: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'polyclinic' },
    })),
    find: jest.fn(async () => [
      { id: 'biz-1', settings: { businessType: 'polyclinic' } },
    ]),
  };

  const autoTaskService = new ClinicTaskAutoService(
    taskRepo as never,
    resultRepo as never,
    specimenRepo as never,
    orderRepo as never,
    serviceRepo as never,
    businessRepo as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    taskRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    });
  });

  it('creates an auto-managed result review task when result is completed', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'book-1',
      orderId: 'order-1',
      status: 'Completed',
      completedAt: new Date('2026-06-23T12:00:00.000Z'),
      testType: { title: 'CBC' },
      booking: { employeeId: 'emp-1' },
    });

    const task = await autoTaskService.syncResultReviewTaskForResult(
      'biz-1',
      'result-1',
    );

    expect(task?.taskType).toBe('ResultReview');
    expect(task?.isAutoManaged).toBe(true);
    expect(taskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        testResultId: 'result-1',
        assigneeEmployeeId: 'emp-1',
      }),
    );
  });

  it('does not duplicate open auto-managed result review tasks', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      status: 'Completed',
      completedAt: new Date('2026-06-23T12:00:00.000Z'),
    });
    taskRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest
        .fn()
        .mockResolvedValue({ id: 'task-existing', status: 'open' }),
    });

    const task = await autoTaskService.syncResultReviewTaskForResult(
      'biz-1',
      'result-1',
    );

    expect(task?.id).toBe('task-existing');
    expect(taskRepo.save).not.toHaveBeenCalled();
  });

  it('creates overdue specimen collection auto-tasks', async () => {
    specimenRepo.findOne.mockResolvedValue({
      id: 'spec-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'book-1',
      orderId: 'order-1',
      status: 'NotCollected',
      createdAt: new Date('2026-06-23T08:00:00.000Z'),
      order: {
        displayNames: 'Lipid panel',
        booking: {
          startTime: new Date('2026-06-23T08:00:00.000Z'),
          employeeId: 'emp-1',
        },
      },
    });

    const result = await autoTaskService.syncOverdueSpecimenCollectionTask(
      'biz-1',
      'spec-1',
      new Date('2026-06-23T08:20:00.000Z'),
    );

    expect(result.created).toBe(true);
    expect(result.task?.taskType).toBe('SpecimenCollection');
    expect(taskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        specimenId: 'spec-1',
        isAutoManaged: true,
        priority: 'high',
      }),
    );
  });

  it('completes auto-managed tasks when result leaves review queue', async () => {
    taskRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'task-1',
        status: 'open',
        isAutoManaged: true,
      }),
    });

    await autoTaskService.handleResultStatusTransition(
      'biz-1',
      'result-1',
      'Completed',
      'Reviewed',
    );

    expect(taskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed' }),
    );
  });

  it('syncs auto tasks across clinic businesses', async () => {
    resultRepo.find.mockResolvedValue([{ id: 'result-1' }]);
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      status: 'Completed',
      completedAt: new Date('2026-06-23T12:00:00.000Z'),
    });
    specimenRepo.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
    orderRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    const created = await autoTaskService.syncAllClinicBusinessAutoTasks();

    expect(created).toBe(1);
  });

  it('cancels auto-managed review tasks when results are rejected', async () => {
    taskRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'task-1',
        status: 'open',
        isAutoManaged: true,
      }),
    });

    await autoTaskService.handleResultStatusTransition(
      'biz-1',
      'result-1',
      'Completed',
      'Rejected',
    );

    expect(taskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'cancelled' }),
    );
  });

  it('completes auto-managed specimen tasks when collection finishes', async () => {
    taskRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'task-1',
        status: 'open',
        isAutoManaged: true,
      }),
    });

    await autoTaskService.handleSpecimenStatusTransition(
      'biz-1',
      'spec-1',
      'NotCollected',
      'Collected',
    );

    expect(taskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed' }),
    );
  });

  it('returns a sync summary for a single business', async () => {
    resultRepo.find.mockResolvedValue([]);
    specimenRepo.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    orderRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    await expect(
      autoTaskService.syncAutoTasksForBusiness('biz-1'),
    ).resolves.toEqual({
      resultReviewTasksCreated: 0,
      specimenTasksCreated: 0,
      patientCallbackTasksCreated: 0,
    });
  });

  it('creates overdue lab booking request patient callback auto-tasks', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'visit-booking-1',
      displayNames: 'CBC, Lipid panel',
      status: 'NotCollected',
      bookingRequestPushedAt: new Date('2026-06-20T10:00:00.000Z'),
      collectionBookingId: null,
      collectionServiceId: 'svc-lab-draw',
      bookingRequestPushedByEmployeeId: 'emp-1',
      employeeId: 'emp-2',
    });
    serviceRepo.findOne.mockResolvedValue({
      id: 'svc-lab-draw',
      name: 'Lab blood draw',
    });

    const result =
      await autoTaskService.syncOverdueLabBookingRequestCallbackTask(
        'biz-1',
        'order-1',
        new Date('2026-06-23T10:00:00.000Z'),
      );

    expect(result.created).toBe(true);
    expect(result.task?.taskType).toBe('PatientCallback');
    expect(taskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        testOrderId: 'order-1',
        isAutoManaged: true,
        assigneeEmployeeId: 'emp-1',
        title: 'Follow up: CBC, Lipid panel collection not booked',
      }),
    );
  });

  it('does not duplicate open patient callback auto-tasks for the same order', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      status: 'NotCollected',
      bookingRequestPushedAt: new Date('2026-06-20T10:00:00.000Z'),
      collectionBookingId: null,
    });
    taskRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest
        .fn()
        .mockResolvedValue({ id: 'task-existing', status: 'open' }),
    });

    const result =
      await autoTaskService.syncOverdueLabBookingRequestCallbackTask(
        'biz-1',
        'order-1',
        new Date('2026-06-23T10:00:00.000Z'),
      );

    expect(result.task?.id).toBe('task-existing');
    expect(result.created).toBe(false);
    expect(taskRepo.save).not.toHaveBeenCalled();
  });

  it('completes patient callback auto-tasks when lab booking request is fulfilled', async () => {
    taskRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'task-1',
        status: 'open',
        isAutoManaged: true,
      }),
    });

    await autoTaskService.resolveLabBookingRequestCallbackTask(
      'biz-1',
      'order-1',
    );

    expect(taskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed' }),
    );
  });

  it('skips callback auto-task before the 3-day SLA', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      status: 'NotCollected',
      bookingRequestPushedAt: new Date('2026-06-22T10:00:00.000Z'),
      collectionBookingId: null,
    });

    const result =
      await autoTaskService.syncOverdueLabBookingRequestCallbackTask(
        'biz-1',
        'order-1',
        new Date('2026-06-23T09:00:00.000Z'),
      );

    expect(result.created).toBe(false);
    expect(taskRepo.save).not.toHaveBeenCalled();
  });
});
