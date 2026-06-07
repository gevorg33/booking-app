import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { ClinicLabSyncObservationService } from './clinic-lab-sync-observation.service.js';
import { CLINIC_LAB_SYNC_INGEST_PAYLOADS } from './clinic-lis.fixtures.js';

describe('ClinicLabSyncObservationService (integration)', () => {
  let savedRequest: Record<string, unknown> = {
    id: 'obs-req-1',
    businessId: 'biz-1',
    status: 'Unlinked',
    testName: 'Complete blood count',
    universalCode: 'CBC',
    patientFirstName: 'Jane',
    patientLastName: 'Doe',
    patientDateOfBirth: null,
    patientExternalId: 'MRN-1001',
    systemReceivedOn: new Date('2026-06-07T10:00:00.000Z'),
    integrationVendorCode: 'GENERIC-LIS',
    clinicTestResultId: null,
    linkMethod: null,
    observations: [
      {
        id: 'obs-res-1',
        universalCode: 'WBC',
        resultValue: '12.5',
        abnormalFlags: 'H',
        labComment: null,
      },
    ],
  };

  const requestRepo = {
    find: jest.fn(async () => []),
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => {
      savedRequest = { ...savedRequest, ...value };
      return savedRequest;
    }),
  };
  const resultRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
  const labInfoRepo = { findOne: jest.fn(async () => null) };
  const clinicTestResultRepo = {
    findOne: jest.fn(async () => ({
      id: 'result-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      measurements: [
        {
          id: 'measurement-1',
          testType: { code: 'WBC' },
          value: null,
          labComment: null,
          measurementFlag: null,
        },
      ],
    })),
  };
  const measurementRepo = {
    save: jest.fn(async (value) => value),
  };
  const employeeRepo = {
    findOne: jest.fn(async () => ({ id: 'emp-1' })),
  };
  const businessService = {
    ensureMember: jest.fn(async () => ({ role: MemberRole.MANAGER })),
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    })),
  };

  const service = new ClinicLabSyncObservationService(
    requestRepo as never,
    resultRepo as never,
    labInfoRepo as never,
    clinicTestResultRepo as never,
    measurementRepo as never,
    employeeRepo as never,
    businessService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    savedRequest = {
      id: 'obs-req-1',
      businessId: 'biz-1',
      status: 'Unlinked',
      testName: 'Complete blood count',
      universalCode: 'CBC',
      patientFirstName: 'Jane',
      patientLastName: 'Doe',
      patientDateOfBirth: null,
      patientExternalId: 'MRN-1001',
      systemReceivedOn: new Date('2026-06-07T10:00:00.000Z'),
      integrationVendorCode: 'GENERIC-LIS',
      clinicTestResultId: null,
      linkMethod: null,
      observations: [
        {
          id: 'obs-res-1',
          universalCode: 'WBC',
          resultValue: '12.5',
          abnormalFlags: 'H',
          labComment: null,
        },
      ],
    };
    businessService.ensureMember.mockResolvedValue({
      role: MemberRole.MANAGER,
    });
    requestRepo.findOne.mockImplementation(async () => savedRequest as never);
  });

  it.each(CLINIC_LAB_SYNC_INGEST_PAYLOADS)(
    'ingests adapted observation request $id',
    async ({ dto }) => {
      const result = await service.ingestObservationRequest(
        'biz-1',
        'user-1',
        dto,
      );

      expect(result.status).toBe('Unlinked');
      expect(result.universalCode).toBe('CBC');
      expect(resultRepo.save).toHaveBeenCalled();
    },
  );

  it('links unlinked observation requests to clinic test results', async () => {
    const linked = await service.linkObservationRequestToResult(
      'biz-1',
      'user-1',
      'obs-req-1',
      { clinicTestResultId: 'result-1' },
    );

    expect(linked.status).toBe('Linked');
    expect(linked.clinicTestResultId).toBe('result-1');
    expect(measurementRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ value: '12.5' }),
    );
  });

  it('rejects linking already linked requests', async () => {
    requestRepo.findOne.mockResolvedValueOnce({
      id: 'obs-req-1',
      businessId: 'biz-1',
      status: 'Linked',
      observations: [],
    });

    await expect(
      service.linkObservationRequestToResult('biz-1', 'user-1', 'obs-req-1', {
        clinicTestResultId: 'result-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks ingest for non-lab-ops staff', async () => {
    businessService.ensureMember.mockResolvedValueOnce({
      role: MemberRole.STAFF,
    });
    await expect(
      service.ingestObservationRequest(
        'biz-1',
        'user-1',
        CLINIC_LAB_SYNC_INGEST_PAYLOADS[0].dto,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires an existing test result to link', async () => {
    clinicTestResultRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      service.linkObservationRequestToResult('biz-1', 'user-1', 'obs-req-1', {
        clinicTestResultId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists observation requests by status', async () => {
    requestRepo.find.mockResolvedValueOnce([savedRequest]);
    const listed = await service.listObservationRequests('biz-1', 'user-1', {
      status: 'Unlinked',
    });
    expect(listed).toHaveLength(1);
  });

  it('rejects linking when test result has no measurements', async () => {
    clinicTestResultRepo.findOne.mockResolvedValueOnce({
      id: 'result-1',
      businessId: 'biz-1',
      measurements: [],
    });
    await expect(
      service.linkObservationRequestToResult('biz-1', 'user-1', 'obs-req-1', {
        clinicTestResultId: 'result-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
