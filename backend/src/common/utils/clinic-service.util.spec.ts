import {
  applyClinicMetadataToServiceMetadata,
  buildClinicBookingMetadata,
  buildClinicServiceMetadataFromDraft,
  clinicServiceAcceptsPatientNotes,
  extractClinicBookingMetadata,
  extractClinicMetadata,
  formatClinicServiceTypeBadge,
  isClinicService,
  isClinicServiceType,
  isClinicVerticalBusinessType,
  type ClinicServiceType,
} from './clinic-service.util.js';

describe('clinic-service.util', () => {
  it('detects clinic service types and vertical business types', () => {
    expect(isClinicServiceType('lab_test')).toBe(true);
    expect(isClinicServiceType('tour')).toBe(false);
    expect(isClinicVerticalBusinessType('polyclinic')).toBe(true);
    expect(isClinicVerticalBusinessType('hair_salon')).toBe(false);
    expect(isClinicVerticalBusinessType(null)).toBe(false);
    expect(isClinicVerticalBusinessType(undefined)).toBe(false);
  });

  it('applies clinic metadata when existing metadata is null', () => {
    const meta = applyClinicMetadataToServiceMetadata(null, {
      serviceType: 'consultation',
    });
    expect(meta).toEqual({ serviceType: 'consultation' });
  });

  it('ignores invalid or empty clinic metadata fields on extract', () => {
    expect(
      extractClinicMetadata({
        serviceType: 'lab_test',
        requiresFasting: false,
        preparationNotes: '   ',
      }),
    ).toEqual({ serviceType: 'lab_test' });
    expect(extractClinicMetadata({ serviceType: 'tour' })).toBeNull();
    expect(isClinicService({ serviceType: 'procedure' })).toBe(true);
  });

  it('extracts and applies clinic metadata', () => {
    const meta = applyClinicMetadataToServiceMetadata(
      {},
      {
        serviceType: 'lab_test',
        requiresFasting: true,
        preparationNotes: 'Fast 12 hours',
      },
    );
    expect(extractClinicMetadata(meta)).toEqual({
      serviceType: 'lab_test',
      requiresFasting: true,
      preparationNotes: 'Fast 12 hours',
    });
    expect(isClinicService(meta)).toBe(true);
  });

  it('clears optional clinic fields when set to false or empty', () => {
    const clearedFasting = applyClinicMetadataToServiceMetadata(
      { serviceType: 'lab_test', requiresFasting: true },
      { requiresFasting: false },
    );
    expect(clearedFasting).toEqual({ serviceType: 'lab_test' });

    const clearedNotes = applyClinicMetadataToServiceMetadata(
      { serviceType: 'lab_test', preparationNotes: 'Fast 12 hours' },
      { preparationNotes: '' },
    );
    expect(clearedNotes).toEqual({ serviceType: 'lab_test' });
  });

  it('clears clinic metadata when serviceType is null', () => {
    const cleared = applyClinicMetadataToServiceMetadata(
      {
        serviceType: 'consultation',
        requiresFasting: true,
        preparationNotes: 'Bring records',
      },
      { serviceType: null },
    );
    expect(extractClinicMetadata(cleared)).toBeNull();
  });

  it('builds clinic metadata from catalog draft', () => {
    expect(
      buildClinicServiceMetadataFromDraft({ serviceType: 'procedure' }),
    ).toMatchObject({ serviceType: 'procedure' });
    expect(
      buildClinicServiceMetadataFromDraft({ serviceType: 'tour' }),
    ).toBeUndefined();
  });

  it('formats clinic service badges', () => {
    expect(formatClinicServiceTypeBadge('consultation')).toBe('Consultation');
    expect(formatClinicServiceTypeBadge('lab_test')).toBe('Lab test');
    expect(formatClinicServiceTypeBadge('procedure')).toBe('Procedure');
    expect(formatClinicServiceTypeBadge('other' as ClinicServiceType)).toBe(
      'other',
    );
  });

  it('builds and extracts clinic booking metadata', () => {
    const meta = buildClinicBookingMetadata({
      referralNotes: '  Dr Smith referral  ',
      symptoms: 'Chest pain',
    });
    expect(meta).toEqual({
      referralNotes: 'Dr Smith referral',
      symptoms: 'Chest pain',
    });
    expect(extractClinicBookingMetadata(meta)).toEqual(meta);
    expect(extractClinicBookingMetadata({})).toEqual({});
    expect(
      buildClinicBookingMetadata({ referralNotes: '  ', symptoms: '' }),
    ).toEqual({});
    expect(
      extractClinicBookingMetadata({ referralNotes: '  ', symptoms: '  ' }),
    ).toEqual({});
  });

  it('accepts patient notes for clinic services only', () => {
    expect(
      clinicServiceAcceptsPatientNotes({ serviceType: 'consultation' }),
    ).toBe(true);
    expect(clinicServiceAcceptsPatientNotes({ serviceType: 'tour' })).toBe(
      false,
    );
  });
});
