import { MULTILINGUAL_CLINIC_TEST_RESULT_EVAL_SCENARIOS } from './ai-clinic-test-result-multilingual.fixtures.js';
import { assertClinicTestResultParamsPartial } from './ai-clinic-test-result-multilingual.util.js';
import {
  parseEnterTestResultFromPrompt,
  parseReleaseTestResultFromPrompt,
  rescueClinicTestResultIntent,
} from './ai-clinic-test-result.util.js';

describe('ai-clinic-test-result multilingual (i18n-clinic-v2-ai-2)', () => {
  it.each(MULTILINGUAL_CLINIC_TEST_RESULT_EVAL_SCENARIOS)(
    'rescues $locale $id → $expectedAction',
    ({ prompt, expectedAction, rescueReason, paramsPartial }) => {
      const rescued = rescueClinicTestResultIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);

      const parsed =
        expectedAction === 'enter_test_result'
          ? parseEnterTestResultFromPrompt(prompt)
          : parseReleaseTestResultFromPrompt(prompt);
      assertClinicTestResultParamsPartial(parsed, paramsPartial);
    },
  );
});
