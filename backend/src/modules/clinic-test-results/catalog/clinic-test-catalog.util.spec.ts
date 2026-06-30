import {
  applyClinicTestTypeLinkToServiceMetadata,
  assertClinicReferenceRangeBounds,
  buildClinicTestTypeCode,
  formatClinicTestTypeReferenceRange,
  inheritCatalogFieldsFromService,
  isKnownClinicalDepartment,
  parseClinicReferenceRangeBound,
  readClinicTestTypeIdFromServiceMetadata,
  resolveClinicalDepartmentLabel,
} from './clinic-test-catalog.util.js';

describe('clinic-test-catalog.util', () => {
  it('builds stable test type codes from titles', () => {
    expect(buildClinicTestTypeCode({ title: 'Complete Blood Count' })).toBe(
      'complete_blood_count',
    );
    expect(
      buildClinicTestTypeCode({ code: 'cbc', title: 'Complete Blood Count' }),
    ).toBe('cbc');
  });

  it('inherits fasting and prep from linked services', () => {
    expect(
      inheritCatalogFieldsFromService(
        {
          id: 'svc-1',
          name: 'Lipid panel',
          categoryName: 'Laboratory',
          requiresFasting: true,
          preparationNotes: 'Fast 12 hours',
          price: 35,
        },
        {},
      ),
    ).toEqual({
      requiresFasting: true,
      preparationNotes: 'Fast 12 hours',
      price: 35,
      department: 'Laboratory',
    });
  });

  it('maps service metadata links both ways', () => {
    expect(
      readClinicTestTypeIdFromServiceMetadata({
        clinicTestTypeId: 'type-1',
      }),
    ).toBe('type-1');
    expect(
      applyClinicTestTypeLinkToServiceMetadata({}, 'type-1').clinicTestTypeId,
    ).toBe('type-1');
    expect(
      applyClinicTestTypeLinkToServiceMetadata(
        { clinicTestTypeId: 'type-1' },
        null,
      ).clinicTestTypeId,
    ).toBeUndefined();
  });

  it('recognizes playbook departments', () => {
    expect(resolveClinicalDepartmentLabel(' Laboratory ')).toBe('Laboratory');
    expect(isKnownClinicalDepartment('Cardiology')).toBe(true);
    expect(isKnownClinicalDepartment('Spa')).toBe(false);
  });

  it('parses and formats reference range bounds', () => {
    expect(parseClinicReferenceRangeBound('4.5')).toBe(4.5);
    expect(parseClinicReferenceRangeBound(11)).toBe(11);
    expect(parseClinicReferenceRangeBound('')).toBeNull();
    expect(formatClinicTestTypeReferenceRange(4, 11)).toBe('4–11');
    expect(formatClinicTestTypeReferenceRange(4, null)).toBe('≥ 4');
    expect(formatClinicTestTypeReferenceRange(null, 11)).toBe('≤ 11');
    expect(assertClinicReferenceRangeBounds(11, 4)).toMatch(/normalLow/);
  });
});
