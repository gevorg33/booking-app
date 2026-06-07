import { MULTILINGUAL_CONSUMER_CLINIC_TEST_RESULTS_EVAL_SCENARIOS } from './ai-consumer-clinic-test-results-multilingual.fixtures.js';
import {
  parseExplainResultStatusFromPrompt,
  parseListMyTestResultsFromPrompt,
  rescueConsumerClinicTestResultsIntent,
} from './ai-consumer-clinic-test-results.util.js';

describe('ai-consumer-clinic-test-results multilingual (i18n-clinic-v2-ai-5)', () => {
  it.each(MULTILINGUAL_CONSUMER_CLINIC_TEST_RESULTS_EVAL_SCENARIOS)(
    'rescues $locale $surface $id → $expectedAction',
    ({ prompt, expectedAction, rescueReason, paramsPartial }) => {
      const rescued = rescueConsumerClinicTestResultsIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);

      const parsed =
        expectedAction === 'list_my_test_results'
          ? parseListMyTestResultsFromPrompt(prompt)
          : parseExplainResultStatusFromPrompt(prompt);
      expect(parsed).not.toBeNull();

      if (paramsPartial?.status) {
        expect(
          'status' in (parsed ?? {})
            ? (parsed as { status?: string }).status
            : undefined,
        ).toBe(paramsPartial.status);
      }
      if (paramsPartial?.testName) {
        expect(
          'testName' in (parsed ?? {})
            ? (parsed as { testName?: string }).testName
            : undefined,
        ).toBe(paramsPartial.testName);
      }
    },
  );
});
