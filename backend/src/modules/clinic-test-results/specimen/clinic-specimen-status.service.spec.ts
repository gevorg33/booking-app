import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ClinicSpecimenStatus } from '../../../common/utils/clinic-lab-state.util.js';
import { CLINIC_LAB_ALLOWED_SPECIMEN_TRANSITION_FIXTURES } from '../../../common/utils/clinic-lab-state.fixtures.js';
import { ClinicSpecimenStatusService } from './clinic-specimen-status.service.js';

describe('ClinicSpecimenStatusService', () => {
  const specimenRepo = {
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
  };

  const service = new ClinicSpecimenStatusService(
    specimenRepo as any,
    historyRepo as any,
    businessService as any,
    clinicLabPhiService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('transitions specimen using v1 short path and writes history', async () => {
    specimenRepo.findOne.mockResolvedValue({
      id: 'spec-1',
      businessId: 'biz-1',
      status: 'Collected',
    });

    const updated = await service.transitionSpecimenStatus({
      businessId: 'biz-1',
      specimenId: 'spec-1',
      toStatus: 'ReceivedInLab',
      employeeId: 'emp-1',
      note: 'Direct to lab',
      v1ShortPath: true,
    });

    expect(updated.status).toBe('ReceivedInLab');
    expect(updated.receivedInLabAt).toBeInstanceOf(Date);
    expect(historyRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        specimenId: 'spec-1',
        status: 'ReceivedInLab',
        previousStatus: 'Collected',
        employeeId: 'emp-1',
        note: 'Direct to lab',
      }),
    );
  });

  it('rejects invalid specimen transitions', async () => {
    specimenRepo.findOne.mockResolvedValue({
      id: 'spec-1',
      businessId: 'biz-1',
      status: 'NotCollected',
    });

    await expect(
      service.transitionSpecimenStatus({
        businessId: 'biz-1',
        specimenId: 'spec-1',
        toStatus: 'Completed',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(historyRepo.save).not.toHaveBeenCalled();
  });

  it('throws when specimen missing', async () => {
    specimenRepo.findOne.mockResolvedValue(null);
    await expect(
      service.transitionSpecimenStatus({
        businessId: 'biz-1',
        specimenId: 'missing',
        toStatus: 'Collected',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns same specimen when status unchanged', async () => {
    specimenRepo.findOne.mockResolvedValue({
      id: 'spec-1',
      businessId: 'biz-1',
      status: 'Collected',
    });

    const updated = await service.transitionSpecimenStatus({
      businessId: 'biz-1',
      specimenId: 'spec-1',
      toStatus: 'Collected',
    });

    expect(updated.status).toBe('Collected');
    expect(specimenRepo.save).not.toHaveBeenCalled();
    expect(historyRepo.save).not.toHaveBeenCalled();
  });

  it('marks collected and rejected timestamps', async () => {
    specimenRepo.findOne.mockResolvedValue({
      id: 'spec-1',
      businessId: 'biz-1',
      status: 'NotCollected',
    });

    const collected = await service.transitionSpecimenStatus({
      businessId: 'biz-1',
      specimenId: 'spec-1',
      toStatus: 'Collected',
      employeeId: 'emp-1',
    });
    expect(collected.collectedAt).toBeInstanceOf(Date);

    specimenRepo.findOne.mockResolvedValue({
      id: 'spec-1',
      businessId: 'biz-1',
      status: 'Collected',
    });
    const rejected = await service.transitionSpecimenStatus({
      businessId: 'biz-1',
      specimenId: 'spec-1',
      toStatus: 'Rejected',
    });
    expect(rejected.rejectedAt).toBeInstanceOf(Date);
  });

  it.each(
    CLINIC_LAB_ALLOWED_SPECIMEN_TRANSITION_FIXTURES.filter(
      (fixture) => !fixture.v1ShortPath,
    ),
  )('$id persists specimen status history', async ({ from, to }) => {
    specimenRepo.findOne.mockResolvedValue({
      id: 'spec-1',
      businessId: 'biz-1',
      status: from,
    });

    await service.transitionSpecimenStatus({
      businessId: 'biz-1',
      specimenId: 'spec-1',
      toStatus: to as ClinicSpecimenStatus,
      employeeId: 'emp-1',
    });

    expect(specimenRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: to }),
    );
    expect(historyRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        specimenId: 'spec-1',
        status: to,
        previousStatus: from,
      }),
    );
  });
});
