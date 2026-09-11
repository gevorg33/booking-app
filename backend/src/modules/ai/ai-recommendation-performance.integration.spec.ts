import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import { SUMMARIZE_RECOMMENDATION_PERFORMANCE_PROMPTS } from './ai-recommendation-performance.fixtures.js';
import { handleSummarizeRecommendationPerformanceLogic } from './ai-recommendation-performance.logic.js';
import { AI_COMMAND_EVAL_SUMMARIZE_RECOMMENDATION_PERFORMANCE_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai recommendation performance integration (ai-cmd-rec-9)', () => {
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
    serviceRepo: {
      find: jest.fn(async () => []),
    },
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(SUMMARIZE_RECOMMENDATION_PERFORMANCE_PROMPTS)(
    'rescues summarize_recommendation_performance for $id',
    ({ prompt, aspect }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('summarize_recommendation_performance');

      const params: Record<string, unknown> = {};
      if (aspect) params.aspect = aspect;

      const validation = validateCommand(
        makeResolvedCommand({
          action: 'summarize_recommendation_performance',
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

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_SUMMARIZE_RECOMMENDATION_PERFORMANCE_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it('executes logic for performance overview prompt', async () => {
    const result = await handleSummarizeRecommendationPerformanceLogic(
      deps() as any,
      'biz-1',
      { aspect: 'all' },
      'Summarize recommendation performance',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('CTR');
  });
});
