import {
  decryptClinicTestOrderPhi,
  decryptClinicTestResultMeasurementPhi,
  decryptClinicTestResultPhi,
  encryptClinicTestOrderPhi,
  encryptClinicTestResultMeasurementPhi,
  encryptClinicTestResultPhi,
  encryptClinicStatusHistoryNote,
  listClinicMeasurementPhiFieldsRead,
  listClinicMeasurementPhiFieldsTouched,
  listClinicTestResultPhiFieldsRead,
  listClinicTestResultPhiFieldsTouched,
  maskClinicTestResultMeasurementPhiFields,
  maskClinicTestOrderPhiFields,
  maskClinicTestResultPhiFields,
  canAccessClinicLabPhi,
} from './clinic-lab-phi.util.js';
import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
  isPhiEncryptedValue,
} from './phi-encryption.util.js';

describe('clinic-lab-phi.util', () => {
  const masterKey = 'test-master-key';
  const material = generateBusinessPhiEncryptionKeyMaterial(masterKey);
  const businessKey = deriveBusinessPhiEncryptionKey(
    'biz-1',
    material,
    masterKey,
  );

  it('encrypts and decrypts clinic test result comment fields', () => {
    const encrypted = encryptClinicTestResultPhi(
      {
        comment: 'Patient glucose elevated',
        reviewComment: 'Confirm with repeat draw',
        releaseComment: null,
      },
      businessKey,
    );

    expect(isPhiEncryptedValue(String(encrypted.comment))).toBe(true);
    expect(decryptClinicTestResultPhi(encrypted, businessKey)).toEqual({
      comment: 'Patient glucose elevated',
      reviewComment: 'Confirm with repeat draw',
      releaseComment: null,
    });
  });

  it('encrypts measurement value and lab comment', () => {
    const encrypted = encryptClinicTestResultMeasurementPhi(
      { value: '142', labComment: 'Hemolyzed sample' },
      businessKey,
    );
    expect(isPhiEncryptedValue(String(encrypted.value))).toBe(true);
    expect(
      decryptClinicTestResultMeasurementPhi(encrypted, businessKey),
    ).toEqual({
      value: '142',
      labComment: 'Hemolyzed sample',
    });
  });

  it('encrypts status history notes', () => {
    const encrypted = encryptClinicStatusHistoryNote(
      'Released after physician review',
      businessKey,
    );
    expect(isPhiEncryptedValue(String(encrypted))).toBe(true);
  });

  it('masks result PHI fields for minimum-necessary access', () => {
    expect(
      maskClinicTestResultPhiFields({
        comment: 'secret',
        reviewComment: 'secret',
        releaseComment: 'secret',
      }),
    ).toEqual({
      comment: null,
      reviewComment: null,
      releaseComment: null,
    });
  });

  it('lists read and touched PHI fields', () => {
    expect(
      listClinicTestResultPhiFieldsRead({
        comment: 'x',
        reviewComment: '',
        releaseComment: null,
      }),
    ).toEqual(['comment']);

    expect(
      listClinicTestResultPhiFieldsTouched(
        { comment: 'old' },
        { comment: 'new', reviewComment: 'added' },
      ),
    ).toEqual(['comment', 'reviewComment']);
  });

  it('lists measurement PHI fields read and touched', () => {
    expect(
      listClinicMeasurementPhiFieldsRead({
        value: '142',
        labComment: '',
      }),
    ).toEqual(['value']);

    expect(
      listClinicMeasurementPhiFieldsTouched(
        { value: '140' },
        { value: '142', labComment: 'Repeat advised' },
      ),
    ).toEqual(['value', 'labComment']);
  });

  it('encrypts order and measurement PHI carriers', () => {
    const order = encryptClinicTestOrderPhi(
      { comment: 'Hold draw', customCancellationReason: 'Patient declined' },
      businessKey,
    );
    expect(isPhiEncryptedValue(String(order.comment))).toBe(true);

    const measurement = encryptClinicTestResultMeasurementPhi(
      { value: '5.1', labComment: 'Retest advised' },
      businessKey,
    );
    expect(isPhiEncryptedValue(String(measurement.labComment))).toBe(true);
  });

  it('decrypts order fields and masks measurement PHI', () => {
    const order = encryptClinicTestOrderPhi(
      { comment: 'Hold draw', customCancellationReason: null },
      businessKey,
    );
    expect(decryptClinicTestOrderPhi(order, businessKey).comment).toBe(
      'Hold draw',
    );

    expect(
      maskClinicTestResultMeasurementPhiFields({
        value: 'secret',
        labComment: 'secret',
      }),
    ).toEqual({ value: null, labComment: null });
  });

  it('supports canAccessClinicLabPhi re-export', () => {
    expect(
      canAccessClinicLabPhi('owner', { employeeId: 'emp-1' }, 'emp-9'),
    ).toBe(true);
  });

  it('masks order PHI fields', () => {
    expect(
      maskClinicTestOrderPhiFields({
        comment: 'secret',
        customCancellationReason: 'secret',
      }),
    ).toEqual({
      comment: null,
      customCancellationReason: null,
    });
  });
});
