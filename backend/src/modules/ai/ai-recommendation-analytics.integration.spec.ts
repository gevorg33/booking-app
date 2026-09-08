import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import { EXPLAIN_RECOMMENDATION_ANALYTICS_PROMPTS } from './ai-recommendation-analytics.fixtures.js';
import { handleExplainRecommendationAnalyticsLogic } from './ai-recommendation-analytics.logic.js';
import { AI_COMMAND_EVAL_EXPLAIN_RECOMMENDATION_ANALYTICS_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai recommendation analytics integration (ai-cmd-rec-8)', () => {
  const business = { id: 'biz-1', settings: {} };

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => business),
    },
    eventStore: {
      getEvents: jest.fn(async () => []),
    },
    inventoryService: {
      listProducts: jest.fn(async () => []),
    },
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(EXPLAIN_RECOMMENDATION_ANALYTICS_PROMPTS)(
    'rescues explain_recommendation_analytics for $id',
    ({ prompt, aspect }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('explain_recommendation_analytics');

      const params: Record<string, unknown> = {};
      if (aspect) params.aspect = aspect;

      const validation = validateCommand(makeResolvedCommand({
        action: 'explain_recommendation_analytics',
        params,
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_RECOMMENDATION_ANALYTICS_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it('executes logic for analytics overview prompt', async () => {
    const result = await handleExplainRecommendationAnalyticsLogic(
      deps() as any,
      'biz-1',
      { aspect: 'all' },
      'Explain recommendation analytics',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('product_recommendation');
  });
});
