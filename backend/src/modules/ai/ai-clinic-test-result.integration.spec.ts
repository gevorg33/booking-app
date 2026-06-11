import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  CLINIC_TEST_RESULT_EXT_RESCUE_SCENARIOS,
  LIST_ABNORMAL_RESULTS_PROMPTS,
  UPLOAD_PATIENT_RESULT_PROMPTS,
} from './ai-clinic-test-result-ext.fixtures.js';
import {
  CLINIC_TEST_RESULT_RESCUE_SCENARIOS,
  ENTER_TEST_RESULT_PROMPTS,
  RELEASE_TEST_RESULT_PROMPTS,
} from './ai-clinic-test-result.fixtures.js';

describe('AiClinicTestResult integration', () => {
  const rescueService = new AiIntentRescueService();

  it.each(CLINIC_TEST_RESULT_RESCUE_SCENARIOS)(
    'rescues dashboard prompt $id',
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

  it.each(ENTER_TEST_RESULT_PROMPTS.slice(0, 3))(
    'rescues unknown classifier for enter prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('enter_test_result');
    },
  );

  it.each(RELEASE_TEST_RESULT_PROMPTS.slice(0, 3))(
    'rescues unknown classifier for release prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('release_test_result');
    },
  );

  it.each(CLINIC_TEST_RESULT_EXT_RESCUE_SCENARIOS)(
    'rescues ext clinic test result prompt $id',
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

  it.each(UPLOAD_PATIENT_RESULT_PROMPTS.slice(0, 3))(
    'rescues unknown upload prompt $id with orderId',
    ({ prompt, orderId }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('upload_patient_result');
      expect(rescued?.params.orderId).toBe(orderId);
    },
  );

  it.each(LIST_ABNORMAL_RESULTS_PROMPTS.slice(0, 3))(
    'rescues unknown abnormal list prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('list_abnormal_results');
    },
  );
});
