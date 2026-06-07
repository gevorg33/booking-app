import { MULTILINGUAL_CLINIC_TEST_RESULT_EVAL_SCENARIOS } from './ai-clinic-test-result-multilingual.fixtures.js';
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
      expect(parsed).not.toBeNull();

      if (paramsPartial?.measurementCode) {
        expect(parsed?.measurementCode).toBe(paramsPartial.measurementCode);
      }
      if (paramsPartial?.value) {
        expect(parsed?.value).toBe(paramsPartial.value);
      }
      if (paramsPartial?.orderId) {
        expect(parsed?.orderId).toBe(paramsPartial.orderId);
      }
      if (paramsPartial?.resultId) {
        expect(parsed?.resultId).toBe(paramsPartial.resultId);
      }
      if (paramsPartial?.customerName) {
        expect(parsed?.customerName).toBe(paramsPartial.customerName);
      }
    },
  );
});
