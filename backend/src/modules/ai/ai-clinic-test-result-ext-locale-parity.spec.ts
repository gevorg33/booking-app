import {
  listClinicTestResultExtEvalLocaleParityGaps,
  listClinicTestResultExtLocaleParityGaps,
  clinicTestResultExtEnEvalCaseId,
  clinicTestResultExtMultilingualEvalCaseId,
} from './ai-clinic-test-result-ext-locale-parity.util.js';
import {
  CLINIC_TEST_RESULT_EXT_EN_SCENARIO_IDS,
  MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS,
} from './ai-clinic-test-result-ext-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CASES,
  AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
} from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-clinic-test-result-ext locale parity (ai-cmd-clinic-6-gap-1.4 / parity-2.4)', () => {
  it('has HY/RU siblings for every representative EN ext scenario', () => {
    expect(listClinicTestResultExtLocaleParityGaps()).toEqual([]);
  });

  it('multilingual scenario count matches EN ids × 2 locales', () => {
    expect(MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS).toHaveLength(
      CLINIC_TEST_RESULT_EXT_EN_SCENARIO_IDS.length * 2,
    );
  });

  it('maps every EN ext eval id to HY + RU eval golden cases', () => {
    expect(
      listClinicTestResultExtEvalLocaleParityGaps(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      ),
    ).toEqual([]);
  });

  it('registers EN + HY/RU ext eval cases in deterministic suite', () => {
    const evalIds = new Set(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((row) => row.id),
    );
    for (const enScenarioId of CLINIC_TEST_RESULT_EXT_EN_SCENARIO_IDS) {
      expect(evalIds.has(clinicTestResultExtEnEvalCaseId(enScenarioId))).toBe(
        true,
      );
    }
    for (const row of MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS) {
      expect(evalIds.has(clinicTestResultExtMultilingualEvalCaseId(row))).toBe(
        true,
      );
    }
  });

  it('tags HY/RU ext eval rows with dashboard surface, locale, and needsMultilingual', () => {
    const hyCases = AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CASES.filter(
      (row) => row.locale === 'hy',
    );
    const ruCases = AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CASES.filter(
      (row) => row.locale === 'ru',
    );

    expect(hyCases.length).toBe(CLINIC_TEST_RESULT_EXT_EN_SCENARIO_IDS.length);
    expect(ruCases.length).toBe(CLINIC_TEST_RESULT_EXT_EN_SCENARIO_IDS.length);
    expect(hyCases.every((row) => row.surface === 'dashboard')).toBe(true);
    expect(ruCases.every((row) => row.surface === 'dashboard')).toBe(true);
    expect(
      AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CASES.every(
        (row) => row.expect.needsMultilingual === true,
      ),
    ).toBe(true);
    expect(AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CASES.length).toBeGreaterThan(
      CLINIC_TEST_RESULT_EXT_EN_SCENARIO_IDS.length,
    );
  });

  it.each(
    MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes clinic ext i18n eval case %s', (_id, scenario) => {
    const evalCase = AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CASES.find(
      (row) => row.id === clinicTestResultExtMultilingualEvalCaseId(scenario),
    );
    expect(evalCase).toBeDefined();
    expect(evalCase?.locale).toBe(scenario.locale);
    expect(evalCase?.expect.rescuedAction).toBe(scenario.expectedAction);
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });
});
