import {
  decryptBookingPhi,
  decryptPhiMetadata,
  decryptPhiValue,
  encryptBookingPhi,
  encryptPhiMetadata,
  encryptPhiValue,
  generateBusinessPhiEncryptionKeyMaterial,
  deriveBusinessPhiEncryptionKey,
  isPhiEncryptedValue,
  listPhiFieldsRead,
  listPhiFieldsTouched,
  PHI_ENCRYPTED_PREFIX,
} from './phi-encryption.util.js';

const MASTER = 'test-master-key';
const BUSINESS_ID = 'biz-phi-1';

describe('phi-encryption.util', () => {
  let businessKey: string;

  beforeEach(() => {
    const material = generateBusinessPhiEncryptionKeyMaterial(MASTER);
    businessKey = deriveBusinessPhiEncryptionKey(BUSINESS_ID, material, MASTER);
  });

  it('encrypts and decrypts scalar PHI values', () => {
    const encrypted = encryptPhiValue('Chest pain', businessKey);
    expect(isPhiEncryptedValue(encrypted)).toBe(true);
    expect(encrypted.startsWith(PHI_ENCRYPTED_PREFIX)).toBe(true);
    expect(decryptPhiValue(encrypted, businessKey)).toBe('Chest pain');
  });

  it('encrypts booking notes, metadata, and patient test result notes', () => {
    const booking = encryptBookingPhi(
      {
        notes: 'Private note',
        metadata: {
          referralNotes: 'Dr Smith',
          symptoms: 'Fever',
          patient_test_results: [{ notes: 'Elevated WBC' }],
        },
      },
      businessKey,
    );
    expect(isPhiEncryptedValue(booking.notes)).toBe(true);
    expect(isPhiEncryptedValue(booking.metadata.referralNotes)).toBe(true);
    const results = booking.metadata.patient_test_results as Array<{
      notes: string;
    }>;
    expect(isPhiEncryptedValue(results[0].notes)).toBe(true);

    const decrypted = decryptBookingPhi(booking, businessKey);
    expect(decrypted.notes).toBe('Private note');
    expect(decrypted.metadata?.referralNotes).toBe('Dr Smith');
    expect(
      (decrypted.metadata?.patient_test_results as Array<{ notes: string }>)[0]
        .notes,
    ).toBe('Elevated WBC');
  });

  it('returns passthrough values for non-encryptable patient test rows', () => {
    const encrypted = encryptPhiMetadata(
      { patient_test_results: 'not-an-array' },
      businessKey,
    );
    expect((encrypted as Record<string, unknown>).patient_test_results).toBe(
      'not-an-array',
    );
    const decrypted = decryptPhiMetadata(
      { patient_test_results: [null, { notes: 1 }] },
      businessKey,
    );
    expect((decrypted as Record<string, unknown>).patient_test_results).toEqual(
      [null, { notes: 1 }],
    );
  });

  it('decrypts bookings without metadata and lists empty metadata reads', () => {
    const encrypted = encryptBookingPhi({ notes: 'only-note' }, businessKey);
    const decrypted = decryptBookingPhi(
      { notes: encrypted.notes, metadata: null },
      businessKey,
    );
    expect(decrypted.notes).toBe('only-note');
    expect(listPhiFieldsRead({ metadata: undefined })).toEqual([]);
    expect(
      decryptPhiMetadata({ patient_test_results: 'legacy' }, businessKey)
        ?.patient_test_results,
    ).toBe('legacy');
    expect(encryptBookingPhi({ notes: '   ' }, businessKey).notes).toBe('   ');
    expect(decryptBookingPhi({ notes: 'plain' }, businessKey).notes).toBe(
      'plain',
    );
    expect(
      encryptBookingPhi({ notes: 'x' }, businessKey).metadata,
    ).toBeUndefined();
    expect(
      decryptBookingPhi(
        { notes: encryptPhiValue('x', businessKey) },
        businessKey,
      ).metadata,
    ).toBeUndefined();
  });

  it('handles metadata nullish values and mixed patient test rows', () => {
    expect(encryptPhiMetadata(null, businessKey)).toBeNull();
    expect(decryptPhiMetadata(undefined, businessKey)).toBeUndefined();
    const encrypted = encryptPhiMetadata(
      {
        patient_test_results: [
          'skip',
          { notes: 'lab' },
          { notes: '' },
          { other: true },
        ],
      },
      businessKey,
    );
    expect(
      (
        (encrypted as Record<string, unknown>).patient_test_results as Array<{
          notes?: string;
        }>
      )[1].notes,
    ).toContain(PHI_ENCRYPTED_PREFIX);
    const decrypted = decryptPhiMetadata(
      {
        patient_test_results: [
          { notes: 'plain' },
          { notes: encryptPhiValue('x', businessKey) },
        ],
      },
      businessKey,
    );
    expect(
      (decrypted as Record<string, unknown>).patient_test_results as Array<{
        notes: string;
      }>,
    ).toEqual([{ notes: 'plain' }, { notes: 'x' }]);
  });

  it('skips blank values and already-encrypted payloads', () => {
    expect(encryptPhiValue('   ', businessKey)).toBe('   ');
    const encrypted = encryptPhiValue('note', businessKey);
    expect(encryptPhiValue(encrypted, businessKey)).toBe(encrypted);
    expect(decryptPhiValue('plain-text', businessKey)).toBe('plain-text');
  });

  it('lists touched and read PHI fields', () => {
    const touched = listPhiFieldsTouched(
      { notes: 'old', metadata: { symptoms: 'cough' } },
      { notes: 'new', metadata: { symptoms: 'fever', referralNotes: 'Dr A' } },
    );
    expect(touched).toEqual(
      expect.arrayContaining(['notes', 'symptoms', 'referralNotes']),
    );

    const read = listPhiFieldsRead({
      notes: 'x',
      metadata: {
        referralNotes: 'y',
        patient_test_results: [{ notes: 'z' }],
      },
    });
    expect(read).toEqual(
      expect.arrayContaining([
        'notes',
        'referralNotes',
        'patient_test_results',
      ]),
    );

    expect(
      listPhiFieldsTouched(
        { metadata: { patient_test_results: [{ notes: 'old' }] } },
        { metadata: { patient_test_results: [{ notes: 'new' }] } },
      ),
    ).toContain('patient_test_results');
    expect(listPhiFieldsRead({ metadata: { symptoms: 'cough' } })).toContain(
      'symptoms',
    );
  });
});
