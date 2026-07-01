import {
  CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES,
  MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS,
  assertClinicTestResultExtMultilingualCoverage,
} from './ai-clinic-test-result-ext-multilingual.fixtures.js';

const LATIN_MEASUREMENT_CODE =
  /\b(?:WBC|CBC|BMP|glucose|hemoglobin|LDL|sodium)\b/i;

describe('ai-clinic-test-result-ext-multilingual.fixtures (ai-cmd-clinic-6-gap-1.1)', () => {
  it('ships classifier rules for dashboard HY/RU ext intents', () => {
    expect(CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES).toContain(
      'upload_patient_result',
    );
    expect(CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES).toContain(
      'explain_patient_results',
    );
    expect(CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES).toContain(
      'configure_test_reference_range',
    );
    expect(CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES).toContain(
      'list_abnormal_results',
    );
    expect(CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES).toContain(
      'WBC',
    );
  });

  it('covers at least four HY and four RU prompts per ext intent', () => {
    const counts = assertClinicTestResultExtMultilingualCoverage();
    expect(counts.upload_patient_result).toEqual({
      hy: 4,
      ru: 4,
      en: 0,
      translit: 0,
    });
    expect(counts.explain_patient_results).toEqual({
      hy: 4,
      ru: 4,
      en: 0,
      translit: 0,
    });
    expect(counts.configure_test_reference_range).toEqual({
      hy: 4,
      ru: 4,
      en: 0,
      translit: 0,
    });
    expect(counts.list_abnormal_results).toEqual({
      hy: 4,
      ru: 4,
      en: 0,
      translit: 0,
    });
    expect(MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS).toHaveLength(32);
    expect(
      new Set(
        MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS.map(
          (row) => row.enScenarioId,
        ),
      ).size,
    ).toBe(16);
  });

  it.each(
    MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS.filter((row) =>
      Boolean(row.paramsPartial?.measurementCode),
    ).map(
      (row) =>
        [row.id, row.prompt, row.paramsPartial?.measurementCode] as const,
    ),
  )(
    'keeps Latin measurement code in hy/ru prompt %s',
    (_id, prompt, measurementCode) => {
      expect(prompt).toMatch(LATIN_MEASUREMENT_CODE);
      expect(prompt.toLowerCase()).toContain(
        String(measurementCode).toLowerCase(),
      );
    },
  );

  it.each(
    MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS.filter((row) =>
      Boolean(row.paramsPartial?.orderId),
    ).map((row) => [row.id, row.prompt, row.paramsPartial?.orderId] as const),
  )(
    'keeps order id in hy/ru upload/explain prompt %s',
    (_id, prompt, orderId) => {
      expect(prompt).toContain(String(orderId));
    },
  );
});
