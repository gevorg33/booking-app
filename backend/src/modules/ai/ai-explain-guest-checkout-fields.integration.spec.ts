import { validateCommand } from './command-completion.validator.js';
import { handleExplainGuestCheckoutFieldsLogic } from './ai-explain-guest-checkout-fields.logic.js';
import {
  EXPLAIN_GUEST_CHECKOUT_FIELDS_PROMPTS,
  GUEST_CHECKOUT_FIELDS_RESCUE_SCENARIOS,
} from './ai-explain-guest-checkout-fields.fixtures.js';
import { rescueExplainGuestCheckoutFieldsIntent } from './ai-explain-guest-checkout-fields.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai explain guest checkout fields integration (ai-cmd-customer-4.2.2)', () => {
  const businessRepo = { findOne: jest.fn() };

  const deps = { businessRepo };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {},
    });
  });

  it.each(EXPLAIN_GUEST_CHECKOUT_FIELDS_PROMPTS)(
    'validates and executes $id',
    async ({ prompt, aspect }) => {
      const validation = validateCommand(
        makeResolvedCommand({
          action: 'explain_guest_checkout_fields',
          params: { aspect },
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleExplainGuestCheckoutFieldsLogic(
        deps,
        'biz-1',
        { aspect },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_guest_checkout_fields');
    },
  );

  it.each(GUEST_CHECKOUT_FIELDS_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainGuestCheckoutFieldsIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'guest_checkout_fields',
      });
    },
  );
});
