import { mapClinicDiagnosticCodeView } from './clinic-diagnostic-code-map.util.js';
import { CLINIC_DIAGNOSTIC_CODE_FIXTURES } from './clinic-diagnostic-codes.fixtures.js';
import type { ClinicDiagnosticCode } from './entities/clinic-diagnostic-code.entity.js';

describe('clinic-diagnostic-code-map.util', () => {
  it('maps entity fields to API view', () => {
    const view = mapClinicDiagnosticCodeView(
      CLINIC_DIAGNOSTIC_CODE_FIXTURES[0] as ClinicDiagnosticCode,
    );

    expect(view).toEqual({
      id: 'code-diag-1',
      businessId: 'biz-1',
      codeKind: 'diagnostic',
      codeSystem: 'ICD-10-CM',
      code: 'E11.9',
      description: 'Type 2 diabetes mellitus without complications',
      searchDescription: 'E11.9 Type 2 diabetes mellitus without complications',
      isActive: true,
      createdAt: '2026-06-01T10:00:00.000Z',
      updatedAt: '2026-06-02T10:00:00.000Z',
    });
  });
});
