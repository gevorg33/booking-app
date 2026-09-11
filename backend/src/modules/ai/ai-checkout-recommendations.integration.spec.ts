import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import { EXPLAIN_CHECKOUT_RECOMMENDATIONS_PROMPTS } from './ai-checkout-recommendations.fixtures.js';
import { handleExplainCheckoutRecommendationsLogic } from './ai-checkout-recommendations.logic.js';
import { AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_RECOMMENDATIONS_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai checkout recommendations integration (ai-cmd-rec-5)', () => {
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

  it.each(EXPLAIN_CHECKOUT_RECOMMENDATIONS_PROMPTS)(
    'rescues explain_checkout_recommendations for $id',
    ({ prompt, aspect, serviceName }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_checkout_recommendations');

      const params: Record<string, unknown> = {
        serviceId: 'svc-haircut',
      };
      if (aspect) params.aspect = aspect;
      if (serviceName) params.serviceName = serviceName;

      const validation = validateCommand(
        makeResolvedCommand({
          action: 'explain_checkout_recommendations',
          params,
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);
    },
  );

  it('passes deterministic eval golden cases', async () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_RECOMMENDATIONS_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it('executes logic for public success-screen prompt', async () => {
    const result = await handleExplainCheckoutRecommendationsLogic(
      deps() as any,
      'biz-1',
      { serviceId: 'svc-haircut', aspect: 'whyShown' },
      'Why am I seeing shampoo recommendations after I booked?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Haircut');
  });
});
