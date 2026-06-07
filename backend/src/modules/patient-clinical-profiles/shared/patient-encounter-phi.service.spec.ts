import { MemberRole } from '../../business/entities/business-member.entity.js';
import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
} from '../../../common/utils/phi-encryption.util.js';
import { encryptPatientEncounterPhi } from '../../../common/utils/patient-encounter-phi.util.js';
import { PhiAccessAuditService } from '../../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../../compliance/phi-field.service.js';
import { PatientEncounterPhiService } from './patient-encounter-phi.service.js';

describe('PatientEncounterPhiService', () => {
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

  const service = new PatientEncounterPhiService(
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

  it('encrypts visit notes at rest', async () => {
    const encrypted = await service.encryptEncounterForStorage(
      hipaaBusiness as any,
      {
        id: 'encounter-1',
        businessId: 'biz-1',
        visitNote: 'Assessment complete.',
      },
    );
    expect(String(encrypted.visitNote)).toContain('phi:v1:');
  });

  it('decrypts visit notes with read audit', async () => {
    const encrypted = encryptPatientEncounterPhi(
      { visitNote: 'Assessment complete.' },
      businessKey,
    );
    const decrypted = await service.decryptEncounterForStaff(
      hipaaBusiness as any,
      { id: 'encounter-1', businessId: 'biz-1', ...encrypted },
      { userId: 'user-1', role: MemberRole.MANAGER },
      { hasAssignedBooking: false },
      'encounter-1',
    );
    expect(decrypted.visitNote).toBe('Assessment complete.');
    expect(phiAccessAudit.logBatch).toHaveBeenCalledWith(
      expect.any(Object),
      'read',
      'patient_encounter',
      'encounter-1',
      ['visitNote'],
    );
  });

  it('masks visit notes when provider lacks chart access', async () => {
    const encrypted = encryptPatientEncounterPhi(
      { visitNote: 'Hidden note' },
      businessKey,
    );
    const decrypted = await service.decryptEncounterForStaff(
      hipaaBusiness as any,
      { id: 'encounter-1', businessId: 'biz-1', ...encrypted },
      { userId: 'user-1', role: MemberRole.STAFF, employeeId: 'emp-2' },
      { hasAssignedBooking: false },
    );
    expect(decrypted.visitNote).toBeNull();
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();
  });

  it('audits addendum writes', async () => {
    await service.auditAddendumPhiWrite(
      hipaaBusiness as any,
      { id: 'addendum-1', encounterId: 'encounter-1', body: 'Follow-up call.' },
      { userId: 'user-1', role: MemberRole.OWNER },
    );
    expect(phiAccessAudit.logBatch).toHaveBeenCalledWith(
      expect.any(Object),
      'write',
      'patient_encounter_addendum',
      'addendum-1',
      ['body'],
    );
  });

  it('passes through when encryption key is missing', async () => {
    phiFieldService.resolveBusinessEncryptionKey.mockResolvedValue(null);
    const plain = await service.encryptEncounterForStorage(
      hipaaBusiness as any,
      {
        id: 'encounter-1',
        businessId: 'biz-1',
        visitNote: 'Plain note',
      },
    );
    expect(plain.visitNote).toBe('Plain note');
  });

  it('skips addendum write audit when HIPAA is inactive', async () => {
    phiFieldService.isHipaaActiveForBusiness.mockReturnValue(false);
    await service.auditAddendumPhiWrite(
      hipaaBusiness as any,
      { id: 'addendum-1', encounterId: 'encounter-1', body: 'Plain' },
      { userId: 'user-1', role: MemberRole.OWNER },
    );
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();
  });
});
