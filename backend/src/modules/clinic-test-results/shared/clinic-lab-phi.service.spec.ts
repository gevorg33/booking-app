import { MemberRole } from '../../business/entities/business-member.entity.js';
import { encryptClinicTestResultPhi } from '../../../common/utils/clinic-lab-phi.util.js';
import { ClinicLabPhiService } from './clinic-lab-phi.service.js';
import { PhiAccessAuditService } from '../../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../../compliance/phi-field.service.js';
import { isPhiEncryptedValue } from '../../../common/utils/phi-encryption.util.js';

describe('ClinicLabPhiService', () => {
  const phiFieldService = {
    isHipaaActiveForBusiness: jest.fn(),
    resolveBusinessEncryptionKey: jest.fn(),
  };
  const phiAccessAudit = {
    logBatch: jest.fn(),
  };

  const service = new ClinicLabPhiService(
    phiFieldService as unknown as PhiFieldService,
    phiAccessAudit as unknown as PhiAccessAuditService,
  );

  const hipaaBusiness = {
    id: 'biz-1',
    settings: {
      businessType: 'clinic',
      hipaa: { enabled: true, baaSigned: true },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    phiFieldService.isHipaaActiveForBusiness.mockReturnValue(true);
    phiFieldService.resolveBusinessEncryptionKey.mockResolvedValue(
      'business-key',
    );
  });

  it('encrypts result comment fields when HIPAA is active', async () => {
    const encrypted = await service.encryptTestResultForStorage(
      hipaaBusiness as any,
      {
        id: 'result-1',
        businessId: 'biz-1',
        comment: 'Elevated glucose',
      },
    );

    expect(isPhiEncryptedValue(String(encrypted.comment))).toBe(true);
  });

  it('masks result PHI for staff without booking access', async () => {
    const decrypted = await service.decryptTestResultForStaff(
      hipaaBusiness as any,
      {
        id: 'result-1',
        businessId: 'biz-1',
        comment: 'phi:v1:secret',
        reviewComment: 'phi:v1:secret',
      },
      { userId: 'user-1', role: MemberRole.STAFF, employeeId: 'emp-2' },
      { employeeId: 'emp-1' },
    );

    expect(decrypted.comment).toBeNull();
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();
  });

  it('audits writes to clinic test result PHI fields', async () => {
    await service.auditTestResultPhiWrite(
      hipaaBusiness as any,
      {
        id: 'result-1',
        businessId: 'biz-1',
        comment: 'Updated',
      },
      { comment: 'Old' },
      { userId: 'user-1', role: MemberRole.OWNER },
    );

    expect(phiAccessAudit.logBatch).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'biz-1', userId: 'user-1' }),
      'write',
      'clinic_test_result',
      'result-1',
      ['comment'],
    );
  });

  it('decrypts result PHI for authorized staff and audits read', async () => {
    const encrypted = encryptClinicTestResultPhi(
      {
        comment: 'Elevated glucose',
        reviewComment: null,
        releaseComment: null,
      },
      'business-key',
    );

    const decrypted = await service.decryptTestResultForStaff(
      hipaaBusiness as any,
      {
        id: 'result-1',
        businessId: 'biz-1',
        ...encrypted,
      },
      { userId: 'user-1', role: MemberRole.OWNER },
      { employeeId: 'emp-1' },
    );

    expect(decrypted.comment).toBe('Elevated glucose');
    expect(phiAccessAudit.logBatch).toHaveBeenCalled();
  });

  it('passes through values when HIPAA is inactive', async () => {
    phiFieldService.isHipaaActiveForBusiness.mockReturnValue(false);
    phiFieldService.resolveBusinessEncryptionKey.mockResolvedValue(null);
    const result = await service.encryptTestResultForStorage(
      hipaaBusiness as any,
      {
        id: 'result-1',
        businessId: 'biz-1',
        comment: 'plain',
      },
    );
    expect(result.comment).toBe('plain');
  });

  it('encrypts order, measurement, and status history notes', async () => {
    const order = await service.encryptTestOrderForStorage(
      hipaaBusiness as any,
      {
        id: 'order-1',
        businessId: 'biz-1',
        comment: 'Needs redraw',
      },
    );
    expect(isPhiEncryptedValue(String(order.comment))).toBe(true);

    const measurement = await service.encryptMeasurementForStorage(
      hipaaBusiness as any,
      { id: 'm-1', value: '7.2', labComment: 'High' },
    );
    expect(isPhiEncryptedValue(String(measurement.value))).toBe(true);

    const note = await service.encryptStatusHistoryNoteForStorage(
      hipaaBusiness as any,
      'Released after review',
    );
    expect(isPhiEncryptedValue(String(note))).toBe(true);
  });

  it('decrypts order and measurement for assigned provider', async () => {
    const encryptedOrder = await service.encryptTestOrderForStorage(
      hipaaBusiness as any,
      {
        id: 'order-1',
        businessId: 'biz-1',
        comment: 'Needs redraw',
      },
    );
    const decryptedOrder = await service.decryptTestOrderForStaff(
      hipaaBusiness as any,
      encryptedOrder,
      { userId: 'user-1', role: MemberRole.STAFF, employeeId: 'emp-1' },
      { employeeId: 'emp-1' },
    );
    expect(decryptedOrder.comment).toBe('Needs redraw');

    const encryptedMeasurement = await service.encryptMeasurementForStorage(
      hipaaBusiness as any,
      { id: 'm-1', value: '7.2', labComment: 'High' },
    );
    const decryptedMeasurement = await service.decryptMeasurementForStaff(
      hipaaBusiness as any,
      encryptedMeasurement,
      { userId: 'user-1', role: MemberRole.STAFF, employeeId: 'emp-1' },
      { employeeId: 'emp-1' },
    );
    expect(decryptedMeasurement.value).toBe('7.2');
    expect(phiAccessAudit.logBatch).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'biz-1', userId: 'user-1' }),
      'read',
      'clinic_test_result_measurement',
      'm-1',
      ['value', 'labComment'],
    );
  });

  it('decrypts status history notes for managers', async () => {
    const encrypted = await service.encryptStatusHistoryNoteForStorage(
      hipaaBusiness as any,
      'Released after review',
    );
    const note = await service.decryptStatusHistoryNoteForStaff(
      hipaaBusiness as any,
      encrypted,
      { userId: 'user-1', role: MemberRole.MANAGER },
      { employeeId: 'emp-9' },
    );
    expect(note).toBe('Released after review');
  });

  it('masks order and measurement PHI when staff lacks booking access', async () => {
    const encryptedOrder = await service.encryptTestOrderForStorage(
      hipaaBusiness as any,
      {
        id: 'order-1',
        businessId: 'biz-1',
        comment: 'Needs redraw',
      },
    );
    const maskedOrder = await service.decryptTestOrderForStaff(
      hipaaBusiness as any,
      encryptedOrder,
      { userId: 'user-1', role: MemberRole.STAFF, employeeId: 'emp-2' },
      { employeeId: 'emp-1' },
    );
    expect(maskedOrder.comment).toBeNull();

    const encryptedMeasurement = await service.encryptMeasurementForStorage(
      hipaaBusiness as any,
      { id: 'm-1', value: '7.2', labComment: 'High' },
    );
    const maskedMeasurement = await service.decryptMeasurementForStaff(
      hipaaBusiness as any,
      encryptedMeasurement,
      { userId: 'user-1', role: MemberRole.STAFF, employeeId: 'emp-2' },
      { employeeId: 'emp-1' },
    );
    expect(maskedMeasurement.value).toBeNull();
  });

  it('returns empty history notes when access is denied', async () => {
    const encrypted = await service.encryptStatusHistoryNoteForStorage(
      hipaaBusiness as any,
      'Released after review',
    );
    const note = await service.decryptStatusHistoryNoteForStaff(
      hipaaBusiness as any,
      encrypted,
      { userId: 'user-1', role: MemberRole.STAFF, employeeId: 'emp-2' },
      { employeeId: 'emp-1' },
    );
    expect(note).toBeNull();
  });

  it('passes through decrypt helpers when HIPAA is inactive', async () => {
    phiFieldService.isHipaaActiveForBusiness.mockReturnValue(false);
    const measurement = { id: 'm-1', value: '7.2' };
    await expect(
      service.decryptMeasurementForStaff(
        hipaaBusiness as any,
        measurement,
        { userId: 'user-1', role: MemberRole.STAFF },
        { employeeId: 'emp-1' },
      ),
    ).resolves.toBe(measurement);

    await expect(
      service.decryptStatusHistoryNoteForStaff(
        hipaaBusiness as any,
        undefined,
        { userId: 'user-1', role: MemberRole.STAFF },
        { employeeId: 'emp-1' },
      ),
    ).resolves.toBeUndefined();
  });

  it('returns ciphertext when business key is missing', async () => {
    phiFieldService.resolveBusinessEncryptionKey.mockResolvedValue(null);
    const encrypted = encryptClinicTestResultPhi(
      { comment: 'Elevated glucose' },
      'business-key',
    );
    const result = await service.decryptTestResultForStaff(
      hipaaBusiness as any,
      { id: 'result-1', businessId: 'biz-1', ...encrypted },
      { userId: 'user-1', role: MemberRole.OWNER },
      { employeeId: 'emp-1' },
    );
    expect(result.comment).toMatch(/^phi:v1:/);
  });

  it('skips audit when no PHI fields changed', async () => {
    await service.auditTestResultPhiWrite(
      hipaaBusiness as any,
      { id: 'result-1', businessId: 'biz-1', comment: 'Same' },
      { comment: 'Same' },
      { userId: 'user-1', role: MemberRole.OWNER },
    );
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();
  });

  it('skips audit when HIPAA is inactive', async () => {
    phiFieldService.isHipaaActiveForBusiness.mockReturnValue(false);
    await service.auditTestResultPhiWrite(
      hipaaBusiness as any,
      { id: 'result-1', businessId: 'biz-1', comment: 'Updated' },
      { comment: 'Old' },
      { userId: 'user-1', role: MemberRole.OWNER },
    );
    expect(phiAccessAudit.logBatch).not.toHaveBeenCalled();
  });

  it('returns undecrypted order and history note when key is missing', async () => {
    phiFieldService.resolveBusinessEncryptionKey.mockResolvedValue(null);
    const order = await service.decryptTestOrderForStaff(
      hipaaBusiness as any,
      {
        id: 'order-1',
        businessId: 'biz-1',
        comment: 'phi:v1:abc',
      },
      { userId: 'user-1', role: MemberRole.OWNER },
      { employeeId: 'emp-1' },
    );
    expect(order.comment).toBe('phi:v1:abc');

    const note = await service.decryptStatusHistoryNoteForStaff(
      hipaaBusiness as any,
      'phi:v1:abc',
      { userId: 'user-1', role: MemberRole.OWNER },
      { employeeId: 'emp-1' },
    );
    expect(note).toBe('phi:v1:abc');
  });

  it('decrypts legacy booking metadata patient test results with audit', async () => {
    const encrypted = await service.encryptStatusHistoryNoteForStorage(
      hipaaBusiness as any,
      'ignored',
    );
    void encrypted;

    const legacyRows = [{ notes: 'Legacy WBC', testName: 'CBC' }];
    const metadata = { patient_test_results: legacyRows };

    const { rows, phiMasked } =
      await service.decryptLegacyPatientTestResultsForStaff(
        hipaaBusiness as any,
        'booking-1',
        metadata,
        { userId: 'user-1', role: MemberRole.OWNER },
        { employeeId: 'emp-1' },
      );

    expect(phiMasked).toBe(false);
    expect(rows[0]?.notes).toBe('Legacy WBC');
    expect(phiAccessAudit.logBatch).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'biz-1', userId: 'user-1' }),
      'read',
      'booking',
      'booking-1',
      ['patient_test_results'],
    );
  });
});
