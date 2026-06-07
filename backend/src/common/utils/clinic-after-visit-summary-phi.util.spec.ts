import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
} from './phi-encryption.util.js';
import {
  decryptClinicAfterVisitSummaryPhi,
  encryptClinicAfterVisitSummaryPhi,
  listClinicAfterVisitSummaryPhiFieldsRead,
  maskClinicAfterVisitSummaryPhiFields,
} from './clinic-after-visit-summary-phi.util.js';

describe('clinic-after-visit-summary-phi.util', () => {
  const masterKey = 'test-master-key';
  const material = generateBusinessPhiEncryptionKeyMaterial(masterKey);
  const businessKey = deriveBusinessPhiEncryptionKey(
    'biz-1',
    material,
    masterKey,
  );

  it('encrypts and decrypts description', () => {
    const encrypted = encryptClinicAfterVisitSummaryPhi(
      { description: 'Take ibuprofen as needed.' },
      businessKey,
    );
    expect(encrypted.description).not.toBe('Take ibuprofen as needed.');
    const decrypted = decryptClinicAfterVisitSummaryPhi(encrypted, businessKey);
    expect(decrypted.description).toBe('Take ibuprofen as needed.');
  });

  it('masks phi fields', () => {
    const masked = maskClinicAfterVisitSummaryPhiFields({
      description: 'secret',
    });
    expect(masked.description).toBeNull();
  });

  it('lists read fields', () => {
    expect(
      listClinicAfterVisitSummaryPhiFieldsRead({ description: 'hello' }),
    ).toEqual(['description']);
    expect(
      listClinicAfterVisitSummaryPhiFieldsRead({ description: '  ' }),
    ).toEqual([]);
  });
});
