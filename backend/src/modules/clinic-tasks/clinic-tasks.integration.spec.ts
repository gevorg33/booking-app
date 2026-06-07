import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import {
  CLINIC_TASK_CREATE_PAYLOADS,
  CLINIC_TASK_FIXTURES,
  FORBIDDEN_IVF_TASK_TYPE_SCENARIOS,
} from './clinic-task.fixtures.js';
import { ClinicTasksService } from './clinic-tasks.service.js';

describe('ClinicTasksService (integration)', () => {
  const taskRepo = {
    createQueryBuilder: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      ...CLINIC_TASK_FIXTURES[0],
      ...value,
      createdAt: CLINIC_TASK_FIXTURES[0].createdAt,
      updatedAt: CLINIC_TASK_FIXTURES[0].updatedAt,
    })),
    findOne: jest.fn(),
  };
  const employeeRepo = {
    findOne: jest.fn(async ({ where }: { where: { id?: string } }) =>
      where.id ? { id: where.id } : { id: 'emp-lab-1' },
    ),
  };
  const customerRepo = {
    findOne: jest.fn(async () => ({ id: 'cust-1' })),
  };
  const bookingRepo = {
    findOne: jest.fn(async () => ({ id: 'book-1' })),
  };
  const testOrderRepo = {
    findOne: jest.fn(async () => ({ id: 'order-1' })),
  };
  const testResultRepo = {
    findOne: jest.fn(async () => ({ id: 'result-1' })),
  };
  const specimenRepo = {
    findOne: jest.fn(async () => ({ id: 'spec-1' })),
  };
  const encounterRepo = {
    findOne: jest.fn(async () => ({ id: 'enc-1' })),
  };
  const businessService = {
    ensureMember: jest.fn(),
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'polyclinic' },
    })),
  };

  const service = new ClinicTasksService(
    taskRepo as never,
    employeeRepo as never,
    customerRepo as never,
    bookingRepo as never,
    testOrderRepo as never,
    testResultRepo as never,
    specimenRepo as never,
    encounterRepo as never,
    businessService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({
      role: MemberRole.MANAGER,
    });
    employeeRepo.findOne.mockImplementation(
      async ({ where }: { where: { id?: string; userId?: string } }) => {
        if (where.id) return { id: where.id };
        return { id: 'emp-lab-1' };
      },
    );
    customerRepo.findOne.mockResolvedValue({ id: 'cust-1' });
    bookingRepo.findOne.mockResolvedValue({ id: 'book-1' });
    testOrderRepo.findOne.mockResolvedValue({ id: 'order-1' });
    testResultRepo.findOne.mockResolvedValue({ id: 'result-1' });
    specimenRepo.findOne.mockResolvedValue({ id: 'spec-1' });
    encounterRepo.findOne.mockResolvedValue({ id: 'enc-1' });
  });

  it.each(CLINIC_TASK_CREATE_PAYLOADS)(
    'creates clinic task for payload $id',
    async ({ dto }) => {
      const result = await service.createClinicTask('biz-1', 'user-1', dto);

      expect(result.taskType).toBe(dto.taskType);
      expect(taskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'biz-1',
          taskType: dto.taskType,
          status: 'open',
        }),
      );
    },
  );

  it.each(FORBIDDEN_IVF_TASK_TYPE_SCENARIOS)(
    'rejects forbidden IVF task type $id',
    async ({ taskType }) => {
      await expect(
        service.createClinicTask('biz-1', 'user-1', {
          taskType: taskType as never,
          testResultId: 'result-1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it('rejects task creation for provider staff', async () => {
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });

    await expect(
      service.createClinicTask(
        'biz-1',
        'user-1',
        CLINIC_TASK_CREATE_PAYLOADS[0].dto,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists tasks with provider inbox filter', async () => {
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    employeeRepo.findOne.mockResolvedValue({ id: 'emp-provider-1' });

    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([[CLINIC_TASK_FIXTURES[0]], 1]),
    };
    taskRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.listClinicTasks('biz-1', 'user-1', {
      status: 'open',
      page: 1,
      pageSize: 20,
    });

    expect(result.totalItems).toBe(1);
    expect(result.items[0]?.taskType).toBe('ResultReview');
    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('returns a single task for authorized staff', async () => {
    taskRepo.findOne.mockResolvedValue(CLINIC_TASK_FIXTURES[0]);

    const result = await service.getClinicTask(
      'biz-1',
      'user-1',
      CLINIC_TASK_FIXTURES[0].id,
    );

    expect(result.id).toBe('task-result-1');
  });

  it('blocks providers from tasks assigned to other employees', async () => {
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    employeeRepo.findOne.mockResolvedValue({ id: 'emp-provider-2' });
    taskRepo.findOne.mockResolvedValue(CLINIC_TASK_FIXTURES[0]);

    await expect(
      service.getClinicTask('biz-1', 'user-1', CLINIC_TASK_FIXTURES[0].id),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assigns a task and moves it to in_progress', async () => {
    taskRepo.findOne.mockResolvedValue({
      ...CLINIC_TASK_FIXTURES[2],
      status: 'open',
    });

    const result = await service.assignClinicTask(
      'biz-1',
      'user-1',
      'task-callback-1',
      {
        assigneeEmployeeId: 'emp-provider-1',
      },
    );

    expect(result.assigneeEmployeeId).toBe('emp-provider-1');
    expect(taskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        assigneeEmployeeId: 'emp-provider-1',
        status: 'in_progress',
      }),
    );
  });

  it('completes an assigned task for the assignee', async () => {
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    employeeRepo.findOne.mockResolvedValue({ id: 'emp-provider-1' });
    taskRepo.findOne.mockResolvedValue({
      ...CLINIC_TASK_FIXTURES[0],
      status: 'in_progress',
    });

    const result = await service.completeClinicTask(
      'biz-1',
      'user-1',
      CLINIC_TASK_FIXTURES[0].id,
      { notes: 'Reviewed and filed' },
    );

    expect(result.status).toBe('completed');
    expect(taskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        notes: 'Reviewed and filed',
        completedByEmployeeId: 'emp-provider-1',
      }),
    );
  });

  it('cancels open tasks for lab ops', async () => {
    taskRepo.findOne.mockResolvedValue({
      ...CLINIC_TASK_FIXTURES[0],
      status: 'open',
    });

    const result = await service.cancelClinicTask(
      'biz-1',
      'user-1',
      CLINIC_TASK_FIXTURES[0].id,
    );

    expect(result.status).toBe('cancelled');
  });

  it('throws when clinic task is missing', async () => {
    taskRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getClinicTask('biz-1', 'user-1', 'missing-task'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('validates link requirements on create', async () => {
    await expect(
      service.createClinicTask('biz-1', 'user-1', {
        taskType: 'PatientCallback',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows receptionists to create callback tasks', async () => {
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    employeeRepo.findOne.mockResolvedValue(null);

    await service.createClinicTask(
      'biz-1',
      'user-1',
      CLINIC_TASK_CREATE_PAYLOADS[2].dto,
    );

    expect(taskRepo.save).toHaveBeenCalled();
  });

  it('updates task fields for lab ops', async () => {
    taskRepo.findOne.mockResolvedValue({ ...CLINIC_TASK_FIXTURES[0] });

    const result = await service.updateClinicTask(
      'biz-1',
      'user-1',
      'task-result-1',
      {
        title: 'Updated review title',
        priority: 'normal',
      },
    );

    expect(result.title).toBe('Updated review title');
    expect(taskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated review title',
        priority: 'normal',
      }),
    );
  });

  it('rejects invalid due dates', async () => {
    await expect(
      service.createClinicTask('biz-1', 'user-1', {
        ...CLINIC_TASK_CREATE_PAYLOADS[0].dto,
        dueAt: 'not-a-date',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing linked records', async () => {
    customerRepo.findOne.mockResolvedValue(null);

    await expect(
      service.createClinicTask(
        'biz-1',
        'user-1',
        CLINIC_TASK_CREATE_PAYLOADS[2].dto,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects provider status changes', async () => {
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    employeeRepo.findOne.mockResolvedValue({ id: 'emp-provider-1' });
    taskRepo.findOne.mockResolvedValue({ ...CLINIC_TASK_FIXTURES[0] });

    await expect(
      service.updateClinicTask('biz-1', 'user-1', 'task-result-1', {
        status: 'cancelled',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
