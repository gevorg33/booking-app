import {
  decryptPatientEncounterPhi,
  encryptPatientEncounterPhi,
  listPatientEncounterPhiFieldsRead,
  maskPatientEncounterPhiFields,
  encryptPatientEncounterAddendumPhi,
  decryptPatientEncounterAddendumPhi,
  listPatientEncounterAddendumPhiFieldsRead,
  listPatientEncounterPhiFieldsTouched,
  maskPatientEncounterAddendumPhiFields,
} from './patient-encounter-phi.util.js';
import { encryptPhiValue, isPhiEncryptedValue } from './phi-encryption.util.js';

describe('patient-encounter-phi.util', () => {
  const key = 'business-key';

  it('encrypts and decrypts visit notes', () => {
    const encrypted = encryptPatientEncounterPhi(
      { visitNote: 'Assessment and plan documented.' },
      key,
    );
    expect(isPhiEncryptedValue(String(encrypted.visitNote))).toBe(true);
    expect(decryptPatientEncounterPhi(encrypted, key).visitNote).toBe(
      'Assessment and plan documented.',
    );
  });

  it('masks visit notes for unauthorized readers', () => {
    const masked = maskPatientEncounterPhiFields({
      visitNote: 'Hidden note',
    });
    expect(masked.visitNote).toBeNull();
  });

  it('lists readable PHI fields', () => {
    expect(listPatientEncounterPhiFieldsRead({ visitNote: 'Note' })).toEqual([
      'visitNote',
    ]);
    expect(listPatientEncounterPhiFieldsRead({ visitNote: '  ' })).toEqual([]);
  });

  it('passes through empty values on encrypt', () => {
    expect(
      encryptPatientEncounterPhi({ visitNote: null }, key).visitNote,
    ).toBeNull();
  });

  it('encrypts addendum bodies', () => {
    const encrypted = encryptPatientEncounterAddendumPhi(
      { body: 'Addendum text' },
      key,
    );
    expect(isPhiEncryptedValue(String(encrypted.body))).toBe(true);
    expect(decryptPatientEncounterAddendumPhi(encrypted, key).body).toBe(
      'Addendum text',
    );
    expect(
      listPatientEncounterAddendumPhiFieldsRead({ body: 'Addendum text' }),
    ).toEqual(['body']);
    expect(
      maskPatientEncounterAddendumPhiFields({ body: 'x' }).body,
    ).toBeNull();
  });

  it('lists touched visit note fields', () => {
    expect(
      listPatientEncounterPhiFieldsTouched(
        { visitNote: 'Old' },
        { visitNote: 'New note' },
      ),
    ).toEqual(['visitNote']);
  });
});
