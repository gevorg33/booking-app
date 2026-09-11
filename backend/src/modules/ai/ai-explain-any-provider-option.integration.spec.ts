import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import {
  EXPLAIN_ANY_PROVIDER_OPTION_PROMPTS,
  EXPLAIN_ANY_PROVIDER_OPTION_RESCUE_SCENARIOS,
} from './ai-explain-any-provider-option.fixtures.js';
import { EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_SCENARIOS } from './ai-explain-any-provider-option-multilingual.fixtures.js';
import { handleExplainAnyProviderOptionLogic } from './ai-explain-any-provider-option.logic.js';
import { rescueExplainAnyProviderOptionIntent } from './ai-explain-any-provider-option.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai explain any provider option integration (ai-cmd-customer-4.11.1)', () => {
  const employeeRepo = {
    count: jest.fn(async () => 5),
  };

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
    employeeRepo.count.mockResolvedValue(5);
  });

  it.each([
    ...EXPLAIN_ANY_PROVIDER_OPTION_PROMPTS,
    ...EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_SCENARIOS,
  ])(
    'rescues and executes explain any provider option $id',
    async ({ prompt, aspect }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_any_provider_option');

      const directRescue = rescueExplainAnyProviderOptionIntent(
        prompt,
        'unknown',
      );
      expect(directRescue?.action).toBe('explain_any_provider_option');

      const validation = validateCommand(
        makeResolvedCommand({
          action: 'explain_any_provider_option',
          params: { ...(aspect ? { aspect } : {}) },
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleExplainAnyProviderOptionLogic(
        { employeeRepo },
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_any_provider_option');
    },
  );

  it.each(EXPLAIN_ANY_PROVIDER_OPTION_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id via direct rescue',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainAnyProviderOptionIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('explain_any_provider_option');
    },
  );
});
