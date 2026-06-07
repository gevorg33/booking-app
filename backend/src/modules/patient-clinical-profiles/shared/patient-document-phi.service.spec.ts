import { MemberRole } from '../../business/entities/business-member.entity.js';
import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
} from '../../../common/utils/phi-encryption.util.js';
import { encryptPatientDocumentPhi } from '../../../common/utils/patient-document-phi.util.js';
import { PhiAccessAuditService } from '../../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../../compliance/phi-field.service.js';
import { PatientDocumentPhiService } from './patient-document-phi.service.js';

describe('PatientDocumentPhiService', () => {
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

  const service = new PatientDocumentPhiService(
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
    phiFieldService.resolveBusinessEncryptionKey.mockResolvedValue(businessKey);
  });

  it('encrypts document metadata at rest', async () => {
    const encrypted = await service.encryptDocumentForStorage(
      hipaaBusiness as any,
      {
        id: 'doc-1',
        businessId: 'biz-1',
        title: 'Lab report',
        originalFileName: 'lab.pdf',
      },
    );
    expect(String(encrypted.title)).toContain('phi:v1:');
  });

  it('decrypts document metadata with read audit', async () => {
    const encrypted = encryptPatientDocumentPhi(
      { title: 'Referral letter', originalFileName: 'referral.pdf' },
      businessKey,
    );
    const decrypted = await service.decryptDocumentForStaff(
      hipaaBusiness as any,
      { id: 'doc-1', businessId: 'biz-1', ...encrypted },
      { userId: 'user-1', role: MemberRole.MANAGER },
      { hasAssignedBooking: false },
    );
    expect(decrypted.title).toBe('Referral letter');
    expect(phiAccessAudit.logBatch).toHaveBeenCalledWith(
      expect.any(Object),
      'read',
      'patient_chart_document',
      'doc-1',
      ['title', 'originalFileName'],
    );
  });

  it('masks metadata when provider lacks chart access', async () => {
    const encrypted = encryptPatientDocumentPhi(
      { title: 'Imaging report', originalFileName: 'xray.pdf' },
      businessKey,
    );
    const decrypted = await service.decryptDocumentForStaff(
      hipaaBusiness as any,
      { id: 'doc-1', businessId: 'biz-1', ...encrypted },
      { userId: 'user-1', role: MemberRole.STAFF, employeeId: 'emp-2' },
      { hasAssignedBooking: false },
    );
    expect(decrypted.title).toBeNull();
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();
  });

  it('passes through when HIPAA is inactive or encryption key is missing', async () => {
    phiFieldService.isHipaaActiveForBusiness.mockReturnValue(false);
    const plain = await service.decryptDocumentForStaff(
      { ...hipaaBusiness, settings: { businessType: 'clinic' } } as any,
      {
        id: 'doc-1',
        businessId: 'biz-1',
        title: 'Plain title',
        originalFileName: 'plain.pdf',
      },
      { userId: 'user-1', role: MemberRole.STAFF, employeeId: 'emp-2' },
      { hasAssignedBooking: false },
    );
    expect(plain.title).toBe('Plain title');

    phiFieldService.isHipaaActiveForBusiness.mockReturnValue(true);
    phiFieldService.resolveBusinessEncryptionKey.mockResolvedValue(null);
    const unencrypted = await service.encryptDocumentForStorage(
      hipaaBusiness as any,
      {
        id: 'doc-2',
        businessId: 'biz-1',
        title: 'No key',
        originalFileName: 'lab.pdf',
      },
    );
    expect(unencrypted.title).toBe('No key');
  });

  it('decrypts released documents for customers with read audit', async () => {
    const encrypted = encryptPatientDocumentPhi(
      { title: 'Patient-visible report', originalFileName: 'report.pdf' },
      businessKey,
    );
    const decrypted = await service.decryptDocumentForCustomer(
      hipaaBusiness as any,
      { id: 'doc-1', businessId: 'biz-1', ...encrypted },
      'cust-1',
    );
    expect(decrypted.title).toBe('Patient-visible report');
    expect(phiAccessAudit.logBatch).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'cust-1', role: 'customer' }),
      'read',
      'patient_chart_document',
      'doc-1',
      ['title', 'originalFileName'],
    );
  });

  it('audits document metadata writes', async () => {
    await service.auditDocumentPhiWrite(
      hipaaBusiness as any,
      {
        id: 'doc-1',
        businessId: 'biz-1',
        title: 'Uploaded lab PDF',
        originalFileName: 'lab.pdf',
      },
      { userId: 'user-1', role: MemberRole.OWNER },
    );
    expect(phiAccessAudit.logBatch).toHaveBeenCalledWith(
      expect.any(Object),
      'write',
      'patient_chart_document',
      'doc-1',
      ['title', 'originalFileName'],
    );
  });
});
