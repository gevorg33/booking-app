import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { buildClinicV2SurfaceEvalCases } from './ai-clinic-v2-6.util.js';
import {
  CLINIC_V2_DASHBOARD_CLASSIFIER_RULES,
  CLINIC_V2_SURFACE_SCENARIOS,
  CLINIC_V2_CUSTOMER_SCENARIOS,
  CLINIC_V2_PUBLIC_SCENARIOS,
} from './ai-clinic-v2-6.fixtures.js';
import { PROVIDER_MOBILE_CLASSIFIER_RULES } from './ai-provider-mobile.fixtures.js';

describe('AiClinicV2-6 integration', () => {
  it('passes deterministic eval golden cases for every tagged surface scenario', () => {
    for (const evalCase of buildClinicV2SurfaceEvalCases()) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.errors).toEqual([]);
      expect(result.passed).toBe(true);
    }
  });

  it('includes clinic v2 dashboard rules in dashboard intent schema content', () => {
    expect(CLINIC_V2_DASHBOARD_CLASSIFIER_RULES).toContain('create_test_order');
    expect(CLINIC_V2_DASHBOARD_CLASSIFIER_RULES).toContain(
      'release_test_result',
    );
  });

  it('includes provider collection rules in provider mobile appendix', () => {
    expect(PROVIDER_MOBILE_CLASSIFIER_RULES).toContain(
      'list_my_collection_queue',
    );
    expect(PROVIDER_MOBILE_CLASSIFIER_RULES).toContain(
      'mark_specimen_collected',
    );
  });

  it('includes customer clinic appendix in customer classifier schema', () => {
    const schema = buildCustomerClassifierSchema();
    expect(schema).toContain('list_my_test_results');
    expect(schema).toContain('explain_result_status');
    expect(schema).toContain('My Results tab');
  });

  it.each(CLINIC_V2_CUSTOMER_SCENARIOS.slice(0, 4))(
    'customer surface scenario $id has expected action metadata',
    ({ expectedAction, surface }) => {
      expect(surface).toBe('customer');
      expect(['list_my_test_results', 'explain_result_status']).toContain(
        expectedAction,
      );
    },
  );

  it.each(CLINIC_V2_PUBLIC_SCENARIOS.slice(0, 4))(
    'public surface scenario $id has expected action metadata',
    ({ expectedAction, surface }) => {
      expect(surface).toBe('public');
      expect(['list_my_test_results', 'explain_result_status']).toContain(
        expectedAction,
      );
    },
  );

  it('tags every consolidated scenario with a supported surface', () => {
    for (const scenario of CLINIC_V2_SURFACE_SCENARIOS) {
      expect(['dashboard', 'provider', 'customer', 'public']).toContain(
        scenario.surface,
      );
    }
  });
});
