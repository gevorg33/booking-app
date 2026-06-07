import { ForbiddenException } from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { PatientClinicalProfilesService } from './patient-clinical-profiles.service.js';

describe('PatientClinicalProfilesService', () => {
  const profileRepo = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      ...value,
      id: value.id ?? 'profile-1',
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-02T10:00:00.000Z'),
    })),
  };
  const businessService = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    })),
  };
  const accessService = {
    toPhiStaffContext: jest.fn((ctx) => ({
      userId: ctx.userId,
      role: String(ctx.membershipRole),
      employeeId: ctx.employeeId,
    })),
  };
  const phiService = {
    decryptProfileForStaff: jest.fn(async (_b, profile) => profile),
    encryptProfileForStorage: jest.fn(async (_b, profile) => profile),
    auditProfilePhiWrite: jest.fn(async () => undefined),
  };
  const externalDoctorsService = {
    resolveActiveReferringDoctor: jest.fn(async () => null),
  };

  const service = new PatientClinicalProfilesService(
    profileRepo as any,
    businessService as any,
    accessService as any,
    phiService as any,
    externalDoctorsService as any,
  );

  const managerAccess = {
    ctx: {
      userId: 'user-manager',
      membershipRole: MemberRole.MANAGER,
      employeeId: 'emp-manager',
    },
    phiAccess: { hasAssignedBooking: false },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    });
  });

  it('returns empty profile view when none exists', async () => {
    profileRepo.findOne.mockResolvedValue(null);
    const view = await service.getProfileForCustomer(
      'biz-1',
      'cust-1',
      managerAccess,
    );
    expect(view.customerId).toBe('cust-1');
    expect(view.id).toBe('');
    expect(view.allergies).toBeNull();
  });

  it('returns stored profile view', async () => {
    profileRepo.findOne.mockResolvedValue({
      id: 'profile-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      allergies: 'Penicillin',
      chronicProblems: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      emergencyContactRelationship: null,
      bloodType: 'O+',
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-02T10:00:00.000Z'),
    });
    phiService.decryptProfileForStaff.mockResolvedValue({
      id: 'profile-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      allergies: 'Penicillin',
      bloodType: 'O+',
    });

    const view = await service.getProfileForCustomer(
      'biz-1',
      'cust-1',
      managerAccess,
    );
    expect(view.allergies).toBe('Penicillin');
    expect(view.bloodType).toBe('O+');
  });

  it('creates profile on upsert', async () => {
    profileRepo.findOne.mockResolvedValue(null);

    const view = await service.upsertProfileForCustomer(
      'biz-1',
      'cust-1',
      managerAccess,
      {
        allergies: 'Penicillin',
        chronicProblems: 'Hypertension',
        bloodType: 'A+',
      },
    );

    expect(profileRepo.save).toHaveBeenCalled();
    expect(phiService.encryptProfileForStorage).toHaveBeenCalled();
    expect(phiService.auditProfilePhiWrite).toHaveBeenCalled();
    expect(view.allergies).toBe('Penicillin');
  });

  it('blocks non-clinic tenants', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });
    await expect(
      service.getProfileForCustomer('biz-1', 'cust-1', managerAccess),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('updates existing profile fields individually', async () => {
    profileRepo.findOne.mockResolvedValue({
      id: 'profile-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      allergies: 'old',
      chronicProblems: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      emergencyContactRelationship: null,
      bloodType: null,
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-01T10:00:00.000Z'),
    });
    phiService.decryptProfileForStaff.mockResolvedValue({
      id: 'profile-1',
      allergies: 'updated',
      emergencyContactName: 'Jane',
      emergencyContactPhone: '+1',
      emergencyContactRelationship: 'Spouse',
      chronicProblems: 'HTN',
      bloodType: 'B+',
    });

    await service.upsertProfileForCustomer('biz-1', 'cust-1', managerAccess, {
      allergies: 'updated',
      emergencyContactName: 'Jane',
      emergencyContactPhone: '+1',
      emergencyContactRelationship: 'Spouse',
      chronicProblems: 'HTN',
      bloodType: 'B+',
    });

    expect(profileRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        allergies: 'updated',
        emergencyContactName: 'Jane',
        emergencyContactPhone: '+1',
        emergencyContactRelationship: 'Spouse',
        chronicProblems: 'HTN',
        bloodType: 'B+',
      }),
    );
  });

  it('stores referring external doctor on profile upsert', async () => {
    profileRepo.findOne.mockResolvedValue(null);
    externalDoctorsService.resolveActiveReferringDoctor.mockResolvedValue({
      id: 'doc-1',
      name: 'Dr Jane Referrer',
      clinicName: 'City Family Medicine',
      address: 'Suite 5 100 King St W, Toronto, ON, M5X 1A9, Canada',
      fax: '416-555-0100',
    });

    await service.upsertProfileForCustomer('biz-1', 'cust-1', managerAccess, {
      referringExternalDoctorId: 'doc-1',
    });

    expect(
      externalDoctorsService.resolveActiveReferringDoctor,
    ).toHaveBeenCalledWith('biz-1', 'doc-1');
    expect(profileRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        referringExternalDoctorId: 'doc-1',
      }),
    );
  });

  it('blocks unassigned provider from updating profile', async () => {
    profileRepo.findOne.mockResolvedValue(null);
    await expect(
      service.upsertProfileForCustomer(
        'biz-1',
        'cust-1',
        {
          ctx: {
            userId: 'user-staff',
            membershipRole: MemberRole.STAFF,
            employeeId: 'emp-other',
          },
          phiAccess: { hasAssignedBooking: false },
        },
        { allergies: 'Penicillin' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
