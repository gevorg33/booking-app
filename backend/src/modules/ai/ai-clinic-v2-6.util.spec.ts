import {
  CLINIC_V2_CROSS_SURFACE_CLASSIFIER_RULES,
  CLINIC_V2_CUSTOMER_SCENARIOS,
  CLINIC_V2_DASHBOARD_SCENARIOS,
  CLINIC_V2_MIN_PROMPTS_PER_SURFACE,
  CLINIC_V2_PROVIDER_SCENARIOS,
  CLINIC_V2_PUBLIC_SCENARIOS,
  CLINIC_V2_SURFACE_SCENARIOS,
} from './ai-clinic-v2-6.fixtures.js';
import {
  assertClinicV2SurfaceCoverage,
  buildClinicV2SurfaceEvalCases,
  clinicV2ScenarioToEvalCase,
  countClinicV2ScenariosBySurface,
  getClinicV2ClassifierRulesForSurface,
  getClinicV2ScenariosForSurface,
} from './ai-clinic-v2-6.util.js';

describe('ai-clinic-v2-6.util', () => {
  it('meets minimum NL prompt count per surface', () => {
    const counts = assertClinicV2SurfaceCoverage();
    expect(counts.dashboard).toBeGreaterThanOrEqual(
      CLINIC_V2_MIN_PROMPTS_PER_SURFACE,
    );
    expect(counts.provider).toBeGreaterThanOrEqual(
      CLINIC_V2_MIN_PROMPTS_PER_SURFACE,
    );
    expect(counts.customer).toBeGreaterThanOrEqual(
      CLINIC_V2_MIN_PROMPTS_PER_SURFACE,
    );
    expect(counts.public).toBeGreaterThanOrEqual(
      CLINIC_V2_MIN_PROMPTS_PER_SURFACE,
    );
  });

  it('returns surface-specific classifier rule bundles', () => {
    expect(getClinicV2ClassifierRulesForSurface('dashboard')).toContain(
      'create_test_order',
    );
    expect(getClinicV2ClassifierRulesForSurface('dashboard')).toContain(
      'explain_patient_chart',
    );
    expect(getClinicV2ClassifierRulesForSurface('provider')).toContain(
      'list_my_collection_queue',
    );
    expect(getClinicV2ClassifierRulesForSurface('customer')).toContain(
      'My Results tab',
    );
    expect(getClinicV2ClassifierRulesForSurface('public')).toContain(
      'booking page',
    );
    expect(CLINIC_V2_CROSS_SURFACE_CLASSIFIER_RULES).toContain('dashboard:');
  });

  it('filters scenarios by surface', () => {
    expect(getClinicV2ScenariosForSurface('customer')).toEqual(
      CLINIC_V2_CUSTOMER_SCENARIOS,
    );
    expect(getClinicV2ScenariosForSurface('public')).toEqual(
      CLINIC_V2_PUBLIC_SCENARIOS,
    );
    expect(
      countClinicV2ScenariosBySurface(CLINIC_V2_SURFACE_SCENARIOS).dashboard,
    ).toBe(CLINIC_V2_DASHBOARD_SCENARIOS.length);
    expect(
      countClinicV2ScenariosBySurface(CLINIC_V2_SURFACE_SCENARIOS).provider,
    ).toBe(CLINIC_V2_PROVIDER_SCENARIOS.length);
  });

  it('maps every surface scenario to an eval golden case', () => {
    const evalCases = buildClinicV2SurfaceEvalCases();
    expect(evalCases).toHaveLength(CLINIC_V2_SURFACE_SCENARIOS.length);
    for (const scenario of CLINIC_V2_SURFACE_SCENARIOS) {
      const evalCase = clinicV2ScenarioToEvalCase(scenario);
      expect(evalCase.id).toBe(`clinic-v2-${scenario.id}`);
      expect(evalCase.expect.rescuedAction).toBe(scenario.expectedAction);
    }
  });
});
