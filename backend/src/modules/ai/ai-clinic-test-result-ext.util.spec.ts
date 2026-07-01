import {
  CLINIC_TEST_RESULT_EXT_RESCUE_SCENARIOS,
  CONFIGURE_TEST_REFERENCE_RANGE_PROMPTS,
  EXPLAIN_PATIENT_RESULTS_PROMPTS,
  LIST_ABNORMAL_RESULTS_PROMPTS,
  UPLOAD_PATIENT_RESULT_PROMPTS,
} from './ai-clinic-test-result-ext.fixtures.js';
import { MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS } from './ai-clinic-test-result-ext-multilingual.fixtures.js';
import {
  assertClinicTestResultExtMultilingualScenario,
  isClinicTestResultExtPromptForIntent,
  parseClinicTestResultExtFromPrompt,
} from './ai-clinic-test-result-ext-multilingual.util.js';
import { assertClinicTestResultParamsPartial } from './ai-clinic-test-result-multilingual.util.js';
import {
  isConfigureTestReferenceRangePrompt,
  isExplainPatientResultsPrompt,
  isListAbnormalResultsPrompt,
  isUploadPatientResultPrompt,
  parseConfigureTestReferenceRangeFromPrompt,
  parseExplainPatientResultsFromPrompt,
  parseUploadPatientResultFromPrompt,
  detectClinicTestResultExtIntentFromPrompt,
  rescueClinicTestResultExtIntent,
} from './ai-clinic-test-result-ext.util.js';
import { rescueClinicTestResultIntent } from './ai-clinic-test-result.util.js';

describe('ai-clinic-test-result-ext.util (ai-cmd-ext-2.1–2.4)', () => {
  it.each(UPLOAD_PATIENT_RESULT_PROMPTS)(
    'detects upload patient result prompt $id',
    ({ prompt, orderId }) => {
      expect(isUploadPatientResultPrompt(prompt)).toBe(true);
      expect(parseUploadPatientResultFromPrompt(prompt)?.orderId).toBe(orderId);
    },
  );

  it.each(EXPLAIN_PATIENT_RESULTS_PROMPTS)(
    'detects explain patient results prompt $id',
    ({ prompt, customerName, orderId }) => {
      expect(isExplainPatientResultsPrompt(prompt)).toBe(true);
      const parsed = parseExplainPatientResultsFromPrompt(prompt);
      if (customerName) expect(parsed?.customerName).toBe(customerName);
      if (orderId) expect(parsed?.orderId).toBe(orderId);
    },
  );

  it.each(CONFIGURE_TEST_REFERENCE_RANGE_PROMPTS)(
    'detects configure reference range prompt $id',
    ({ prompt, measurementCode, normalLow, normalHigh }) => {
      expect(isConfigureTestReferenceRangePrompt(prompt)).toBe(true);
      const parsed = parseConfigureTestReferenceRangeFromPrompt(prompt);
      expect(parsed?.measurementCode).toBe(measurementCode);
      expect(parsed?.normalLow).toBe(normalLow);
      expect(parsed?.normalHigh).toBe(normalHigh);
    },
  );

  it.each(LIST_ABNORMAL_RESULTS_PROMPTS)(
    'detects list abnormal results prompt $id',
    ({ prompt }) => {
      expect(isListAbnormalResultsPrompt(prompt)).toBe(true);
    },
  );

  it.each(CLINIC_TEST_RESULT_EXT_RESCUE_SCENARIOS)(
    'rescues ext intent for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueClinicTestResultExtIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
      expect(
        rescueClinicTestResultIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('does not treat manual entry as upload', () => {
    const prompt = 'Enter WBC 12.5 for order abc123';
    expect(isUploadPatientResultPrompt(prompt)).toBe(false);
    expect(
      rescueClinicTestResultIntent(prompt, 'list_test_orders')?.action,
    ).toBe('enter_test_result');
  });

  it('does not treat chart explain as patient results explain', () => {
    expect(
      isExplainPatientResultsPrompt('Explain patient chart for Maria'),
    ).toBe(false);
  });

  it('does not treat order queue as abnormal list', () => {
    expect(
      isListAbnormalResultsPrompt('List test orders awaiting results'),
    ).toBe(false);
  });

  it('returns null when ext action already matches', () => {
    expect(
      rescueClinicTestResultExtIntent(
        'Upload lab result for order #abc123',
        'upload_patient_result',
      ),
    ).toBeNull();
  });

  it('parses configure range without numeric bounds', () => {
    const parsed = parseConfigureTestReferenceRangeFromPrompt(
      'Set hemoglobin reference range',
      { measurementCode: 'hemoglobin' },
    );
    expect(parsed?.measurementCode).toBe('hemoglobin');
    expect(parsed?.normalLow).toBeUndefined();
  });

  it('parses upload with params fallback', () => {
    expect(
      parseUploadPatientResultFromPrompt('attach lab file', {
        orderId: 'ord-1',
      })?.orderId,
    ).toBe('ord-1');
  });

  it('detects configure prompt with range-of phrasing', () => {
    expect(
      isConfigureTestReferenceRangePrompt(
        'Update reference range of hemoglobin from 12.0 to 17.5',
      ),
    ).toBe(true);
  });

  it('returns null for unrelated clinic prompts', () => {
    expect(
      rescueClinicTestResultExtIntent('List employees', 'unknown'),
    ).toBeNull();
  });
});

describe('detectClinicTestResultExtIntentFromPrompt (ai-cmd-clinic-6-gap-2.3)', () => {
  it('detects direct classifier action without rescue for top EN upload prompt', () => {
    const prompt = 'Upload lab result for order #abc123';
    expect(detectClinicTestResultExtIntentFromPrompt(prompt)).toEqual({
      action: 'upload_patient_result',
      params: { orderId: 'abc123' },
    });
    expect(
      rescueClinicTestResultExtIntent(prompt, 'upload_patient_result'),
    ).toBeNull();
  });
});

describe('ai-clinic-test-result-ext multilingual (ai-cmd-clinic-6-gap-1.5)', () => {
  it.each(MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS)(
    'detects $locale ext prompt $id',
    (scenario) => {
      expect(
        isClinicTestResultExtPromptForIntent(
          scenario.prompt,
          scenario.expectedAction,
        ),
      ).toBe(true);
    },
  );

  it.each(
    MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS.filter(
      (scenario) => scenario.expectedAction !== 'list_abnormal_results',
    ),
  )('parses $locale ext prompt $id', (scenario) => {
    const parsed = parseClinicTestResultExtFromPrompt(
      scenario.prompt,
      scenario.expectedAction,
    );
    assertClinicTestResultParamsPartial(parsed, scenario.paramsPartial);
  });

  it.each(MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS)(
    'rescues $locale ext prompt $id → $expectedAction',
    (scenario) => {
      assertClinicTestResultExtMultilingualScenario(scenario);
    },
  );
});
