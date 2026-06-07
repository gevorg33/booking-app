import {
  canAccessPatientStaffNotePhi,
  decryptPatientStaffNotePhi,
  encryptPatientStaffNotePhi,
  listPatientStaffNotePhiFieldsRead,
  maskPatientStaffNotePhiFields,
} from './patient-staff-note-phi.util.js';
import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import { isPhiEncryptedValue } from './phi-encryption.util.js';

describe('patient-staff-note-phi.util', () => {
  const key = 'business-key';

  it('encrypts and decrypts note bodies', () => {
    const encrypted = encryptPatientStaffNotePhi(
      { body: 'Billing concern — discuss with front desk privately.' },
      key,
    );
    expect(isPhiEncryptedValue(String(encrypted.body))).toBe(true);
    expect(decryptPatientStaffNotePhi(encrypted, key).body).toBe(
      'Billing concern — discuss with front desk privately.',
    );
  });

  it('masks note bodies for unauthorized readers', () => {
    const masked = maskPatientStaffNotePhiFields({
      body: 'Hidden internal note',
    });
    expect(masked.body).toBeNull();
  });

  it('lists readable PHI fields', () => {
    expect(listPatientStaffNotePhiFieldsRead({ body: 'Note' })).toEqual([
      'body',
    ]);
    expect(listPatientStaffNotePhiFieldsRead({ body: '  ' })).toEqual([]);
  });

  it('passes through empty values on encrypt', () => {
    expect(encryptPatientStaffNotePhi({ body: null }, key).body).toBeNull();
  });

  it('checks staff-note PHI access via minimum-necessary roles', () => {
    expect(
      canAccessPatientStaffNotePhi(
        MemberRole.MANAGER,
        { hasAssignedBooking: false },
        null,
      ),
    ).toBe(true);
    expect(
      canAccessPatientStaffNotePhi(
        MemberRole.STAFF,
        { hasAssignedBooking: false },
        'emp-1',
      ),
    ).toBe(false);
    expect(
      canAccessPatientStaffNotePhi(
        MemberRole.STAFF,
        { hasAssignedBooking: true },
        'emp-1',
      ),
    ).toBe(true);
  });
});
