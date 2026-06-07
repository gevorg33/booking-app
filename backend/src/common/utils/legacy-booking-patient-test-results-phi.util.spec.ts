import {
  decryptLegacyPatientTestResultRows,
  encryptLegacyPatientTestResultRows,
  hasLegacyPatientTestResultNotes,
  legacyPatientTestResultsMetadataChanged,
  legacyPatientTestResultsMetadataHasContent,
  maskLegacyPatientTestResultRows,
  parseLegacyPatientTestResultRows,
  redactLegacyPatientTestResultRows,
} from './legacy-booking-patient-test-results-phi.util.js';
import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
  isPhiEncryptedValue,
} from './phi-encryption.util.js';

describe('legacy-booking-patient-test-results-phi.util', () => {
  const masterKey = 'test-master-key';
  const material = generateBusinessPhiEncryptionKeyMaterial(masterKey);
  const businessKey = deriveBusinessPhiEncryptionKey(
    'biz-1',
    material,
    masterKey,
  );

  it('encrypts and decrypts legacy patient test result notes', () => {
    const encrypted = encryptLegacyPatientTestResultRows(
      [{ notes: 'Elevated WBC' }],
      businessKey,
    ) as Array<{ notes: string }>;
    expect(isPhiEncryptedValue(encrypted[0].notes)).toBe(true);

    const decrypted = decryptLegacyPatientTestResultRows(
      encrypted,
      businessKey,
    ) as Array<{ notes: string }>;
    expect(decrypted[0].notes).toBe('Elevated WBC');
  });

  it('parses, masks, and redacts legacy metadata rows', () => {
    const metadata = {
      patient_test_results: [{ notes: 'lab', testName: 'CBC' }, null],
    };
    expect(parseLegacyPatientTestResultRows(metadata)).toEqual([
      { notes: 'lab', testName: 'CBC' },
    ]);
    expect(hasLegacyPatientTestResultNotes(metadata)).toBe(true);
    expect(legacyPatientTestResultsMetadataHasContent(metadata)).toBe(true);

    const masked = maskLegacyPatientTestResultRows(
      metadata.patient_test_results,
    ) as Array<{ notes?: string; testName: string }>;
    expect(masked[0].notes).toBeUndefined();
    expect(masked[0].testName).toBe('CBC');

    const redacted = redactLegacyPatientTestResultRows(
      metadata.patient_test_results,
    ) as Array<{ notes: string }>;
    expect(redacted[0].notes).toBe('[REDACTED_PHI]');
  });

  it('detects metadata changes for audit touched fields', () => {
    expect(
      legacyPatientTestResultsMetadataChanged(
        [{ notes: 'old' }],
        [{ notes: 'new' }],
      ),
    ).toBe(true);
    expect(
      legacyPatientTestResultsMetadataChanged(
        [{ notes: 'same' }],
        [{ notes: 'same' }],
      ),
    ).toBe(false);
  });

  it('returns passthrough values for non-array legacy payloads', () => {
    expect(encryptLegacyPatientTestResultRows('legacy', businessKey)).toBe(
      'legacy',
    );
    expect(
      decryptLegacyPatientTestResultRows([{ notes: 'plain' }], businessKey),
    ).toEqual([{ notes: 'plain' }]);
  });
});
