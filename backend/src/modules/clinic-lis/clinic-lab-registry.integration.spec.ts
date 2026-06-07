import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { ClinicLabRegistryService } from './clinic-lab-registry.service.js';
import {
  CLINIC_LAB_INFO_CREATE_PAYLOADS,
  CLINIC_LAB_INFO_FIXTURES,
  CLINIC_LAB_MACHINE_FIXTURES,
} from './clinic-lis.fixtures.js';

describe('ClinicLabRegistryService (integration)', () => {
  const labInfoRepo = {
    find: jest.fn(async () => [...CLINIC_LAB_INFO_FIXTURES]),
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      ...CLINIC_LAB_INFO_FIXTURES[0],
      ...value,
      id: value.id ?? 'lab-info-new',
    })),
  };
  const labMachineRepo = {
    find: jest.fn(async () => [...CLINIC_LAB_MACHINE_FIXTURES]),
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      ...CLINIC_LAB_MACHINE_FIXTURES[0],
      ...value,
      id: value.id ?? 'lab-machine-new',
    })),
  };
  const specimenRepo = {
    findOne: jest.fn(async () => ({
      id: 'specimen-1',
      businessId: 'biz-1',
      labMachineId: null,
    })),
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

  const service = new ClinicLabRegistryService(
    labInfoRepo as never,
    labMachineRepo as never,
    specimenRepo as never,
    employeeRepo as never,
    businessService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({
      role: MemberRole.MANAGER,
    });
    labInfoRepo.findOne.mockResolvedValue(null);
    labMachineRepo.findOne.mockResolvedValue(CLINIC_LAB_MACHINE_FIXTURES[0]);
  });

  it.each(CLINIC_LAB_INFO_CREATE_PAYLOADS)(
    'creates lab registry entry $id',
    async ({ dto }) => {
      const result = await service.createLabInfo('biz-1', 'user-1', dto);

      expect(result.name).toBe(dto.name);
      expect(labInfoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'biz-1',
          labLocation: dto.labLocation,
        }),
      );
    },
  );

  it('lists external lab options only', async () => {
    const result = await service.listExternalLabs('biz-1', 'user-1');
    expect(result).toEqual([
      { id: 'lab-info-2', title: 'Regional reference lab' },
    ]);
  });

  it('assigns and clears lab machines on specimens', async () => {
    const assigned = await service.assignLabMachineToSpecimen(
      'biz-1',
      'user-1',
      'specimen-1',
      { labMachineId: 'lab-machine-1' },
    );
    expect(assigned.labMachineId).toBe('lab-machine-1');

    labMachineRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      service.assignLabMachineToSpecimen('biz-1', 'user-1', 'specimen-1', {
        labMachineId: 'missing',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate internal lab registration', async () => {
    labInfoRepo.findOne.mockResolvedValueOnce(CLINIC_LAB_INFO_FIXTURES[0]);
    await expect(
      service.createLabInfo(
        'biz-1',
        'user-1',
        CLINIC_LAB_INFO_CREATE_PAYLOADS[0].dto,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks registry management for non-lab-ops staff', async () => {
    businessService.ensureMember.mockResolvedValueOnce({
      role: MemberRole.STAFF,
    });
    await expect(
      service.createLabInfo(
        'biz-1',
        'user-1',
        CLINIC_LAB_INFO_CREATE_PAYLOADS[0].dto,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects missing specimens for machine assignment', async () => {
    specimenRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      service.assignLabMachineToSpecimen('biz-1', 'user-1', 'missing', {
        labMachineId: 'lab-machine-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists labs and machines for lab ops', async () => {
    const labs = await service.listLabInfo('biz-1', 'user-1');
    const machines = await service.listLabMachines('biz-1', 'user-1');
    expect(labs).toHaveLength(2);
    expect(machines).toHaveLength(2);
  });

  it('creates and updates lab machines', async () => {
    labInfoRepo.findOne.mockResolvedValueOnce(CLINIC_LAB_INFO_FIXTURES[0]);
    const created = await service.createLabMachine('biz-1', 'user-1', {
      name: 'Analyzer B',
      labInfoId: 'lab-info-1',
    });
    expect(created.name).toBe('Analyzer B');

    labMachineRepo.findOne.mockResolvedValueOnce({
      ...CLINIC_LAB_MACHINE_FIXTURES[0],
    });
    const updated = await service.updateLabMachine(
      'biz-1',
      'user-1',
      'lab-machine-1',
      {
        name: 'Analyzer A2',
      },
    );
    expect(updated.name).toBe('Analyzer A2');
  });

  it('updates lab registry entries', async () => {
    labInfoRepo.findOne.mockResolvedValueOnce(CLINIC_LAB_INFO_FIXTURES[1]);
    const updated = await service.updateLabInfo(
      'biz-1',
      'user-1',
      'lab-info-2',
      {
        phone: '+15559998888',
        isActive: false,
      },
    );
    expect(updated.phone).toBe('+15559998888');
  });
});
