import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_CASES } from './eval/ai-command-eval.cases.js';
import {
  CONSUMER_CLINIC_TEST_RESULTS_RESCUE_SCENARIOS,
  EXPLAIN_RESULT_STATUS_PROMPTS,
  LIST_MY_TEST_RESULTS_PROMPTS,
} from './ai-consumer-clinic-test-results.fixtures.js';

describe('AiConsumerClinicTestResults integration', () => {
  const rescueService = new AiIntentRescueService();

  it.each(CONSUMER_CLINIC_TEST_RESULTS_RESCUE_SCENARIOS)(
    'rescues customer/public prompt $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: misclassifiedAction,
        params: {},
      });
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescued).toBe(true);
    },
  );

  it.each(LIST_MY_TEST_RESULTS_PROMPTS.slice(0, 3))(
    'rescues unknown classifier for list prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('list_my_test_results');
    },
  );

  it.each(EXPLAIN_RESULT_STATUS_PROMPTS.slice(0, 3))(
    'rescues unknown classifier for explain prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_result_status');
    },
  );

  it('passes deterministic eval golden cases (ai-cmd-clinic-v2-5)', () => {
    for (const evalCase of AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.errors).toEqual([]);
      expect(result.passed).toBe(true);
    }
  });
});
