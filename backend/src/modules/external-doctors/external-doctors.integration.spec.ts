import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { ExternalDoctorsService } from './external-doctors.service.js';
import {
  EXTERNAL_DOCTOR_CREATE_PAYLOAD,
  EXTERNAL_DOCTOR_FIXTURES,
} from './external-doctors.fixtures.js';

describe('ExternalDoctorsService (integration)', () => {
  const doctorRepo = {
    createQueryBuilder: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      ...EXTERNAL_DOCTOR_FIXTURES[0],
      ...value,
      createdAt: EXTERNAL_DOCTOR_FIXTURES[0].createdAt,
      updatedAt: EXTERNAL_DOCTOR_FIXTURES[0].updatedAt,
    })),
    findOne: jest.fn(),
  };
  const employeeRepo = {
    findOne: jest.fn(async () => ({ id: 'emp-1' })),
  };
  const businessService = {
    ensureMember: jest.fn(),
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'polyclinic' },
    })),
  };

  const service = new ExternalDoctorsService(
    doctorRepo as never,
    employeeRepo as never,
    businessService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({
      role: MemberRole.MANAGER,
    });
  });

  it('creates an external doctor for lab ops staff', async () => {
    const result = await service.createExternalDoctor(
      'biz-1',
      'user-1',
      EXTERNAL_DOCTOR_CREATE_PAYLOAD,
    );

    expect(result.name).toBe('Dr Jane Referrer');
    expect(doctorRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        name: 'Dr Jane Referrer',
        street: '100 King St W',
        faxNumber: '416-555-0100',
        createdByEmployeeId: 'emp-1',
      }),
    );
  });

  it('rejects registry management for non-lab-ops staff', async () => {
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });

    await expect(
      service.createExternalDoctor(
        'biz-1',
        'user-1',
        EXTERNAL_DOCTOR_CREATE_PAYLOAD,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists doctors with search and pagination', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([[EXTERNAL_DOCTOR_FIXTURES[0]], 1]),
    };
    doctorRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.listExternalDoctors('biz-1', 'user-1', {
      q: 'City',
      page: 1,
      pageSize: 20,
    });

    expect(result.totalItems).toBe(1);
    expect(result.items[0]?.name).toBe('Dr Jane Referrer');
    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('resolves active referring doctors for patient profiles', async () => {
    doctorRepo.findOne.mockResolvedValue(EXTERNAL_DOCTOR_FIXTURES[0]);

    const summary = await service.resolveActiveReferringDoctor(
      'biz-1',
      'doc-1',
    );

    expect(summary?.name).toBe('Dr Jane Referrer');
  });

  it('throws when referring doctor is missing or inactive', async () => {
    doctorRepo.findOne.mockResolvedValue(null);

    await expect(
      service.resolveActiveReferringDoctor('biz-1', 'doc-missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates an existing doctor record', async () => {
    doctorRepo.findOne.mockResolvedValue({ ...EXTERNAL_DOCTOR_FIXTURES[0] });

    const result = await service.updateExternalDoctor(
      'biz-1',
      'user-1',
      'doc-1',
      {
        clinicName: 'Updated Clinic',
        isActive: false,
      },
    );

    expect(result.clinicName).toBe('Updated Clinic');
    expect(doctorRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicName: 'Updated Clinic',
        isActive: false,
        updatedByEmployeeId: 'emp-1',
      }),
    );
  });

  it('returns a single doctor by id', async () => {
    doctorRepo.findOne.mockResolvedValue(EXTERNAL_DOCTOR_FIXTURES[0]);

    const result = await service.getExternalDoctor('biz-1', 'user-1', 'doc-1');

    expect(result.id).toBe('doc-1');
  });

  it('lists inactive doctors when activeOnly is false', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([[EXTERNAL_DOCTOR_FIXTURES[0]], 1]),
    };
    doctorRepo.createQueryBuilder.mockReturnValue(qb);

    await service.listExternalDoctors('biz-1', 'user-1', {
      activeOnly: false,
    });

    expect(qb.andWhere).not.toHaveBeenCalledWith(
      'doctor.isActive = :isActive',
      expect.anything(),
    );
  });

  it('throws when doctor lookup fails', async () => {
    doctorRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getExternalDoctor('biz-1', 'user-1', 'doc-missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns null when referring doctor id is blank', async () => {
    await expect(
      service.resolveActiveReferringDoctor('biz-1', '   '),
    ).resolves.toBeNull();
    expect(doctorRepo.findOne).not.toHaveBeenCalled();
  });

  it('updates nested address fields', async () => {
    doctorRepo.findOne.mockResolvedValue({ ...EXTERNAL_DOCTOR_FIXTURES[0] });

    await service.updateExternalDoctor('biz-1', 'user-1', 'doc-1', {
      address: {
        street: '200 Queen St',
        unit: null,
        city: 'Toronto',
        province: 'ON',
        country: 'Canada',
        postalCode: 'M5H 2N2',
      },
    });

    expect(doctorRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        street: '200 Queen St',
        unit: null,
        postalCode: 'M5H 2N2',
      }),
    );
  });

  it('throws when updating a missing doctor', async () => {
    doctorRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateExternalDoctor('biz-1', 'user-1', 'doc-missing', {
        name: 'Missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
