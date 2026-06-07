import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  CLINIC_TEST_ORDER_RESCUE_SCENARIOS,
  CREATE_TEST_ORDER_PROMPTS,
} from './ai-clinic-test-order.fixtures.js';

describe('AiClinicTestOrder integration', () => {
  const rescueService = new AiIntentRescueService();

  it.each(CLINIC_TEST_ORDER_RESCUE_SCENARIOS)(
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

  it.each(CREATE_TEST_ORDER_PROMPTS.slice(0, 3))(
    'rescues unknown classifier for $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('create_test_order');
    },
  );
});
