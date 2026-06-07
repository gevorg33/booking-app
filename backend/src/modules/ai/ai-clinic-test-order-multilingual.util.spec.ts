import { MULTILINGUAL_CLINIC_TEST_ORDER_EVAL_SCENARIOS } from './ai-clinic-test-order-multilingual.fixtures.js';
import {
  parseCreateTestOrderFromPrompt,
  parseListTestOrdersFromPrompt,
  rescueClinicTestOrderIntent,
} from './ai-clinic-test-order.util.js';

describe('ai-clinic-test-order multilingual (i18n-clinic-v2-ai-1)', () => {
  it.each(MULTILINGUAL_CLINIC_TEST_ORDER_EVAL_SCENARIOS)(
    'rescues $locale $id → $expectedAction',
    ({ prompt, expectedAction, rescueReason, paramsPartial }) => {
      const rescued = rescueClinicTestOrderIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);

      const parsed =
        expectedAction === 'create_test_order'
          ? parseCreateTestOrderFromPrompt(prompt)
          : parseListTestOrdersFromPrompt(prompt);
      expect(parsed).not.toBeNull();

      if (paramsPartial?.customerName) {
        expect(parsed?.customerName).toBe(paramsPartial.customerName);
      }
      if (paramsPartial?.testNames) {
        expect(parsed?.testNames).toEqual(paramsPartial.testNames);
      }
      if (paramsPartial?.status) {
        expect(parsed?.status).toBe(paramsPartial.status);
      }
    },
  );
});
