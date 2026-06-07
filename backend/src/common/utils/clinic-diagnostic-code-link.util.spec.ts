import {
  applyClinicDiagnosticCodeLinkToServiceMetadata,
  expectedClinicDiagnosticCodeKindForServiceType,
  mapClinicDiagnosticCodeLinkView,
  readClinicDiagnosticCodeIdFromServiceMetadata,
  validateClinicDiagnosticCodeKindMatch,
  validateClinicTestTypeDiagnosticCodeKind,
} from './clinic-diagnostic-code-link.util.js';
import {
  CLINIC_DIAGNOSTIC_CODE_KIND_MATCH_SCENARIOS,
  CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES,
  CLINIC_DIAGNOSTIC_CODE_METADATA_SCENARIOS,
} from './clinic-diagnostic-code-link.fixtures.js';

describe('clinic-diagnostic-code-link.util', () => {
  it.each(CLINIC_DIAGNOSTIC_CODE_KIND_MATCH_SCENARIOS)(
    'validates service/code kind pairing for $id',
    ({ serviceType, codeKind, allowed }) => {
      const error = validateClinicDiagnosticCodeKindMatch(
        serviceType,
        codeKind,
      );
      if (allowed) {
        expect(error).toBeNull();
      } else {
        expect(error).toContain('Expected a');
      }
    },
  );

  it('expects diagnostic codes for consultations and procedure codes for lab services', () => {
    expect(expectedClinicDiagnosticCodeKindForServiceType('consultation')).toBe(
      'diagnostic',
    );
    expect(expectedClinicDiagnosticCodeKindForServiceType('lab_test')).toBe(
      'procedure',
    );
    expect(expectedClinicDiagnosticCodeKindForServiceType('procedure')).toBe(
      'procedure',
    );
    expect(expectedClinicDiagnosticCodeKindForServiceType(null)).toBeNull();
  });

  it('requires procedure codes for clinic test types', () => {
    expect(
      validateClinicTestTypeDiagnosticCodeKind(
        CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES.labProcedure.codeKind,
      ),
    ).toBeNull();
    expect(validateClinicTestTypeDiagnosticCodeKind('diagnostic')).toContain(
      'procedure billing codes',
    );
  });

  it.each(CLINIC_DIAGNOSTIC_CODE_METADATA_SCENARIOS)(
    'reads and writes service metadata links for $id',
    ({ codeId, expected }) => {
      const metadata = applyClinicDiagnosticCodeLinkToServiceMetadata(
        {},
        codeId,
      );
      expect(readClinicDiagnosticCodeIdFromServiceMetadata(metadata)).toBe(
        expected,
      );
    },
  );

  it('maps compact billing code views', () => {
    expect(
      mapClinicDiagnosticCodeLinkView(
        CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES.labProcedure,
      ),
    ).toEqual(CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES.labProcedure);
  });
});
