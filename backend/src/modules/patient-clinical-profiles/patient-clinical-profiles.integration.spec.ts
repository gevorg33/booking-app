import { ForbiddenException } from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
  isPhiEncryptedValue,
} from '../../common/utils/phi-encryption.util.js';
import { PhiAccessAuditService } from '../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../compliance/phi-field.service.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';
import { PatientClinicalProfilePhiService } from './shared/patient-clinical-profile-phi.service.js';
import { PatientClinicalProfilesService } from './patient-clinical-profiles.service.js';

describe('Patient clinical profiles (integration)', () => {
  const masterKey = 'test-master-key';
  const material = generateBusinessPhiEncryptionKeyMaterial(masterKey);
  const businessKey = deriveBusinessPhiEncryptionKey(
    'biz-1',
    material,
    masterKey,
  );

  const businessService = {
    ensureMember: jest.fn(),
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'clinic', hipaa: { enabled: true } },
    })),
  };
  const employeeRepo = {
    findOne: jest.fn(async () => ({ id: 'emp-provider', isActive: true })),
  };
  const customerRepo = {
    findOne: jest.fn(async () => ({ id: 'cust-1' })),
  };
  const bookingRepo = {
    find: jest.fn(async () => [
      { employeeId: 'emp-provider', linkedEmployeeIds: [] },
    ]),
  };
  const profileRepo = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      ...value,
      id: 'profile-1',
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-02T10:00:00.000Z'),
    })),
  };
  const auditRepo = {
    create: jest.fn((row) => row),
    save: jest.fn(async (row) => ({ ...row, id: 'log-1' })),
  };

  const phiFieldService = {
    isHipaaActiveForBusiness: jest.fn(() => true),
    resolveBusinessEncryptionKey: jest.fn(async () => businessKey),
  };
  const phiAccessAudit = new PhiAccessAuditService(auditRepo as never);
  const phiService = new PatientClinicalProfilePhiService(
    phiFieldService as unknown as PhiFieldService,
    phiAccessAudit,
  );
  const accessService = new PatientClinicalProfileAccessService(
    businessService as any,
    employeeRepo as any,
    customerRepo as any,
    bookingRepo as any,
  );
  const externalDoctorsService = {
    resolveActiveReferringDoctor: jest.fn(async () => null),
  };
  const profilesService = new PatientClinicalProfilesService(
    profileRepo as any,
    businessService as any,
    accessService,
    phiService,
    externalDoctorsService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
  });

  it('encrypts PHI at rest and decrypts for assigned provider with audit', async () => {
    profileRepo.findOne.mockResolvedValue(null);
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    const saved = await profilesService.upsertProfileForCustomer(
      'biz-1',
      'cust-1',
      access,
      {
        allergies: 'Penicillin',
        bloodType: 'O+',
      },
    );

    const storedAllergies = profileRepo.save.mock.calls[0]?.[0]?.allergies;
    expect(isPhiEncryptedValue(String(storedAllergies))).toBe(true);
    expect(saved.allergies).toBe('Penicillin');
    expect(auditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'write',
        resourceType: 'patient_clinical_profile',
      }),
    );

    profileRepo.findOne.mockResolvedValue(profileRepo.save.mock.calls[0]?.[0]);
    const view = await profilesService.getProfileForCustomer(
      'biz-1',
      'cust-1',
      access,
    );
    expect(view.allergies).toBe('Penicillin');
    expect(auditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'read',
        resourceType: 'patient_clinical_profile',
      }),
    );
  });

  it('blocks unassigned provider from chart access', async () => {
    bookingRepo.find.mockResolvedValue([]);
    await expect(
      accessService.assertCustomerClinicalProfileAccess(
        'biz-1',
        'user-1',
        'cust-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows manager to access profile without assigned booking', async () => {
    businessService.ensureMember.mockResolvedValue({
      role: MemberRole.MANAGER,
    });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-manager',
      isActive: true,
    });
    bookingRepo.find.mockResolvedValue([]);

    await expect(
      accessService.assertCustomerClinicalProfileAccess(
        'biz-1',
        'user-manager',
        'cust-1',
      ),
    ).resolves.toMatchObject({
      phiAccess: { hasAssignedBooking: false },
    });
  });
});
