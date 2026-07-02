import { ForbiddenException } from '@nestjs/common';
import { ProviderTimeOffService } from './provider-time-off.service.js';

describe('ProviderTimeOffService (prov-exp-7.2)', () => {
  const requestRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      ...value,
      id: value.id ?? 'req-1',
      createdAt: value.createdAt ?? new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: value.updatedAt ?? new Date('2026-06-01T10:00:00.000Z'),
      employee: value.employee ?? { name: 'Sam' },
    })),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };
  const businessService = {
    findOne: jest.fn(),
    ensureMember: jest.fn(),
  };
  const blockScheduleService = {
    create: jest.fn(),
  };

  let service: ProviderTimeOffService;

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { providerTimeOff: { enabled: true } },
    });
    businessService.ensureMember.mockResolvedValue({ role: 'manager' });
    requestRepo.findOne.mockResolvedValue({
      id: 'req-1',
      businessId: 'biz-1',
      employeeId: 'emp-1',
      requestedByUserId: 'user-1',
      startDate: '2026-08-20',
      endDate: '2026-08-20',
      dailyStartTime: '09:00',
      dailyEndTime: '17:00',
      reason: 'Doctor',
      status: 'pending',
      employee: { name: 'Sam' },
    });
    blockScheduleService.create.mockResolvedValue({ id: 'block-1' });

    service = new ProviderTimeOffService(
      requestRepo as any,
      businessService as any,
      blockScheduleService as any,
    );
  });

  it('creates pending request when feature enabled', async () => {
    const result = await service.createRequest('biz-1', 'user-1', 'emp-1', {
      startDate: '2026-08-20',
      endDate: '2026-08-20',
      dailyStartTime: '09:00',
      dailyEndTime: '17:00',
      reason: 'Doctor',
    });

    expect(requestRepo.save).toHaveBeenCalled();
    expect(result.status).toBe('pending');
    expect(result.employeeName).toBe('Sam');
  });

  it('rejects when feature disabled', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {},
    });

    await expect(
      service.createRequest('biz-1', 'user-1', 'emp-1', {
        startDate: '2026-08-10',
        endDate: '2026-08-10',
        dailyStartTime: '09:00',
        dailyEndTime: '17:00',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('approves pending request and creates schedule block', async () => {
    const result = await service.approveRequest('biz-1', 'mgr-1', 'req-1');

    expect(blockScheduleService.create).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        employeeId: 'emp-1',
        isRepetitive: false,
      }),
      'mgr-1',
    );
    expect(result.status).toBe('approved');
    expect(result.blockScheduleId).toBe('block-1');
  });

  it('denies pending request without creating block', async () => {
    const result = await service.denyRequest(
      'biz-1',
      'mgr-1',
      'req-1',
      'Busy week',
    );

    expect(blockScheduleService.create).not.toHaveBeenCalled();
    expect(result.status).toBe('denied');
    expect(result.reviewNotes).toBe('Busy week');
  });
});
