import {
  buildClinicSpecimenBarcodeValue,
  ensureClinicSpecimenIdentifier,
  generateClinicSpecimenIdentifier,
  isValidClinicSpecimenIdentifier,
  mapClinicSpecimenLabelView,
} from './clinic-specimen-label.util.js';

export const CLINIC_SPECIMEN_LABEL_FIXTURES = [
  {
    id: 'generate-from-specimen-id',
    specimenId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    existing: null,
    expectedIdentifier: 'SP-A1B2C3D4E5F6',
  },
  {
    id: 'keep-valid-existing-identifier',
    specimenId: 'spec-1',
    existing: 'LAB-10042',
    expectedIdentifier: 'LAB-10042',
  },
] as const;

describe('clinic-specimen-label.util', () => {
  it.each(CLINIC_SPECIMEN_LABEL_FIXTURES)(
    'resolves specimen identifier for $id',
    ({ specimenId, existing, expectedIdentifier }) => {
      expect(ensureClinicSpecimenIdentifier(specimenId, existing)).toBe(
        expectedIdentifier,
      );
    },
  );

  it('builds barcode values from specimen identifiers', () => {
    expect(buildClinicSpecimenBarcodeValue('sp-abc123')).toBe('SP-ABC123');
  });

  it('maps printable label views', () => {
    const view = mapClinicSpecimenLabelView({
      specimenId: 'spec-1',
      specimenIdentifier: 'SP-SPEC1',
      status: 'NotCollected',
      customerName: 'Jane Doe',
      orderDisplayNames: 'CBC',
      bookingStartTime: new Date('2026-06-23T10:00:00.000Z'),
      department: 'Laboratory',
    });

    expect(view).toEqual(
      expect.objectContaining({
        specimenId: 'spec-1',
        specimenIdentifier: 'SP-SPEC1',
        barcodeValue: 'SP-SPEC1',
        customerName: 'Jane Doe',
        orderDisplayNames: 'CBC',
        department: 'Laboratory',
      }),
    );
  });

  it('validates identifier format', () => {
    expect(isValidClinicSpecimenIdentifier('SP-ABC123')).toBe(true);
    expect(isValidClinicSpecimenIdentifier('bad id')).toBe(false);
  });

  it('generates deterministic identifiers from specimen ids', () => {
    expect(generateClinicSpecimenIdentifier('spec-1')).toBe('SP-SPEC1');
  });
});
