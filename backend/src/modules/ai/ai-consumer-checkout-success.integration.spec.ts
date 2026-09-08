import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import { EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_PROMPTS } from './ai-consumer-checkout-success.fixtures.js';
import { EN_CONSUMER_CHECKOUT_SUCCESS_EVAL_SCENARIOS } from './ai-consumer-checkout-success-en.fixtures.js';
import { handleExplainConsumerCheckoutSuccessLogic } from './ai-consumer-checkout-success.logic.js';
import {
  AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_EN_CASES,
  AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_CASES,
} from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai consumer checkout success integration (ai-cmd-rec-6)', () => {
  const business = {
    id: 'biz-1',
    settings: { publicBooking: { recommendations: { maxProductCount: 2 } } },
  };

  const haircutService = {
    id: 'svc-haircut',
    businessId: 'biz-1',
    name: 'Haircut',
    categoryId: 'cat-hair',
    isActive: true,
    category: { id: 'cat-hair', name: 'Hair' },
  };

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => business),
    },
    serviceRepo: {
      findOne: jest.fn(async () => haircutService),
      find: jest.fn(async () => [haircutService]),
    },
    bookingRepo: {
      findOne: jest.fn(async () => null),
    },
    productRecommendationService: {
      getCheckoutRecommendations: jest.fn(async () => [
        { id: 'prod-1', name: 'Shampoo', price: 18 },
      ]),
    },
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_PROMPTS)(
    'rescues explain_consumer_checkout_success for $id',
    ({ prompt, aspect }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_consumer_checkout_success');

      const params: Record<string, unknown> = {
        serviceId: 'svc-haircut',
      };
      if (aspect) params.aspect = aspect;

      const validation = validateCommand(makeResolvedCommand({
        action: 'explain_consumer_checkout_success',
        params,
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);
    },
  );

  it.each(EN_CONSUMER_CHECKOUT_SUCCESS_EVAL_SCENARIOS)(
    'rescues explain_consumer_checkout_success for EN scenario $id',
    ({ prompt, aspect }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_consumer_checkout_success');
      if (aspect) expect(rescued?.params?.aspect).toBe(aspect);
    },
  );

  it('passes deterministic eval golden cases', async () => {
    for (const evalCase of [
      ...AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_CASES,
      ...AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_EN_CASES,
    ]) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it('executes logic for consumer success-screen walkthrough', async () => {
    const result = await handleExplainConsumerCheckoutSuccessLogic(
      deps() as any,
      'biz-1',
      { serviceId: 'svc-haircut', aspect: 'all' },
      'Walk me through the consumer app screen after I finish booking',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Haircut');
    expect(result.summary).toContain('View appointments');
  });
});
