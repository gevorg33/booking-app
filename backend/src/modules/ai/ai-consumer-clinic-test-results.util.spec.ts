import {
  CONSUMER_CLINIC_TEST_RESULTS_RESCUE_SCENARIOS,
  EXPLAIN_RESULT_STATUS_PROMPTS,
  LIST_MY_TEST_RESULTS_PROMPTS,
} from './ai-consumer-clinic-test-results.fixtures.js';
import {
  CLINIC_V2_CUSTOMER_LIST_PROMPTS,
  CLINIC_V2_PUBLIC_EXPLAIN_PROMPTS,
  CLINIC_V2_PUBLIC_LIST_PROMPTS,
} from './ai-clinic-v2-6.fixtures.js';
import {
  extractResultStatusFromPrompt,
  isExplainResultStatusPrompt,
  isListMyTestResultsPrompt,
  parseExplainResultStatusFromPrompt,
  parseListMyTestResultsFromPrompt,
  rescueConsumerClinicTestResultsIntent,
} from './ai-consumer-clinic-test-results.util.js';

describe('ai-consumer-clinic-test-results.util', () => {
  it.each([
    'Replan my day for tomorrow',
    'What is my loyalty points balance',
    'Track my physical gift card order',
    'Notify patient lab results are ready',
  ])(
    'does not treat staff or non-results prompts as list my results (%s)',
    (prompt) => {
      expect(isListMyTestResultsPrompt(prompt)).toBe(false);
      expect(
        rescueConsumerClinicTestResultsIntent(prompt, 'unknown'),
      ).toBeNull();
    },
  );

  it.each(LIST_MY_TEST_RESULTS_PROMPTS)(
    'detects list my test results prompt $id',
    ({ prompt }) => {
      expect(isListMyTestResultsPrompt(prompt)).toBe(true);
      expect(parseListMyTestResultsFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(EXPLAIN_RESULT_STATUS_PROMPTS)(
    'detects explain result status prompt $id',
    ({ prompt, status, testName }) => {
      expect(isExplainResultStatusPrompt(prompt)).toBe(true);
      const parsed = parseExplainResultStatusFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (status) expect(parsed?.status).toBe(status);
      if (testName) {
        expect(parsed?.testName?.toLowerCase()).toContain(
          testName.toLowerCase(),
        );
      }
    },
  );

  it('extracts released status from prompt', () => {
    expect(
      extractResultStatusFromPrompt('When are results marked as released?'),
    ).toBe('Released');
  });

  it.each(CONSUMER_CLINIC_TEST_RESULTS_RESCUE_SCENARIOS)(
    'rescues misclassified action for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueConsumerClinicTestResultsIntent(
        prompt,
        misclassifiedAction,
      );
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(CLINIC_V2_CUSTOMER_LIST_PROMPTS.slice(0, 4))(
    'detects customer surface list prompt $id',
    ({ prompt }) => {
      expect(isListMyTestResultsPrompt(prompt)).toBe(true);
    },
  );

  it.each(CLINIC_V2_PUBLIC_LIST_PROMPTS.slice(0, 4))(
    'detects public surface list prompt $id',
    ({ prompt }) => {
      expect(isListMyTestResultsPrompt(prompt)).toBe(true);
    },
  );

  it.each(CLINIC_V2_PUBLIC_EXPLAIN_PROMPTS.slice(0, 4))(
    'detects public surface explain prompt $id',
    ({ prompt }) => {
      expect(isExplainResultStatusPrompt(prompt)).toBe(true);
    },
  );

  it('does not treat dashboard lab orders as patient result prompts', () => {
    expect(
      isListMyTestResultsPrompt('List pending lab orders for this week'),
    ).toBe(false);
    expect(
      isExplainResultStatusPrompt('List pending lab orders for this week'),
    ).toBe(false);
  });
});
