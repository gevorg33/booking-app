import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventType } from '../../../events/event-types.js';
import { ClinicTestResultStatusService } from './clinic-test-result-status.service.js';

describe('ClinicTestResultStatusService', () => {
  const resultRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (v) => v),
  };
  const historyRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
  };

  const businessService = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    })),
  };
  const clinicLabPhiService = {
    encryptStatusHistoryNoteForStorage: jest.fn(async (_b, note) => note),
    encryptTestResultForStorage: jest.fn(async (_b, result) => result),
    auditTestResultPhiWrite: jest.fn(async () => undefined),
  };
  const eventStore = {
    publish: jest.fn(async () => ({ id: 'evt-1' })),
  };

  const service = new ClinicTestResultStatusService(
    resultRepo as any,
    historyRepo as any,
    businessService as any,
    clinicLabPhiService as any,
    eventStore as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('transitions result to released and writes history', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      status: 'Reviewed',
    });

    const updated = await service.transitionResultStatus({
      businessId: 'biz-1',
      resultId: 'result-1',
      toStatus: 'Released',
      employeeId: 'emp-1',
    });

    expect(updated.status).toBe('Released');
    expect(updated.patientVisibility).toBe('New');
    expect(historyRepo.save).toHaveBeenCalled();
    expect(eventStore.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: EventType.TEST_RESULT_RELEASED,
        aggregateId: 'result-1',
      }),
    );
  });

  it('rejects invalid result transitions', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      status: 'Pending',
    });

    await expect(
      service.transitionResultStatus({
        businessId: 'biz-1',
        resultId: 'result-1',
        toStatus: 'Released',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when result missing', async () => {
    resultRepo.findOne.mockResolvedValue(null);
    await expect(
      service.transitionResultStatus({
        businessId: 'biz-1',
        resultId: 'missing',
        toStatus: 'Completed',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns same result when status unchanged', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      status: 'Completed',
    });

    const updated = await service.transitionResultStatus({
      businessId: 'biz-1',
      resultId: 'result-1',
      toStatus: 'Completed',
    });

    expect(updated.status).toBe('Completed');
    expect(historyRepo.save).not.toHaveBeenCalled();
  });

  it('marks completed and reviewed timestamps', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      status: 'Pending',
    });

    const completed = await service.transitionResultStatus({
      businessId: 'biz-1',
      resultId: 'result-1',
      toStatus: 'Completed',
    });
    expect(completed.completedAt).toBeInstanceOf(Date);

    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      status: 'Completed',
    });
    const reviewed = await service.transitionResultStatus({
      businessId: 'biz-1',
      resultId: 'result-1',
      toStatus: 'Reviewed',
    });
    expect(reviewed.reviewedAt).toBeInstanceOf(Date);
  });

  it('delegates result status transitions to auto-task sync', async () => {
    const clinicTaskAutoService = {
      handleResultStatusTransition: jest.fn(async () => undefined),
    };
    const serviceWithAuto = new ClinicTestResultStatusService(
      resultRepo as any,
      historyRepo as any,
      businessService as any,
      clinicLabPhiService as any,
      eventStore as any,
      clinicTaskAutoService as any,
    );

    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      status: 'Pending',
    });

    await serviceWithAuto.transitionResultStatus({
      businessId: 'biz-1',
      resultId: 'result-1',
      toStatus: 'Completed',
    });

    expect(
      clinicTaskAutoService.handleResultStatusTransition,
    ).toHaveBeenCalledWith('biz-1', 'result-1', 'Pending', 'Completed');
  });

  it('marks automatically reviewed timestamp', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      status: 'Completed',
    });

    const updated = await service.transitionResultStatus({
      businessId: 'biz-1',
      resultId: 'result-1',
      toStatus: 'AutomaticallyReviewed',
    });

    expect(updated.reviewedAt).toBeInstanceOf(Date);
  });

  it('stores review comment on reviewed transition', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      status: 'Completed',
    });

    const updated = await service.transitionResultStatus({
      businessId: 'biz-1',
      resultId: 'result-1',
      toStatus: 'Reviewed',
      note: 'Looks good',
      staff: { userId: 'user-1', role: 'manager' },
    });

    expect(updated.reviewComment).toBe('Looks good');
    expect(clinicLabPhiService.encryptTestResultForStorage).toHaveBeenCalled();
    expect(clinicLabPhiService.auditTestResultPhiWrite).toHaveBeenCalled();
  });

  it('stores release comment on released transition', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      status: 'Reviewed',
    });

    const updated = await service.transitionResultStatus({
      businessId: 'biz-1',
      resultId: 'result-1',
      toStatus: 'Released',
      note: 'Ready for patient',
    });

    expect(updated.releaseComment).toBe('Ready for patient');
  });
});
