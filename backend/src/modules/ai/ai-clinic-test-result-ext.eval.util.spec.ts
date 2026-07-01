import {
  CLINIC_TEST_RESULT_EXT_INTENTS,
  CLINIC_TEST_RESULT_EXT_MUTATE_INTENTS,
  CLINIC_TEST_RESULT_EXT_READ_INTENTS,
} from './ai-clinic-test-result-ext.util.js';
import {
  assertClinicTestResultExtAccessTierMatchesMatrix,
  buildClinicTestResultExtEvalExpectation,
  CLINIC_TEST_RESULT_EXT_DASHBOARD_ALLOWED_TIERS,
  resolveClinicTestResultAccessTier,
  resolveClinicTestResultExtAccessTier,
} from './ai-clinic-test-result-ext.eval.util.js';
import { isDashboardIntentAllowed } from './access-control.matrix.js';

describe('ai-clinic-test-result-ext.eval.util', () => {
  it.each([
    ['upload_patient_result', 'M'],
    ['configure_test_reference_range', 'M'],
    ['explain_patient_results', 'R'],
    ['list_abnormal_results', 'R'],
  ] as const)('maps %s to access tier %s', (action, accessTier) => {
    expect(resolveClinicTestResultExtAccessTier(action)).toBe(accessTier);
    expect(
      assertClinicTestResultExtAccessTierMatchesMatrix(action, accessTier),
    ).toEqual([]);
  });

  it('cross-refs access-control.matrix deny/allow lists for ext intents', () => {
    for (const action of CLINIC_TEST_RESULT_EXT_INTENTS) {
      expect(isDashboardIntentAllowed('client', action)).toBe(false);
      for (const tier of CLINIC_TEST_RESULT_EXT_DASHBOARD_ALLOWED_TIERS) {
        expect(isDashboardIntentAllowed(tier, action)).toBe(true);
      }
    }
  });

  it('buildClinicTestResultExtEvalExpectation stamps rescuedAction + accessTier', () => {
    expect(
      buildClinicTestResultExtEvalExpectation('upload_patient_result', {
        rescueReason: 'upload_patient_result',
        paramsPartial: { orderId: 'ord-1' },
      }),
    ).toEqual({
      rescuedAction: 'upload_patient_result',
      accessTier: 'M',
      rescueReason: 'upload_patient_result',
      paramsPartial: { orderId: 'ord-1' },
    });
  });

  it('keeps mutate/read partitions aligned with ext util constants', () => {
    for (const action of CLINIC_TEST_RESULT_EXT_MUTATE_INTENTS) {
      expect(resolveClinicTestResultExtAccessTier(action)).toBe('M');
      expect(resolveClinicTestResultAccessTier(action)).toBe('M');
    }
    for (const action of CLINIC_TEST_RESULT_EXT_READ_INTENTS) {
      expect(resolveClinicTestResultExtAccessTier(action)).toBe('R');
      expect(resolveClinicTestResultAccessTier(action)).toBe('R');
    }
    expect(resolveClinicTestResultAccessTier('enter_test_result')).toBe('M');
    expect(resolveClinicTestResultAccessTier('release_test_result')).toBe('M');
  });
});
