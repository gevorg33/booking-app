import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import {
  canAccessPatientDocumentPhi,
  decryptPatientDocumentPhi,
  encryptPatientDocumentPhi,
  listPatientDocumentPhiFieldsRead,
  maskPatientDocumentPhiFields,
} from './patient-document-phi.util.js';
import { isPhiEncryptedValue } from './phi-encryption.util.js';

describe('patient-document-phi.util', () => {
  const key = 'business-key';

  it('encrypts and decrypts document metadata', () => {
    const encrypted = encryptPatientDocumentPhi(
      {
        title: 'CBC results March 2026',
        originalFileName: 'cbc-march.pdf',
      },
      key,
    );
    expect(isPhiEncryptedValue(String(encrypted.title))).toBe(true);
    expect(decryptPatientDocumentPhi(encrypted, key).originalFileName).toBe(
      'cbc-march.pdf',
    );
  });

  it('masks metadata for unauthorized readers', () => {
    const masked = maskPatientDocumentPhiFields({
      title: 'Referral letter',
      originalFileName: 'referral.pdf',
    });
    expect(masked.title).toBeNull();
    expect(masked.originalFileName).toBeNull();
  });

  it('lists readable PHI fields', () => {
    expect(
      listPatientDocumentPhiFieldsRead({
        title: 'MRI report',
        originalFileName: 'mri.pdf',
      }),
    ).toEqual(['title', 'originalFileName']);
    expect(listPatientDocumentPhiFieldsRead({ title: '  ' })).toEqual([]);
  });

  it('uses chart access for document PHI', () => {
    expect(
      canAccessPatientDocumentPhi(
        MemberRole.MANAGER,
        { hasAssignedBooking: false },
        null,
      ),
    ).toBe(true);
    expect(
      canAccessPatientDocumentPhi(
        MemberRole.STAFF,
        { hasAssignedBooking: false },
        'emp-1',
      ),
    ).toBe(false);
  });

  it('passes through empty metadata on encrypt', () => {
    expect(
      encryptPatientDocumentPhi(
        { title: null, originalFileName: 'lab.pdf' },
        key,
      ).title,
    ).toBeNull();
  });
});
