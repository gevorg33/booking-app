import { MemberRole } from '../../business/entities/business-member.entity.js';
import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
} from '../../../common/utils/phi-encryption.util.js';
import { encryptPatientStaffNotePhi } from '../../../common/utils/patient-staff-note-phi.util.js';
import { PhiAccessAuditService } from '../../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../../compliance/phi-field.service.js';
import { PatientStaffNotePhiService } from './patient-staff-note-phi.service.js';

describe('PatientStaffNotePhiService', () => {
  const masterKey = 'test-master-key';
  const material = generateBusinessPhiEncryptionKeyMaterial(masterKey);
  const businessKey = deriveBusinessPhiEncryptionKey(
    'biz-1',
    material,
    masterKey,
  );

  const phiFieldService = {
    isHipaaActiveForBusiness: jest.fn(() => true),
    resolveBusinessEncryptionKey: jest.fn(async () => businessKey),
  };
  const phiAccessAudit = { logBatch: jest.fn() };

  const service = new PatientStaffNotePhiService(
    phiFieldService as unknown as PhiFieldService,
    phiAccessAudit as unknown as PhiAccessAuditService,
  );

  const hipaaBusiness = {
    id: 'biz-1',
    settings: { businessType: 'clinic', hipaa: { enabled: true } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('encrypts staff notes at rest', async () => {
    const encrypted = await service.encryptNoteForStorage(
      hipaaBusiness as any,
      {
        id: 'note-1',
        businessId: 'biz-1',
        body: 'Internal coordination note.',
      },
    );
    expect(String(encrypted.body)).toContain('phi:v1:');
  });

  it('decrypts staff notes with read audit', async () => {
    const encrypted = encryptPatientStaffNotePhi(
      { body: 'Internal coordination note.' },
      businessKey,
    );
    const decrypted = await service.decryptNoteForStaff(
      hipaaBusiness as any,
      { id: 'note-1', businessId: 'biz-1', ...encrypted },
      { userId: 'user-1', role: MemberRole.MANAGER },
      { hasAssignedBooking: false },
    );
    expect(decrypted.body).toBe('Internal coordination note.');
    expect(phiAccessAudit.logBatch).toHaveBeenCalledWith(
      expect.any(Object),
      'read',
      'patient_staff_note',
      'note-1',
      ['body'],
    );
  });

  it('masks staff notes when provider lacks staff-note access', async () => {
    const encrypted = encryptPatientStaffNotePhi(
      { body: 'Hidden note' },
      businessKey,
    );
    const decrypted = await service.decryptNoteForStaff(
      hipaaBusiness as any,
      { id: 'note-1', businessId: 'biz-1', ...encrypted },
      { userId: 'user-1', role: MemberRole.STAFF, employeeId: 'emp-2' },
      { hasAssignedBooking: false },
    );
    expect(decrypted.body).toBeNull();
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();
  });

  it('audits staff note writes', async () => {
    await service.auditNotePhiWrite(
      hipaaBusiness as any,
      { id: 'note-1', businessId: 'biz-1', body: 'New internal note.' },
      { userId: 'user-1', role: MemberRole.OWNER },
    );
    expect(phiAccessAudit.logBatch).toHaveBeenCalledWith(
      expect.any(Object),
      'write',
      'patient_staff_note',
      'note-1',
      ['body'],
    );
  });

  it('passes through when HIPAA is inactive or encryption key is missing', async () => {
    phiFieldService.isHipaaActiveForBusiness.mockReturnValue(false);
    const plain = await service.decryptNoteForStaff(
      { ...hipaaBusiness, settings: { businessType: 'clinic' } } as any,
      { id: 'note-1', businessId: 'biz-1', body: 'Plain note.' },
      { userId: 'user-1', role: MemberRole.STAFF, employeeId: 'emp-2' },
      { hasAssignedBooking: false },
    );
    expect(plain.body).toBe('Plain note.');
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();

    phiFieldService.isHipaaActiveForBusiness.mockReturnValue(true);
    phiFieldService.resolveBusinessEncryptionKey.mockResolvedValue(null);
    const unencrypted = await service.encryptNoteForStorage(
      hipaaBusiness as any,
      {
        id: 'note-2',
        businessId: 'biz-1',
        body: 'No key available.',
      },
    );
    expect(unencrypted.body).toBe('No key available.');

    phiFieldService.isHipaaActiveForBusiness.mockReturnValue(false);
    await service.auditNotePhiWrite(
      { ...hipaaBusiness, settings: { businessType: 'clinic' } } as any,
      { id: 'note-3', businessId: 'biz-1', body: 'Skip audit.' },
      { userId: 'user-1', role: MemberRole.OWNER },
    );
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();
  });
});
