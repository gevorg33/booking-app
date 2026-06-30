import { CLINIC_TEST_RESULT_EXT_CLASSIFIER_SCENARIOS } from './ai-clinic-test-result-ext-classifier.fixtures.js';
import {
  AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CLASSIFIER_CASES,
  assertClinicTestResultExtClassifierDetect,
  buildClinicTestResultExtClassifierEvalExpectation,
  clinicTestResultExtClassifierScenarioToEvalCase,
} from './ai-clinic-test-result-ext.eval.util.js';

describe('ai-clinic-test-result-ext-classifier.fixtures', () => {
  it('defines 12 top EN/HY/RU classifier golden rows (ai-cmd-clinic-6-gap-2.3)', () => {
    expect(CLINIC_TEST_RESULT_EXT_CLASSIFIER_SCENARIOS).toHaveLength(12);
    expect(
      CLINIC_TEST_RESULT_EXT_CLASSIFIER_SCENARIOS.filter((row) => row.locale === 'en'),
    ).toHaveLength(4);
    expect(
      CLINIC_TEST_RESULT_EXT_CLASSIFIER_SCENARIOS.filter((row) => row.locale === 'hy'),
    ).toHaveLength(4);
    expect(
      CLINIC_TEST_RESULT_EXT_CLASSIFIER_SCENARIOS.filter((row) => row.locale === 'ru'),
    ).toHaveLength(4);
  });
});

describe('ai-clinic-test-result-ext.eval.util classifier (ai-cmd-clinic-6-gap-2.3)', () => {
  it.each(CLINIC_TEST_RESULT_EXT_CLASSIFIER_SCENARIOS)(
    'detects classifier action without rescue ($id)',
    (scenario) => {
      const evalExpect = buildClinicTestResultExtClassifierEvalExpectation(
        scenario.expectedAction,
        {
          ...(scenario.paramsPartial
            ? { paramsPartial: scenario.paramsPartial }
            : {}),
          ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
        },
      );
      expect(
        assertClinicTestResultExtClassifierDetect(scenario.prompt, evalExpect),
      ).toEqual([]);
    },
  );

  it('maps classifier scenarios to eval cases with direct action only', () => {
    for (const scenario of CLINIC_TEST_RESULT_EXT_CLASSIFIER_SCENARIOS) {
      const evalCase = clinicTestResultExtClassifierScenarioToEvalCase(scenario);
      expect(evalCase.surface).toBe('dashboard');
      expect(evalCase.expect.action).toBe(scenario.expectedAction);
      expect(evalCase.expect.rescuedAction).toBeUndefined();
      expect(evalCase.expect.useClinicTestResultExtClassifierDetect).toBe(true);
      expect(evalCase.expect.accessTier).toMatch(/^[MR]$/);
    }
    expect(AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CLASSIFIER_CASES).toHaveLength(
      12,
    );
  });
});
