import {
  assertAllowedClinicDiagnosticCodeKind,
  assertAllowedClinicDiagnosticCodeSystem,
  buildClinicDiagnosticCodeSearchDescription,
  formatClinicDiagnosticCodeLabel,
  isClinicDiagnosticCodeKind,
  isClinicDiagnosticCodeSystem,
  isForbiddenClinicBillingCodeSystem,
  normalizeClinicDiagnosticCode,
  normalizeClinicDiagnosticCodeDescription,
} from './clinic-diagnostic-code.util.js';
import {
  CLINIC_DIAGNOSTIC_CODE_KINDS,
  CLINIC_DIAGNOSTIC_CODE_SYSTEMS,
  FORBIDDEN_CLINIC_BILLING_CODE_SYSTEMS,
} from './clinic-diagnostic-code.types.js';
import {
  CLINIC_DIAGNOSTIC_CODE_NORMALIZATION_SCENARIOS,
  FORBIDDEN_BILLING_CODE_SYSTEM_SCENARIOS,
} from '../../modules/clinic-diagnostic-codes/clinic-diagnostic-codes.fixtures.js';

describe('clinic-diagnostic-code.util', () => {
  it.each(CLINIC_DIAGNOSTIC_CODE_KINDS.map((codeKind) => ({ codeKind })))(
    'accepts catalog kind $codeKind',
    ({ codeKind }) => {
      expect(isClinicDiagnosticCodeKind(codeKind)).toBe(true);
      expect(assertAllowedClinicDiagnosticCodeKind(codeKind)).toBe(codeKind);
    },
  );

  it.each(CLINIC_DIAGNOSTIC_CODE_SYSTEMS.map((codeSystem) => ({ codeSystem })))(
    'accepts region-agnostic code system $codeSystem',
    ({ codeSystem }) => {
      expect(isClinicDiagnosticCodeSystem(codeSystem)).toBe(true);
      expect(assertAllowedClinicDiagnosticCodeSystem(codeSystem)).toBe(
        codeSystem,
      );
    },
  );

  it.each(FORBIDDEN_BILLING_CODE_SYSTEM_SCENARIOS)(
    'rejects Canada-only billing code system $id',
    ({ codeSystem }) => {
      expect(isForbiddenClinicBillingCodeSystem(codeSystem)).toBe(true);
      expect(() => assertAllowedClinicDiagnosticCodeSystem(codeSystem)).toThrow(
        'Canada OHIP/MDBilling code systems are not supported',
      );
    },
  );

  it('keeps forbidden billing code systems out of the supported enum', () => {
    for (const forbidden of FORBIDDEN_CLINIC_BILLING_CODE_SYSTEMS) {
      expect(CLINIC_DIAGNOSTIC_CODE_SYSTEMS).not.toContain(forbidden);
    }
  });

  it.each(CLINIC_DIAGNOSTIC_CODE_NORMALIZATION_SCENARIOS)(
    'normalizes catalog values for $id',
    ({ input, expectedCode, expectedDescription, expectedSearch }) => {
      if (expectedCode) {
        expect(normalizeClinicDiagnosticCode(input.code)).toBe(expectedCode);
      }
      if (expectedDescription) {
        expect(
          normalizeClinicDiagnosticCodeDescription(input.description),
        ).toBe(expectedDescription);
      }
      if (expectedSearch) {
        expect(
          buildClinicDiagnosticCodeSearchDescription({
            code: normalizeClinicDiagnosticCode(input.code),
            description: normalizeClinicDiagnosticCodeDescription(
              input.description,
            ),
          }),
        ).toBe(expectedSearch);
      }
    },
  );

  it('formats catalog labels with system and code', () => {
    expect(
      formatClinicDiagnosticCodeLabel({
        codeSystem: 'ICD-10-CM',
        code: 'E11.9',
        description: 'Type 2 diabetes mellitus without complications',
      }),
    ).toBe('ICD-10-CM E11.9 — Type 2 diabetes mellitus without complications');
  });

  it('rejects unsupported code kinds', () => {
    expect(() => assertAllowedClinicDiagnosticCodeKind('billing')).toThrow(
      'Unsupported clinic diagnostic code kind',
    );
  });

  it('rejects unsupported code systems', () => {
    expect(() => assertAllowedClinicDiagnosticCodeSystem('LOINC')).toThrow(
      'Unsupported clinic diagnostic code system',
    );
  });
});
