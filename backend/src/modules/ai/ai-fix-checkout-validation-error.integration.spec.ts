import { validateCommand } from './command-completion.validator.js';
import { handleFixCheckoutValidationErrorLogic } from './ai-fix-checkout-validation-error.logic.js';
import {
  FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS,
  FIX_CHECKOUT_VALIDATION_ERROR_RESCUE_SCENARIOS,
} from './ai-fix-checkout-validation-error.fixtures.js';
import { rescueFixCheckoutValidationErrorIntent } from './ai-fix-checkout-validation-error.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai fix checkout validation error integration (ai-cmd-customer-4.2.7)', () => {
  const businessRepo = { findOne: jest.fn() };
  const deps = { businessRepo };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {},
    });
  });

  it.each(FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS)(
    'validates and executes $id',
    async ({ prompt, aspect }) => {
      const validation = validateCommand(makeResolvedCommand({
        action: 'fix_checkout_validation_error',
        params: { aspect },
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const result = await handleFixCheckoutValidationErrorLogic(
        deps,
        'biz-1',
        { aspect },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('fix_checkout_validation_error');
    },
  );

  it.each(FIX_CHECKOUT_VALIDATION_ERROR_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueFixCheckoutValidationErrorIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'checkout_validation_error',
      });
    },
  );
});
