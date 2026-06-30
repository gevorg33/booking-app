import { MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS } from './ai-clinic-test-result-ext-multilingual.fixtures.js';
import {
  assertClinicTestResultExtMultilingualScenario,
  isClinicTestResultExtPromptForIntent,
  parseClinicTestResultExtFromPrompt,
} from './ai-clinic-test-result-ext-multilingual.util.js';
import { assertClinicTestResultParamsPartial } from './ai-clinic-test-result-multilingual.util.js';

describe('ai-clinic-test-result-ext-multilingual.util (ai-cmd-clinic-6-gap-1.5)', () => {
  it.each(MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS)(
    'assertClinicTestResultExtMultilingualScenario $locale $id',
    (scenario) => {
      assertClinicTestResultExtMultilingualScenario(scenario);
    },
  );

  it.each(
    MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS.filter(
      (scenario) => scenario.expectedAction === 'list_abnormal_results',
    ),
  )('list abnormal hy/ru prompt $id has empty parse payload', (scenario) => {
    expect(
      isClinicTestResultExtPromptForIntent(
        scenario.prompt,
        scenario.expectedAction,
      ),
    ).toBe(true);
    expect(
      parseClinicTestResultExtFromPrompt(
        scenario.prompt,
        scenario.expectedAction,
      ),
    ).toEqual({});
    assertClinicTestResultParamsPartial({}, scenario.paramsPartial);
  });
});
