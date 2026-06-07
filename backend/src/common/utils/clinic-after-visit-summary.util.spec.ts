import {
  assertValidClinicAfterVisitSummaryDescription,
  clinicAfterVisitSummaryHasPhiContent,
  isValidClinicAfterVisitSummaryDescription,
  normalizeClinicAfterVisitSummaryDescription,
} from './clinic-after-visit-summary.util.js';

describe('clinic-after-visit-summary.util', () => {
  it('normalizes whitespace', () => {
    expect(normalizeClinicAfterVisitSummaryDescription('  hello  ')).toBe(
      'hello',
    );
  });

  it('validates description length bounds', () => {
    expect(isValidClinicAfterVisitSummaryDescription('ok')).toBe(true);
    expect(isValidClinicAfterVisitSummaryDescription('')).toBe(false);
    expect(isValidClinicAfterVisitSummaryDescription('   ')).toBe(false);
    expect(isValidClinicAfterVisitSummaryDescription(null)).toBe(false);
  });

  it('assertValid throws for invalid descriptions', () => {
    expect(() => assertValidClinicAfterVisitSummaryDescription('')).toThrow(
      'After-visit summary description is invalid',
    );
  });

  it('detects phi content', () => {
    expect(clinicAfterVisitSummaryHasPhiContent({ description: 'note' })).toBe(
      true,
    );
    expect(clinicAfterVisitSummaryHasPhiContent({ description: '  ' })).toBe(
      false,
    );
  });

  it('assertValid returns normalized description', () => {
    expect(assertValidClinicAfterVisitSummaryDescription('  note  ')).toBe(
      'note',
    );
  });
});
