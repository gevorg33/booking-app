import { MemberRole } from '../../business/entities/business-member.entity.js';
import { encryptPatientClinicalProfilePhi } from '../../../common/utils/patient-clinical-profile-phi.util.js';
import { isPhiEncryptedValue } from '../../../common/utils/phi-encryption.util.js';
import { PhiAccessAuditService } from '../../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../../compliance/phi-field.service.js';
import { PatientClinicalProfilePhiService } from './patient-clinical-profile-phi.service.js';

describe('PatientClinicalProfilePhiService', () => {
  const phiFieldService = {
    isHipaaActiveForBusiness: jest.fn(),
    resolveBusinessEncryptionKey: jest.fn(),
  };
  const phiAccessAudit = { logBatch: jest.fn() };

  const service = new PatientClinicalProfilePhiService(
    phiFieldService as unknown as PhiFieldService,
    phiAccessAudit as unknown as PhiAccessAuditService,
  );

  const hipaaBusiness = {
    id: 'biz-1',
    settings: { businessType: 'clinic', hipaa: { enabled: true } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    phiFieldService.isHipaaActiveForBusiness.mockReturnValue(true);
    phiFieldService.resolveBusinessEncryptionKey.mockResolvedValue(
      'business-key',
    );
  });

  it('encrypts profile fields when HIPAA is active', async () => {
    const encrypted = await service.encryptProfileForStorage(
      hipaaBusiness as any,
      {
        id: 'profile-1',
        businessId: 'biz-1',
        allergies: 'Penicillin',
      },
    );
    expect(isPhiEncryptedValue(String(encrypted.allergies))).toBe(true);
  });

  it('masks profile PHI when provider lacks assigned booking', async () => {
    const encrypted = encryptPatientClinicalProfilePhi(
      { allergies: 'Penicillin', bloodType: 'O+' },
      'business-key',
    );
    const decrypted = await service.decryptProfileForStaff(
      hipaaBusiness as any,
      { id: 'profile-1', businessId: 'biz-1', ...encrypted },
      { userId: 'user-1', role: MemberRole.STAFF, employeeId: 'emp-2' },
      { hasAssignedBooking: false },
    );
    expect(decrypted.allergies).toBeNull();
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();
  });

  it('audits reads and writes for authorized staff', async () => {
    const encrypted = encryptPatientClinicalProfilePhi(
      { allergies: 'Penicillin' },
      'business-key',
    );
    await service.decryptProfileForStaff(
      hipaaBusiness as any,
      { id: 'profile-1', businessId: 'biz-1', ...encrypted },
      { userId: 'user-1', role: MemberRole.MANAGER },
      { hasAssignedBooking: false },
    );
    expect(phiAccessAudit.logBatch).toHaveBeenCalledWith(
      expect.any(Object),
      'read',
      'patient_clinical_profile',
      'profile-1',
      ['allergies'],
    );

    await service.auditProfilePhiWrite(
      hipaaBusiness as any,
      { id: 'profile-1', businessId: 'biz-1', allergies: 'Updated' },
      { allergies: 'Old' },
      { userId: 'user-1', role: MemberRole.OWNER },
    );
    expect(phiAccessAudit.logBatch).toHaveBeenCalledWith(
      expect.any(Object),
      'write',
      'patient_clinical_profile',
      'profile-1',
      ['allergies'],
    );
  });

  it('passes through when encryption key is missing', async () => {
    phiFieldService.resolveBusinessEncryptionKey.mockResolvedValue(null);
    const plain = await service.encryptProfileForStorage(hipaaBusiness as any, {
      id: 'profile-1',
      businessId: 'biz-1',
      allergies: 'Plain',
    });
    expect(plain.allergies).toBe('Plain');
  });

  it('skips decrypt audit and write audit when HIPAA is inactive or unchanged', async () => {
    phiFieldService.isHipaaActiveForBusiness.mockReturnValue(false);
    const decrypted = await service.decryptProfileForStaff(
      hipaaBusiness as any,
      { id: 'profile-1', businessId: 'biz-1', allergies: 'Plain' },
      { userId: 'user-1', role: MemberRole.OWNER },
      { hasAssignedBooking: true },
    );
    expect(decrypted.allergies).toBe('Plain');
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();

    phiFieldService.isHipaaActiveForBusiness.mockReturnValue(true);
    await service.auditProfilePhiWrite(
      hipaaBusiness as any,
      { id: 'profile-1', businessId: 'biz-1', allergies: 'Same' },
      { allergies: 'Same' },
      { userId: 'user-1', role: MemberRole.OWNER },
    );
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();
  });

  it('skips read audit when profile has no PHI values', async () => {
    const decrypted = await service.decryptProfileForStaff(
      hipaaBusiness as any,
      { id: 'profile-1', businessId: 'biz-1' },
      { userId: 'user-1', role: MemberRole.OWNER },
      { hasAssignedBooking: false },
    );
    expect(decrypted.allergies).toBeUndefined();
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();
  });

  it('returns profile unchanged when decrypt key is missing', async () => {
    phiFieldService.resolveBusinessEncryptionKey.mockResolvedValue(null);
    const decrypted = await service.decryptProfileForStaff(
      hipaaBusiness as any,
      { id: 'profile-1', businessId: 'biz-1', allergies: 'Plain' },
      { userId: 'user-1', role: MemberRole.OWNER },
      { hasAssignedBooking: true },
    );
    expect(decrypted.allergies).toBe('Plain');
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();
  });
});
