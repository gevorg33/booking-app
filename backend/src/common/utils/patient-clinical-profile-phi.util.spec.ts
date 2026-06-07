import {
  decryptPatientClinicalProfilePhi,
  encryptPatientClinicalProfilePhi,
  listPatientClinicalProfilePhiFieldsRead,
  listPatientClinicalProfilePhiFieldsTouched,
  maskPatientClinicalProfilePhiFields,
} from './patient-clinical-profile-phi.util.js';
import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
  isPhiEncryptedValue,
} from './phi-encryption.util.js';

describe('patient-clinical-profile-phi.util', () => {
  const masterKey = 'test-master-key';
  const material = generateBusinessPhiEncryptionKeyMaterial(masterKey);
  const businessKey = deriveBusinessPhiEncryptionKey(
    'biz-1',
    material,
    masterKey,
  );

  it('encrypts and decrypts clinical profile PHI fields', () => {
    const encrypted = encryptPatientClinicalProfilePhi(
      {
        allergies: 'Penicillin',
        chronicProblems: 'Type 2 diabetes',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '+15551234567',
        emergencyContactRelationship: 'Spouse',
        bloodType: 'O+',
      },
      businessKey,
    );
    expect(isPhiEncryptedValue(String(encrypted.allergies))).toBe(true);

    expect(decryptPatientClinicalProfilePhi(encrypted, businessKey)).toEqual({
      allergies: 'Penicillin',
      chronicProblems: 'Type 2 diabetes',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+15551234567',
      emergencyContactRelationship: 'Spouse',
      bloodType: 'O+',
    });
  });

  it('masks profile PHI fields for minimum-necessary access', () => {
    expect(
      maskPatientClinicalProfilePhiFields({
        allergies: 'secret',
        bloodType: 'AB-',
      }),
    ).toEqual({
      allergies: null,
      bloodType: null,
    });
  });

  it('lists read and touched PHI fields', () => {
    expect(
      listPatientClinicalProfilePhiFieldsRead({
        allergies: 'x',
        chronicProblems: '',
      }),
    ).toEqual(['allergies']);

    expect(
      listPatientClinicalProfilePhiFieldsTouched(
        { allergies: 'old' },
        { allergies: 'new', bloodType: 'A+' },
      ),
    ).toEqual(['allergies', 'bloodType']);
  });
});
