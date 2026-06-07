import {
  isPatientDocumentCategory,
  normalizePatientDocumentCategoryFilter,
  assertPatientDocumentCategory,
  PATIENT_DOCUMENT_CATEGORIES,
} from './patient-document-category.util.js';

describe('patient-document-category.util', () => {
  it('recognizes supported taxonomy categories', () => {
    expect(PATIENT_DOCUMENT_CATEGORIES).toEqual([
      'lab_report',
      'referral_letter',
      'imaging_report',
      'other',
    ]);
    expect(isPatientDocumentCategory('lab_report')).toBe(true);
    expect(isPatientDocumentCategory('referral_letter')).toBe(true);
    expect(isPatientDocumentCategory('imaging_report')).toBe(true);
    expect(isPatientDocumentCategory('fertility_plan')).toBe(false);
  });

  it('normalizes list filters', () => {
    expect(normalizePatientDocumentCategoryFilter('all')).toBeNull();
    expect(normalizePatientDocumentCategoryFilter('')).toBeNull();
    expect(normalizePatientDocumentCategoryFilter('lab_report')).toBe(
      'lab_report',
    );
    expect(normalizePatientDocumentCategoryFilter('invalid')).toBeNull();
  });

  it('throws on invalid category assertion', () => {
    expect(() => assertPatientDocumentCategory('invalid')).toThrow(
      'Invalid patient document category: invalid',
    );
  });
});
